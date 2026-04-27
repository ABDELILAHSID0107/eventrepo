const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/asyncHandler');

const createBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: result });
});

const getBookings = asyncHandler(async (req, res) => {
  const filter = { status: req.query.status };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await bookingService.getBookings(req.user.id, req.user.role, filter, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ status: 'success', data: { booking } });
});

const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptBooking(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { booking } });
});

const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.rejectBooking(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ status: 'success', data: { booking } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id, req.user.role, req.body.reason);
  res.status(200).json({ status: 'success', data: { booking } });
});

const completeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { booking } });
});

const disputeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.disputeBooking(req.params.id, req.user.id, req.user.role, req.body.reason);
  res.status(200).json({ status: 'success', data: { booking } });
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  disputeBooking
};
