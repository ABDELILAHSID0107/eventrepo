const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { review } });
});

const getListingReviews = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: req.query.sort || 'createdAt:desc'
  };
  const result = await reviewService.getReviewsForListing(req.params.listingId, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const getMyReviews = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: 'createdAt:desc'
  };
  const result = await reviewService.getReviewsByClient(req.user.id, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
  res.status(204).send();
});

module.exports = {
  createReview,
  getListingReviews,
  getMyReviews,
  deleteReview
};
