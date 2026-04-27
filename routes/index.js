const express = require('express');
const router = express.Router();

// Define route modules here as they get created in future phases
const authRoute = require('./auth.routes');
const userRoute = require('./user.routes');
const listingRoute = require('./listing.routes');
const bookingRoute = require('./booking.routes');
const paymentRoute = require('./payment.routes');
const chatRoute = require('./chat.routes');
const reviewRoute = require('./review.routes');
const adminRoute = require('./admin.routes');

// Mount routes
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/listings', listingRoute);
router.use('/bookings', bookingRoute);
router.use('/payments', paymentRoute);
router.use('/chat', chatRoute);
router.use('/reviews', reviewRoute);
router.use('/admin', adminRoute);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
