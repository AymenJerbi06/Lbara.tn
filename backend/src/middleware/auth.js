const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { publicAuthEnabled, emailVerificationRequired } = require('../config/previewMode');

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, is_admin, is_verified FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    if (!publicAuthEnabled() && !user.is_admin) {
      res.clearCookie('token');
      return res.status(403).json({ success: false, message: 'Customer accounts are currently closed during this preview.' });
    }
    if (emailVerificationRequired() && !user.is_admin && !user.is_verified) {
      res.clearCookie('token');
      return res.status(403).json({ success: false, message: 'Please verify your email before continuing.' });
    }
    req.user = { ...decoded, email: user.email, is_admin: user.is_admin, is_verified: user.is_verified };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

async function optionalAuthMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, is_admin, is_verified FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) {
      req.user = null;
      return next();
    }
    if (!publicAuthEnabled() && !user.is_admin) {
      req.user = null;
      return next();
    }
    if (emailVerificationRequired() && !user.is_admin && !user.is_verified) {
      req.user = null;
      return next();
    }
    req.user = { ...decoded, email: user.email, is_admin: user.is_admin, is_verified: user.is_verified };
  } catch {
    req.user = null;
  }
  next();
}

async function adminMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, is_admin FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.user = { ...decoded, is_admin: true };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = { authMiddleware, optionalAuthMiddleware, adminMiddleware };
