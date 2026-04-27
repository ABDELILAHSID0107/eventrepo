const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateProfile);
// The upload middleware will be attached here in Phase 3
router.patch('/me/avatar', userController.updateAvatar);
router.patch('/me/fcm-token', userController.saveFcmToken);
router.patch('/me/password', userController.updatePassword);

module.exports = router;
