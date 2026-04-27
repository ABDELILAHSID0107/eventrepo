const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

const getStats = asyncHandler(async (req, res) => {
  const users = {
    total: await User.countDocuments(),
    providers: await User.countDocuments({ role: 'provider' }),
    clients: await User.countDocuments({ role: 'client' })
  };

  const listings = {
    total: await Listing.countDocuments(),
    active: await Listing.countDocuments({ isActive: true })
  };

  const bookings = {
    total: await Booking.countDocuments(),
    completed: await Booking.countDocuments({ status: 'completed' }),
    disputed: await Booking.countDocuments({ status: 'disputed' })
  };

  const revenueAgg = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalSales: { $sum: '$totalPrice' }, totalCommission: { $sum: '$commissionAmount' } } }
  ]);

  const revenue = revenueAgg.length > 0 ? {
    totalSales: revenueAgg[0].totalSales,
    totalCommission: revenueAgg[0].totalCommission
  } : { totalSales: 0, totalCommission: 0 };

  res.status(200).json({ status: 'success', data: { users, listings, bookings, revenue } });
});

const getUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified;

  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: 'createdAt:desc'
  };

  const result = await paginate(User, query, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  Object.assign(user, req.body);
  await user.save();

  res.status(200).json({ status: 'success', data: { user } });
});

const getListings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified;

  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: 'createdAt:desc',
    populate: { path: 'provider', select: 'firstName lastName email' }
  };

  const result = await paginate(Listing, query, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const verifyListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ApiError(404, 'Listing not found');

  listing.isVerified = req.body.isVerified;
  await listing.save();
  
  if (listing.isVerified) {
    const notificationService = require('../services/notification.service');
    await notificationService.notifyUser(listing.provider, {
       eventType: 'listing_verified',
       title: 'Listing Verified!',
       body: `Your listing "${listing.title}" is now officially verified on our platform.`,
       pushData: { listingId: listing._id.toString() }
    });
  }

  res.status(200).json({ status: 'success', data: { listing } });
});

const getBookings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: 'createdAt:desc',
    populate: [
      { path: 'client', select: 'firstName lastName' },
      { path: 'provider', select: 'firstName lastName' },
      { path: 'listing', select: 'title' }
    ]
  };

  const result = await paginate(Booking, query, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, reason } = req.body;
  
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'disputed') throw new ApiError(400, 'Booking is not disputed');

  booking.status = resolution; 
  booking.cancelledBy = 'admin'; 
  booking.cancellationReason = `Admin Resolution: ${reason}`;
  
  if (resolution === 'completed') {
    booking.completedAt = new Date();
  }

  await booking.save();

  res.status(200).json({ status: 'success', data: { booking } });
});

const getRevenue = asyncHandler(async (req, res) => {
  const query = { status: 'completed' };
  
  if (req.query.from || req.query.to) {
    query.completedAt = {};
    if (req.query.from) query.completedAt.$gte = new Date(req.query.from);
    if (req.query.to) query.completedAt.$lte = new Date(req.query.to);
  }

  const revenueAgg = await Booking.aggregate([
    { $match: query },
    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalCommission: { $sum: '$commissionAmount' } } }
  ]);

  const transactions = await Booking.find(query)
    .populate('client', 'firstName lastName')
    .populate('provider', 'firstName lastName')
    .select('totalPrice commissionAmount completedAt _id client provider')
    .sort({ completedAt: -1 })
    .limit(100);

  const stats = revenueAgg.length > 0 ? revenueAgg[0] : { totalRevenue: 0, totalCommission: 0 };
  
  res.status(200).json({ 
    status: 'success', 
    data: { 
      totalRevenue: stats.totalRevenue, 
      totalCommission: stats.totalCommission, 
      transactions 
    } 
  });
});

module.exports = {
  getStats,
  getUsers,
  updateUser,
  getListings,
  verifyListing,
  getBookings,
  resolveDispute,
  getRevenue
};
