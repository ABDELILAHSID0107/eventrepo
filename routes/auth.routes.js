const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authValidator = require('../validators/auth.validator');
const firebaseAuth = require('../middlewares/firebaseAuth');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validate(authValidator.register), authController.register);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/firebase-login', validate(authValidator.firebaseLogin), firebaseAuth, authController.firebaseLogin);
router.post('/refresh-token', validate(authValidator.refreshToken), authController.refreshToken);
router.post('/forgot-password', validate(authValidator.forgotPassword), authController.forgotPassword);
router.patch('/reset-password/:token', validate(authValidator.resetPassword), authController.resetPassword);
router.post('/logout', authMiddleware, validate(authValidator.logout), authController.logout);

module.exports = router;