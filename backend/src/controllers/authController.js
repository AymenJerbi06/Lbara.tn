const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const audit = require('../utils/audit');
const emailService = require('../services/emailService');

function issueToken(user, res) {
  const payload = { id: user.id, email: user.email, is_admin: user.is_admin };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

async function register(req, res) {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }
  if (password.length > 128) {
    return res.status(400).json({ success: false, message: 'Password too long.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, is_admin`,
      [email.toLowerCase(), password_hash, full_name || null]
    );
    const user = result.rows[0];
    issueToken(user, res);
    await audit.log({ entityType: 'user', entityId: user.id, action: 'registered', actorId: user.id, actorType: 'user' });

    res.status(201).json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    issueToken(user, res);
    res.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, is_admin: user.is_admin } });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out.' });
}

async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, phone, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
}

async function requestPasswordChange(req, res) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const hash = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [hash, expires, req.user.id]
    );

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const email = userResult.rows[0].email;

    await emailService.sendPasswordChangeOTP(email, otp);
    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('[requestPasswordChange]', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code.' });
  }
}

async function confirmPasswordChange(req, res) {
  const { otp, new_password } = req.body;
  if (!otp || !new_password) {
    return res.status(400).json({ success: false, message: 'Code and new password are required.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  try {
    const result = await pool.query(
      'SELECT password_reset_token, password_reset_expires FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user.password_reset_token || !user.password_reset_expires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Request a new one.' });
    }
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
    }
    const valid = await bcrypt.compare(otp, user.password_reset_token);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [password_hash, req.user.id]
    );

    await audit.log({ entityType: 'user', entityId: req.user.id, action: 'password_changed', actorId: req.user.id, actorType: 'user' });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[confirmPasswordChange]', err);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    // Always respond OK to not leak whether email exists
    if (!result.rows[0]) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [hashedToken, expires, result.rows[0].id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;
    await emailService.sendPasswordResetLink(email.toLowerCase(), resetUrl);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }
}

async function resetPassword(req, res) {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  if (new_password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      'SELECT id, password_reset_expires FROM users WHERE password_reset_token = $1',
      [hashedToken]
    );
    const user = result.rows[0];

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    await audit.log({ entityType: 'user', entityId: user.id, action: 'password_reset', actorId: user.id, actorType: 'user' });
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
}

async function updateProfile(req, res) {
  const { full_name } = req.body;
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ success: false, message: 'Display name cannot be empty.' });
  }
  if (full_name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Display name is too long.' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name',
      [full_name.trim(), req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

module.exports = { register, login, logout, me, updateProfile, requestPasswordChange, confirmPasswordChange, forgotPassword, resetPassword };
