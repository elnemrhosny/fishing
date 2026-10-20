import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Development fallback: logs email content to console
    transporter = {
      sendMail: async (opts) => {
        console.log('\n--- [EMAIL SERVICE (DEV MOCK)] ---');
        console.log(`To: ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(`Text preview: ${opts.text?.slice(0, 200)}...`);
        console.log('--- [END EMAIL MOCK] ---\n');
        return { messageId: 'mock-id-' + Date.now() };
      },
    };
  }

  return transporter;
}

export async function sendVerificationEmail({ email, name, token }) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const from = process.env.FROM_EMAIL || '"FishingPro" <noreply@fishingpro.com>';

  const mailOptions = {
    from,
    to: email,
    subject: 'Verify your email address - تأكيد البريد الإلكتروني | FishingPro',
    text: `Hello ${name},\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\n---\nمرحباً ${name}، يرجى تأكيد بريدك الإلكتروني من خلال الرابط أعلاه. ينتهي الرابط خلال 24 ساعة.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">🎣 FishingPro</h2>
        <h3 style="color: #1f2937;">Verify your email / تأكيد البريد الإلكتروني</h3>
        <p style="color: #4b5563;">Hello <strong>${name}</strong>,</p>
        <p style="color: #4b5563;">Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Verify Email / تأكيد الحساب
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">If button doesn't work, copy and paste this link: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #9ca3af; font-size: 13px;">This link will expire in 24 hours.</p>
      </div>
    `,
  };

  const transport = getTransporter();
  return transport.sendMail(mailOptions);
}

export async function sendPasswordResetEmail({ email, name, token }) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const from = process.env.FROM_EMAIL || '"FishingPro" <noreply@fishingpro.com>';

  const mailOptions = {
    from,
    to: email,
    subject: 'Reset your password - إعادة تعيين كلمة المرور | FishingPro',
    text: `Hello ${name},\n\nYou requested to reset your password. Please use this link:\n${resetUrl}\n\nThis link expires in 1 hour.\nIf you did not request this, please ignore this email.\n\n---\nمرحباً ${name}، لقد طلبت إعادة تعيين كلمة المرور. ينتهي الرابط خلال ساعة واحدة.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">🎣 FishingPro</h2>
        <h3 style="color: #1f2937;">Password Reset / إعادة تعيين كلمة المرور</h3>
        <p style="color: #4b5563;">Hello <strong>${name}</strong>,</p>
        <p style="color: #4b5563;">We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset Password / إعادة تعيين
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">If button doesn't work, copy and paste this link: <br/><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #9ca3af; font-size: 13px;">This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  const transport = getTransporter();
  return transport.sendMail(mailOptions);
}
