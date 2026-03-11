const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

router.post('/', auth, orderController.createOrder);
router.get('/my', auth, orderController.getOrders);
router.get('/admin/all', auth, admin, orderController.getAllOrdersAdmin);

module.exports = router;
