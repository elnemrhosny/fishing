import { verifyAccess, signAccess } from '../utils/jwt.js';
import { verifyRefresh } from '../utils/jwt.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_COOKIE_OPTIONS } from '../utils/cookies.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = verifyAccess(token);
    return next();
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Try refresh
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) return res.status(401).json({ error: 'Session expired' });
    try {
      const payload = verifyRefresh(refreshToken);
      const newAccess = signAccess({ id: payload.id, email: payload.email, role: payload.role, name: payload.name });
      res.cookie(ACCESS_COOKIE, newAccess, ACCESS_COOKIE_OPTIONS);
      req.user = { id: payload.id, email: payload.email, role: payload.role, name: payload.name };
      return next();
    } catch {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next();
  try {
    req.user = verifyAccess(token);
  } catch {
    // ignore
  }
  return next();
}
