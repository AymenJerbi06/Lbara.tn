const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { create, getOrder, myOrders, reviewOrder } = require('../controllers/orderController');

// Guest or logged-in users can place orders.
router.post('/', optionalAuthMiddleware, orderLimiter, create);
router.get('/my', authMiddleware, myOrders);
router.post('/:id/review', authMiddleware, reviewOrder);
// Full order details require an authenticated owner or admin.
router.get('/:id', authMiddleware, getOrder);

module.exports = router;
