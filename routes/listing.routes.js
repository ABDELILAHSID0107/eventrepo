const express = require('express');
const listingController = require('../controllers/listing.controller');
const validate = require('../middlewares/validate');
const listingValidator = require('../validators/listing.validator');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');
const upload = require('../middlewares/upload');

const router = express.Router();

// Public routes
router.get('/', validate(listingValidator.getListings), listingController.getListings);
router.get('/geo-search', validate(listingValidator.getGeoSearch), listingController.getGeoSearch);
router.get('/:id', validate(listingValidator.getListing), listingController.getListing);
router.get('/:id/availability', validate(listingValidator.getAvailability), listingController.getAvailability);

// Protected routes
router.use(auth);

router.post(
  '/',
  authorize('provider'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'panorama', maxCount: 3 }
  ]),
  validate(listingValidator.createListing),
  listingController.createListing
);

router.patch(
  '/:id',
  authorize('provider', 'admin'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  validate(listingValidator.updateListing),
  listingController.updateListing
);

router.delete('/:id', authorize('provider', 'admin'), validate(listingValidator.deleteListing), listingController.deleteListing);

router.post(
  '/:id/availability',
  authorize('provider'),
  validate(listingValidator.createAvailability),
  listingController.createAvailability
);

router.patch(
  '/:id/availability/:slotId',
  authorize('provider'),
  validate(listingValidator.updateAvailability),
  listingController.updateAvailability
);

router.delete(
  '/:id/availability/:slotId',
  authorize('provider'),
  validate(listingValidator.deleteAvailability),
  listingController.deleteAvailability
);

module.exports = router;
