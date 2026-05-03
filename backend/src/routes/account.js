const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listWishlist,
  addWishlist,
  removeWishlist,
  listSaleNotifications,
  addSaleNotification,
  removeSaleNotification,
} = require('../controllers/accountController');

router.use(authMiddleware);

router.get('/wishlist', listWishlist);
router.post('/wishlist', addWishlist);
router.delete('/wishlist/:productId', removeWishlist);

router.get('/sale-notifications', listSaleNotifications);
router.post('/sale-notifications', addSaleNotification);
router.delete('/sale-notifications/:productId', removeSaleNotification);

module.exports = router;
