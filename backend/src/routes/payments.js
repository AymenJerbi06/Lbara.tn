const express = require('express');
const router = express.Router();
const { verify, webhookFlouci, webhookPaymee } = require('../controllers/paymentController');
const { verifyLimiter } = require('../middleware/rateLimiter');

router.get('/verify/:order_id', verifyLimiter, verify);
router.post('/webhook/flouci', webhookFlouci);
router.post('/webhook/paymee', webhookPaymee);

module.exports = router;
