const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');
const { register, login, logout, me, updateProfile, requestPasswordChange, confirmPasswordChange } = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);
router.post('/request-password-change', authMiddleware, authLimiter, requestPasswordChange);
router.post('/confirm-password-change', authMiddleware, authLimiter, confirmPasswordChange);

module.exports = router;
