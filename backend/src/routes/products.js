const express = require('express');
const router = express.Router();
const { list, getOne, reviews } = require('../controllers/productController');
const { productLimiter } = require('../middleware/rateLimiter');

router.get('/', productLimiter, list);
router.get('/:id/reviews', productLimiter, reviews);
router.get('/:id', productLimiter, getOne);

module.exports = router;
