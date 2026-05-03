const express = require('express');
const router = express.Router();
const { message } = require('../controllers/chatController');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/message', chatLimiter, message);

module.exports = router;
