const chargilyService = require('../services/chargily.service');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createCheckout = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.client.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to pay for this booking');
  }

  if (booking.status !== 'pending_payment') {
    throw new ApiError(400, `Booking is ${booking.status}`);
  }

  const checkout = await chargilyService.createCheckout(booking);

  // create a pending payment record
  await Payment.create({
    booking: booking._id,
    client: booking.client,
    provider: booking.provider,
    chargilyCheckoutId: checkout.id,
    amount: booking.depositAmount,
    currency: 'DZD',
    status: 'pending'
  });

  // Also store checkout ID back on booking for easier lookup
  booking.chargilyCheckoutId = checkout.id;
  await booking.save();

  res.status(200).json({ status: 'success', data: { checkoutUrl: checkout.checkout_url } });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['signature'];
  const rawBody = req.body; // Needs to be buffer (setup via express.raw())

  // Verify Signature
  const isValid = chargilyService.verifySignature(rawBody, signature);
  if (!isValid) {
    // Return early without throwing error to prevent continuous retries
    return res.status(403).json({ received: false, error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString('utf8'));

  if (event.type === 'checkout.paid') {
    const checkoutData = event.data;
    const checkoutId = checkoutData.id;

    // Update Payment
    const payment = await Payment.findOne({ chargilyCheckoutId: checkoutId });
    if (payment) {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.method = checkoutData.payment_method;
      payment.metadata = checkoutData;
      await payment.save();

      // Update Booking
      const booking = await Booking.findById(payment.booking);
      if (booking && booking.status === 'pending_payment') {
        booking.status = 'confirmed';
        booking.paymentId = payment._id;
        await booking.save();
      }
    }
  } else if (event.type === 'checkout.failed' || event.type === 'checkout.canceled') {
     const checkoutId = event.data.id;
     const payment = await Payment.findOne({ chargilyCheckoutId: checkoutId });
     if (payment) {
       payment.status = 'failed';
       await payment.save();
     }
  }

  res.status(200).json({ received: true });
});

const getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const payment = await Payment.findOne({ booking: bookingId });
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.client.toString() !== req.user.id.toString() && 
      payment.provider.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }

  res.status(200).json({ status: 'success', data: { payment } });
});

module.exports = {
  createCheckout,
  handleWebhook,
  getPaymentByBooking
};
