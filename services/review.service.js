const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

const createReview = async (clientId, reviewData) => {
  const { bookingId, rating, comment } = reviewData;

  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  
  if (booking.client.toString() !== clientId.toString()) {
    throw new ApiError(403, 'Only the client who made the booking can review it');
  }
  
  if (booking.status !== 'completed') {
    throw new ApiError(400, 'Cannot review an incomplete booking');
  }

  // Ensure review doesn't already exist
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ApiError(400, 'Review for this booking already exists');
  }

  const review = await Review.create({
    booking: bookingId,
    listing: booking.listing,
    client: clientId,
    provider: booking.provider,
    rating,
    comment
  });

  // Attach record to booking model natively
  booking.reviewId = review._id;
  await booking.save();

  return review;
};

const getReviewsForListing = async (listingId, options) => {
  return await paginate(Review, { listing: listingId, isPublic: true }, {
    ...options,
    populate: { path: 'client', select: 'firstName lastName avatarUrl' }
  });
};

const getReviewsByClient = async (clientId, options) => {
  return await paginate(Review, { client: clientId }, {
    ...options,
    populate: { path: 'listing', select: 'title coverImageUrl' } 
  });
};

const deleteReview = async (reviewId, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.client.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this review');
  }

  await Review.deleteOne({ _id: reviewId });

  // Manually trigger the post-delete/post-remove rating recalculation since Model.deleteOne won't fire post('save') native middleware
  const Listing = require('../models/Listing');
  const stats = await Review.aggregate([
    { $match: { listing: review.listing, isPublic: true } },
    { $group: { _id: '$listing', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Listing.findByIdAndUpdate(review.listing, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  } else {
    await Listing.findByIdAndUpdate(review.listing, { rating: 0, reviewCount: 0 });
  }
};

module.exports = {
  createReview,
  getReviewsForListing,
  getReviewsByClient,
  deleteReview
};
