const express = require('express');
const paymentController = require('../controllers/payment.controller');
const auth = require('../middlewares/auth');

const router = express.Router();

// The webhook Route happens in app.js explicitly, to run before `express.json()`
// Protected API below:
router.use(auth);

router.post('/checkout', paymentController.createCheckout);
router.get('/:bookingId', paymentController.getPaymentByBooking);

module.exports = router;
