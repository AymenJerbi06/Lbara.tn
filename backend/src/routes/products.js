const express = require('express');
const router = express.Router();
const { list, getOne } = require('../controllers/productController');
const { productLimiter } = require('../middleware/rateLimiter');

router.get('/', productLimiter, list);
router.get('/:id', productLimiter, getOne);

module.exports = router;
