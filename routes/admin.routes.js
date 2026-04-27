const express = require('express');
const adminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate');
const adminValidator = require('../validators/admin.validator');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');

const router = express.Router();

router.use(auth, authorize('admin')); // Exclusively block out standard users & providers globally here

router.get('/stats', adminController.getStats);

router.get('/users', validate(adminValidator.getUsers), adminController.getUsers);
router.patch('/users/:id', validate(adminValidator.updateUser), adminController.updateUser);

router.get('/listings', validate(adminValidator.getListings), adminController.getListings);
router.patch('/listings/:id/verify', validate(adminValidator.verifyListing), adminController.verifyListing);

router.get('/bookings', validate(adminValidator.getBookings), adminController.getBookings);
router.patch('/bookings/:id/resolve', validate(adminValidator.resolveDispute), adminController.resolveDispute);

router.get('/revenue', validate(adminValidator.getRevenue), adminController.getRevenue);

module.exports = router;
