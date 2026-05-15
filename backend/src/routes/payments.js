const express = require('express');
const router = express.Router();
const { verify, submitTestCard, webhookFlouci, webhookPaymee } = require('../controllers/paymentController');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { verifyLimiter, webhookLimiter } = require('../middleware/rateLimiter');

router.get('/verify/:order_id', optionalAuthMiddleware, verifyLimiter, verify);
router.post('/test-card/:order_id', optionalAuthMiddleware, verifyLimiter, submitTestCard);
router.post('/webhook/flouci', webhookLimiter, webhookFlouci);
router.post('/webhook/paymee', webhookLimiter, webhookPaymee);

module.exports = router;
