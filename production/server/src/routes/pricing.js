const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { auth, admin } = require('../middleware/auth');

router.get('/', pricingController.getPricing);
router.put('/', auth, admin, pricingController.updatePricing);

module.exports = router;
