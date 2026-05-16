const express = require('express');
const router = express.Router();
const { list, getOne, reviews, trackView } = require('../controllers/productController');
const { productLimiter } = require('../middleware/rateLimiter');
const { optionalAuthMiddleware } = require('../middleware/auth');

router.get('/', productLimiter, list);
router.get('/:id/reviews', productLimiter, reviews);
router.post('/:id/view', optionalAuthMiddleware, productLimiter, trackView);
router.get('/:id', productLimiter, getOne);

module.exports = router;
