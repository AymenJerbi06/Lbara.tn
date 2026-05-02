const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { create, getOrder, myOrders } = require('../controllers/orderController');

// Guest or logged-in users can place orders.
router.post('/', optionalAuthMiddleware, orderLimiter, create);
router.get('/my', authMiddleware, myOrders);
// Full order details require an authenticated owner or admin.
router.get('/:id', authMiddleware, getOrder);

module.exports = router;
