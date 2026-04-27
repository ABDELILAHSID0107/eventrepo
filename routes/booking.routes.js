const express = require('express');
const bookingController = require('../controllers/booking.controller');
const validate = require('../middlewares/validate');
const bookingValidator = require('../validators/booking.validator');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  authorize('client'),
  validate(bookingValidator.createBooking),
  bookingController.createBooking
);

router.get(
  '/',
  authorize('client', 'provider', 'admin'),
  validate(bookingValidator.getBookings),
  bookingController.getBookings
);

router.get(
  '/:id',
  authorize('client', 'provider', 'admin'),
  validate(bookingValidator.getBooking),
  bookingController.getBooking
);

router.patch(
  '/:id/accept',
  authorize('provider'),
  validate(bookingValidator.actionBookingProvider),
  bookingController.acceptBooking
);

router.patch(
  '/:id/reject',
  authorize('provider'),
  validate(bookingValidator.rejectCancelDisputeBooking),
  bookingController.rejectBooking
);

router.patch(
  '/:id/cancel',
  authorize('client', 'provider'),
  validate(bookingValidator.rejectCancelDisputeBooking),
  bookingController.cancelBooking
);

router.patch(
  '/:id/complete',
  authorize('provider'),
  validate(bookingValidator.actionBookingProvider),
  bookingController.completeBooking
);

router.patch(
  '/:id/dispute',
  authorize('client', 'provider'),
  validate(bookingValidator.rejectCancelDisputeBooking),
  bookingController.disputeBooking
);

module.exports = router;
