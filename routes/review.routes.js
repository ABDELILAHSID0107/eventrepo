const express = require('express');
const reviewController = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const reviewValidator = require('../validators/review.validator');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');

const router = express.Router();

router.get('/listing/:listingId', validate(reviewValidator.getListingReviews), reviewController.getListingReviews);

router.use(auth);

router.post('/', authorize('client'), validate(reviewValidator.createReview), reviewController.createReview);
router.get('/me', authorize('client'), validate(reviewValidator.getMyReviews), reviewController.getMyReviews);
router.delete('/:id', authorize('client', 'admin'), validate(reviewValidator.deleteReview), reviewController.deleteReview);

module.exports = router;
