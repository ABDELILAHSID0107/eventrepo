const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const Availability = require('../models/Availability');
const commissionService = require('./commission.service');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

const checkAvailability = async (listingId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);

  // Check if provider blocked the day explicitly
  const availability = await Availability.findOne({ 
    listing: listingId, 
    date: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });

  if (availability && availability.isFullDayBlocked) {
    throw new ApiError(400, 'Listing is blocked for this date');
  }

  // Check if there is an existing overlapping booking
  const existingBooking = await Booking.findOne({
    listing: listingId,
    eventDate: {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $in: ['confirmed', 'in_progress', 'completed'] }
  });

  if (existingBooking) {
    throw new ApiError(400, 'Listing is already booked for this date');
  }
};

const createBooking = async (clientId, bookingData) => {
  const listing = await Listing.findById(bookingData.listingId);
  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.provider.toString() === clientId.toString()) {
    throw new ApiError(400, 'Provider cannot book their own listing');
  }

  await checkAvailability(listing._id, bookingData.eventDate);

  // Base price
  let totalPrice = listing.priceRange.min; 
  
  if (bookingData.addOns && bookingData.addOns.length > 0) {
    bookingData.addOns.forEach(addon => {
      totalPrice += addon.price;
    });
  }

  const { depositAmount, commissionAmount } = commissionService.calculate(totalPrice);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now

  const newBooking = await Booking.create({
    client: clientId,
    provider: listing.provider,
    listing: listing._id,
    eventDate: bookingData.eventDate,
    eventEndDate: bookingData.eventEndDate,
    guestCount: bookingData.guestCount,
    specialRequests: bookingData.specialRequests,
    addOns: bookingData.addOns,
    status: 'pending_payment',
    totalPrice,
    depositAmount,
    commissionAmount,
    expiresAt
  });

  // Future Chargily integration will generate checkout URL
  const checkoutUrl = 'fake_checkout_url_pending_chargily';

  return { booking: newBooking, checkoutUrl };
};

const getBookings = async (userId, userRole, filterOptions, paginationOptions) => {
  const query = {};
  
  if (userRole === 'client') {
    query.client = userId;
  } else if (userRole === 'provider') {
    query.provider = userId;
  }

  if (filterOptions.status) {
    query.status = filterOptions.status;
  }

  paginationOptions.populate = [
    { path: 'listing', select: 'title coverImageUrl location address category' },
    { path: 'client', select: 'firstName lastName avatarUrl phone' },
    { path: 'provider', select: 'firstName lastName avatarUrl phone' }
  ];
  paginationOptions.sortBy = 'createdAt:desc';

  return await paginate(Booking, query, paginationOptions);
};

const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId)
    .populate('listing', 'title coverImageUrl location address category')
    .populate('client', 'firstName lastName avatarUrl phone email')
    .populate('provider', 'firstName lastName avatarUrl phone email');

  if (!booking) throw new ApiError(404, 'Booking not found');

  if (userRole !== 'admin' && booking.client._id.toString() !== userId.toString() && booking.provider._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'Not authorized to view this booking');
  }

  return booking;
};


const acceptBooking = async (bookingId, providerId) => {
  const booking = await getBookingById(bookingId, providerId, 'provider');
  
  if (booking.status !== 'pending_payment') {
    throw new ApiError(400, `Cannot accept booking with status: ${booking.status}`);
  }

  booking.status = 'confirmed';
  await booking.save();
  return booking;
};

const rejectBooking = async (bookingId, providerId, reason) => {
  const booking = await getBookingById(bookingId, providerId, 'provider');
  
  if (booking.status !== 'pending_payment') {
    throw new ApiError(400, `Cannot reject booking with status: ${booking.status}`);
  }

  booking.status = 'cancelled';
  booking.cancelledBy = 'provider';
  booking.cancellationReason = reason;
  await booking.save();
  return booking;
};

const cancelBooking = async (bookingId, userId, userRole, reason) => {
  const booking = await getBookingById(bookingId, userId, userRole);
  
  if (!['pending_payment', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel booking with status: ${booking.status}`);
  }

  booking.status = 'cancelled';
  booking.cancelledBy = userRole;
  booking.cancellationReason = reason;
  await booking.save();
  return booking;
};

const completeBooking = async (bookingId, providerId) => {
  const booking = await getBookingById(bookingId, providerId, 'provider');
  
  if (booking.status !== 'in_progress') {
    throw new ApiError(400, `Cannot complete booking with status: ${booking.status}`);
  }

  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();
  return booking;
};

const disputeBooking = async (bookingId, userId, userRole, reason) => {
  const booking = await getBookingById(bookingId, userId, userRole);
  
  if (booking.status !== 'in_progress') {
    throw new ApiError(400, `Cannot dispute booking with status: ${booking.status}`);
  }

  booking.status = 'disputed';
  booking.cancellationReason = reason;
  await booking.save();
  return booking;
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  disputeBooking
};
