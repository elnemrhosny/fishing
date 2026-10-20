import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '../db/client.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js';
import {
  ACCESS_COOKIE, REFRESH_COOKIE,
  ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS,
  clearAuthCookies
} from '../utils/cookies.js';
import { requireAuth } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function issueTokens(res, user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    is_verified: Number(user.is_verified) || 0,
  };
  const access = signAccess(payload);
  const refresh = signRefresh(payload);
  res.cookie(ACCESS_COOKIE, access, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_COOKIE, refresh, REFRESH_COOKIE_OPTIONS);
  return payload;
}

// Register
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    const db = getDb();

    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, role, is_verified, verification_token, verification_expires)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [id, email, hash, name, 'customer', verificationToken, verificationExpires],
    });

    try {
      await sendVerificationEmail({ email, name, token: verificationToken });
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    const user = { id, email, role: 'customer', name, is_verified: 0 };
    const payload = issueTokens(res, user);
    res.status(201).json({
      user: payload,
      requiresVerification: true,
      message: 'Account created! Please check your email to verify your account.',
    });
  }
);

// Verify Email
router.post('/verify-email',
  body('token').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Token is required' });

    const { token } = req.body;
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE verification_token = ?',
      args: [token],
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already used verification token' });
    }

    const user = result.rows[0];

    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    await db.execute({
      sql: 'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      args: [user.id],
    });

    const updatedUser = { ...user, is_verified: 1 };
    const payload = issueTokens(res, updatedUser);

    res.json({
      success: true,
      user: payload,
      message: 'Email successfully verified!',
    });
  }
);

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  if (user.is_verified) {
    return res.status(400).json({ error: 'Email is already verified' });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: 'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
    args: [verificationToken, verificationExpires, user.id],
  });

  try {
    await sendVerificationEmail({ email: user.email, name: user.name, token: verificationToken });
  } catch (mailErr) {
    console.error('Failed to resend verification email:', mailErr);
  }

  res.json({ message: 'Verification email has been resent.' });
});

// Forgot Password
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Valid email is required' });

    const { email } = req.body;
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await db.execute({
        sql: 'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
        args: [resetToken, resetExpires, user.id],
      });

      try {
        await sendPasswordResetEmail({ email: user.email, name: user.name, token: resetToken });
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr);
      }
    }

    res.json({
      message: 'If an account with that email exists, password reset instructions have been sent.',
    });
  }
);

// Reset Password
router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, password } = req.body;
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE reset_token = ?',
      args: [token],
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const user = result.rows[0];

    if (user.reset_expires && new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Password reset token has expired' });
    }

    const hash = await bcrypt.hash(password, 12);
    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      args: [hash, user.id],
    });

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  }
);

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const db = getDb();

    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = issueTokens(res, user);
    res.json({ user: payload });
  }
);

// Google OAuth (ID token flow)
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) return res.status(400).json({ error: 'Email not verified by Google' });

    const db = getDb();
    let user;

    const byGoogle = await db.execute({ sql: 'SELECT * FROM users WHERE google_id = ?', args: [googleId] });
    if (byGoogle.rows.length > 0) {
      user = byGoogle.rows[0];
    } else {
      const byEmail = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      if (byEmail.rows.length > 0) {
        user = byEmail.rows[0];
        await db.execute({
          sql: 'UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?',
          args: [googleId, user.id]
        });
        user.is_verified = 1;
      } else {
        const id = uuidv4();
        await db.execute({
          sql: 'INSERT INTO users (id, email, name, role, google_id, is_verified) VALUES (?, ?, ?, ?, ?, 1)',
          args: [id, email, name || email, 'customer', googleId],
        });
        user = { id, email, name: name || email, role: 'customer', is_verified: 1 };
      }
    }

    const tokenPayload = issueTokens(res, user);
    res.json({ user: tokenPayload });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// Refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = verifyRefresh(token);
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [payload.id] });
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = result.rows[0];
    const newPayload = issueTokens(res, user);
    res.json({ user: newPayload });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

export default router;
