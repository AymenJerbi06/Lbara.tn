const express = require('express');
const router = express.Router();
const { authLimiter, verifyLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/logout', (req, res) => { res.clearCookie('token'); res.redirect('/login.html'); });
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile', authMiddleware, updateProfile);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/verify-email', authLimiter, verifyEmail);
router.post('/verify-email-code', verifyLimiter, verifyEmailCode);
router.post('/resend-verification', authLimiter, resendVerificationCode);
router.post('/request-password-change', authMiddleware, authLimiter, requestPasswordChange);
router.post('/confirm-password-change', authMiddleware, authLimiter, confirmPasswordChange);

module.exports = router;
