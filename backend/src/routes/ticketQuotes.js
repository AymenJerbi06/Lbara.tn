const express = require('express');
const router = express.Router();
const { optionalAuthMiddleware } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { getQuote, checkoutQuote } = require('../controllers/ticketQuoteController');

router.get('/:token', optionalAuthMiddleware, getQuote);
router.post('/:token/checkout', optionalAuthMiddleware, orderLimiter, checkoutQuote);

module.exports = router;
