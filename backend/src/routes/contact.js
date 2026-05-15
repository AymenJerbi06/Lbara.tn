const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');
const { submit } = require('../controllers/contactController');

router.post('/', authMiddleware, contactLimiter, submit);

module.exports = router;
