const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/auth');
const {
  listOrders, fulfillOrder, updateOrderStatus,
  listProducts, createProduct, updateProduct,
  listMessages, stats,
} = require('../controllers/adminController');

// All admin routes require admin auth
router.use(adminMiddleware);

router.get('/stats', stats);
router.get('/orders', listOrders);
router.put('/orders/:id/fulfill', fulfillOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.get('/messages', listMessages);

module.exports = router;
