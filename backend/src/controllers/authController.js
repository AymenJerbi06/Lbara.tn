const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const audit = require('../utils/audit');
const emailService = require('../services/emailService');
const { publicAuthEnabled, emailVerificationRequired } = require('../config/previewMode');
const {
  badRequest,
  rejectUnexpectedFields,
  cleanString,
  cleanEmail,
  cleanEnum,
  cleanPassword,
  cleanPhone,
  handleValidationError,
} = require('../utils/validation');

const PREVIEW_AUTH_MESSAGE = 'Customer accounts are currently closed during this preview. Only the admin account can log in.';
const GENERIC_RESET_MESSAGE = 'If that email exists, a reset link has been sent.';
const PROFILE_FIELDS = [
  'full_name',
  'phone',
  'city',
  'preferred_language',
];

function frontendUrl(path) {
  return `${process.env.FRONTEND_URL || 'http://localhost:3025'}${path}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createEmailVerification(userId, email) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
    [hashedToken, expires, userId]
  );

  await emailService.sendEmailVerificationLink(email, frontendUrl(`/api/auth/verify-email?token=${rawToken}`));
}

async function createEmailVerificationCode(userId, email) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 20 * 60 * 1000);

  await pool.query(
    'UPDATE users SET email_verification_token = $1, email_verification_expires = $2, updated_at = NOW() WHERE id = $3',
    [`otp:${hashedCode}`, expires, userId]
  );

  await emailService.sendEmailVerificationOTP(email, code);
}

function cleanProfileFields(body, { requireName = false } = {}) {
  return {
    full_name: cleanString(body.full_name, { label: 'Full name', required: requireName, max: 100 }),
    phone: cleanPhone(body.phone),
    city: cleanString(body.city, { label: 'City', required: false, max: 100 }),
    preferred_language: cleanEnum(body.preferred_language || 'en', ['en', 'fr', 'ar'], { label: 'Preferred language', required: false }) || 'en',
  };
}

function issueToken(user, res) {
  const payload = { id: user.id, email: user.email, is_admin: user.is_admin, is_verified: user.is_verified };
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
  if (!publicAuthEnabled()) {
    return res.status(403).json({ success: false, message: 'Sign-up is currently closed during this preview.' });
  }

  try {
    rejectUnexpectedFields(req.body, ['email', 'password', ...PROFILE_FIELDS], 'Registration');
    const email = cleanEmail(req.body.email);
    const password = cleanPassword(req.body.password);
    const profile = cleanProfileFields(req.body, { requireName: false });
    const verificationRequired = emailVerificationRequired();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (
         email, password_hash, full_name, phone, city, preferred_language, is_verified
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, phone, city, preferred_language, is_admin, is_verified`,
      [
        email,
        password_hash,
        profile.full_name,
        profile.phone,
        profile.city,
        profile.preferred_language,
        !verificationRequired,
      ]
    );
    const user = result.rows[0];
    let emailDeliveryFailed = false;
    let emailDeliveryMessage = null;

    if (verificationRequired) {
      try {
        await createEmailVerificationCode(user.id, user.email);
      } catch (emailErr) {
        console.error('[register verification email]', emailErr.message);
        emailDeliveryFailed = true;
        emailDeliveryMessage = emailErr.message;
      }
    } else {
      issueToken(user, res);
    }

    await audit.log({ entityType: 'user', entityId: user.id, action: 'registered', actorId: user.id, actorType: 'user' });

    res.status(201).json({
      success: true,
      verification_required: verificationRequired,
      email_delivery_failed: emailDeliveryFailed,
      email_delivery_message: process.env.NODE_ENV === 'production' ? undefined : emailDeliveryMessage,
      message: verificationRequired
        ? (emailDeliveryFailed
          ? 'Account created, but the verification email could not be sent. Please try resending the code in a moment.'
          : 'Account created. Please verify your email before logging in.')
        : 'Account created.',
      user,
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[register]', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
}

async function login(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['email', 'password'], 'Login');
    const email = cleanEmail(req.body.email);
    const password = cleanPassword(req.body.password, { label: 'Password', min: 1 });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      console.warn(`[auth] Failed login for ${email} from ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!publicAuthEnabled() && !user.is_admin) {
      res.clearCookie('token');
      return res.status(403).json({ success: false, message: PREVIEW_AUTH_MESSAGE });
    }
    if (emailVerificationRequired() && !user.is_admin && !user.is_verified) {
      return res.status(403).json({
        success: false,
        verification_required: true,
        email: user.email,
        message: 'Please verify your email before logging in.',
      });
    }

    issueToken(user, res);
    console.info(`[auth] Login success for ${user.email} from ${req.ip}`);
    res.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, city: user.city, preferred_language: user.preferred_language, is_admin: user.is_admin } });
  } catch (err) {
    if (handleValidationError(err, res)) return;
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
      `SELECT id, email, full_name, phone, city, preferred_language, is_admin, is_verified, created_at
       FROM users
       WHERE id = $1`,
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
    rejectUnexpectedFields(req.body || {}, [], 'Password change request');
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
    if (handleValidationError(err, res)) return;
    console.error('[requestPasswordChange]', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code.' });
  }
}

async function confirmPasswordChange(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['otp', 'new_password'], 'Password change');
    const otp = cleanString(req.body.otp, { label: 'Verification code', required: true, min: 6, max: 6 });
    if (!/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
    const newPassword = cleanPassword(req.body.new_password, { label: 'New password' });

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

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [password_hash, req.user.id]
    );

    await audit.log({ entityType: 'user', entityId: req.user.id, action: 'password_changed', actorId: req.user.id, actorType: 'user' });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[confirmPasswordChange]', err);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
}

async function forgotPassword(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['email'], 'Password reset request');
    const email = cleanEmail(req.body.email);
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always respond OK to not leak whether email exists
    if (!result.rows[0]) return res.json({ success: true, message: GENERIC_RESET_MESSAGE });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [hashedToken, expires, result.rows[0].id]
    );

    const resetUrl = frontendUrl(`/reset-password.html?token=${rawToken}`);
    await emailService.sendPasswordResetLink(email, resetUrl);

    res.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[forgotPassword]', err);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }
}

async function resetPassword(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['token', 'new_password'], 'Password reset');
    const token = cleanString(req.body.token, { label: 'Reset token', required: true, min: 32, max: 128 });
    const newPassword = cleanPassword(req.body.new_password, { label: 'New password' });
    const hashedToken = hashToken(token);
    const result = await pool.query(
      'SELECT id, password_reset_expires FROM users WHERE password_reset_token = $1',
      [hashedToken]
    );
    const user = result.rows[0];

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    await audit.log({ entityType: 'user', entityId: user.id, action: 'password_reset', actorId: user.id, actorType: 'user' });
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[resetPassword]', err);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
}

async function verifyEmail(req, res) {
  try {
    const token = cleanString(req.query.token, { label: 'Verification token', required: true, min: 32, max: 128 });
    const hashedToken = hashToken(token);
    const result = await pool.query(
      `UPDATE users
       SET is_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()
       RETURNING id`,
      [hashedToken]
    );

    if (!result.rows[0]) {
      return res.redirect('/login.html?verified=invalid');
    }

    await audit.log({ entityType: 'user', entityId: result.rows[0].id, action: 'email_verified', actorId: result.rows[0].id, actorType: 'user' });
    return res.redirect('/login.html?verified=1');
  } catch (err) {
    console.error('[verifyEmail]', err.message);
    return res.redirect('/login.html?verified=invalid');
  }
}

async function verifyEmailCode(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['email', 'code'], 'Email verification');
    const email = cleanEmail(req.body.email);
    const code = cleanString(req.body.code, { label: 'Verification code', required: true, min: 6, max: 6 });
    if (!/^[0-9]{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const result = await pool.query(
      'SELECT id, is_verified, email_verification_token, email_verification_expires FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    if (user.is_verified) return res.json({ success: true, message: 'Email already verified.' });
    if (!user.email_verification_token || !user.email_verification_expires || new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
    }
    if (!user.email_verification_token.startsWith('otp:')) {
      return res.status(400).json({ success: false, message: 'This account needs a new verification code.' });
    }

    const valid = await bcrypt.compare(code, user.email_verification_token.slice(4));
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    await pool.query(
      `UPDATE users
       SET is_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    await audit.log({ entityType: 'user', entityId: user.id, action: 'email_verified', actorId: user.id, actorType: 'user' });
    return res.json({ success: true, message: 'Email verified. You can log in now.' });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[verifyEmailCode]', err);
    return res.status(500).json({ success: false, message: 'Failed to verify email.' });
  }
}

async function resendVerificationCode(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['email'], 'Resend verification');
    const email = cleanEmail(req.body.email);
    const result = await pool.query('SELECT id, email, is_verified FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.json({ success: true, message: 'If this account exists, a verification code has been sent.' });
    }
    if (user.is_verified) {
      return res.json({ success: true, message: 'This email is already verified.' });
    }

    await createEmailVerificationCode(user.id, user.email);
    res.json({ success: true, message: 'Verification code sent. Check your email.' });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[resendVerificationCode]', err);
    res.status(503).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Could not send a verification code right now.'
        : `Could not send a verification code right now: ${err.message}`,
    });
  }
}

async function updateProfile(req, res) {
  try {
    rejectUnexpectedFields(req.body, PROFILE_FIELDS, 'Profile update');
    const body = req.body || {};
    const setters = [];
    const values = [];
    const add = (field, value) => {
      values.push(value);
      setters.push(`${field} = $${values.length}`);
    };

    if (Object.prototype.hasOwnProperty.call(body, 'full_name')) add('full_name', cleanString(body.full_name, { label: 'Display name', required: true, max: 100 }));
    if (Object.prototype.hasOwnProperty.call(body, 'phone')) add('phone', cleanPhone(body.phone));
    if (Object.prototype.hasOwnProperty.call(body, 'city')) add('city', cleanString(body.city, { label: 'City', required: false, max: 100 }));
    if (Object.prototype.hasOwnProperty.call(body, 'preferred_language')) add('preferred_language', cleanEnum(body.preferred_language, ['en', 'fr', 'ar'], { label: 'Preferred language', required: false }));

    if (!setters.length) throw badRequest('Profile update contains no editable fields.');

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users
       SET ${setters.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, email, full_name, phone, city, preferred_language, is_admin, is_verified`,
      values
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[updateProfile]', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  requestPasswordChange,
  confirmPasswordChange,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyEmailCode,
  resendVerificationCode,
};
