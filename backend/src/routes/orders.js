const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { create, getOrder, myOrders } = require('../controllers/orderController');

// Guest or logged-in users can place orders
router.post('/', orderLimiter, create);
// Get a specific order (auth optional — guest orders tracked by session)
router.get('/my', authMiddleware, myOrders);
router.get('/:id', getOrder);

module.exports = router;
