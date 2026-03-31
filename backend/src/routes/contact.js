const express = require('express');
const router = express.Router();
const { contactLimiter } = require('../middleware/rateLimiter');
const { submit } = require('../controllers/contactController');

router.post('/', contactLimiter, submit);

module.exports = router;
