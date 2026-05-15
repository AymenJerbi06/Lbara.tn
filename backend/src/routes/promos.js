const express = require('express');
const router = express.Router();
const { validatePromo } = require('../controllers/promoController');

router.post('/validate', validatePromo);

module.exports = router;
