const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, preferredLang } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { firstName, lastName, phone, preferredLang },
        { new: true, runValidators: true }
    );

    res.status(200).json({ status: 'success', data: { user } });
});

const updateAvatar = asyncHandler(async (req, res) => {
  // Mock logic assuming upload middleware handles the multipart and puts URL in req.file.path or similar
    const avatarUrl = req.file ? req.file.path : req.body.avatarUrl;
  
    if (!avatarUrl) {
        throw new ApiError(400, 'Please provide an avatar image');
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatarUrl },
        { new: true }
    );

    res.status(200).json({ status: 'success', data: { user } });
});

const saveFcmToken = asyncHandler(async (req, res) => {
    const { fcmToken } = req.body;
    if (!fcmToken) {
        throw new ApiError(400, 'FCM token required');
    }

    await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { fcmTokens: fcmToken } }
    );

    res.status(200).json({ status: 'success', message: 'Token saved' });
});

const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
  
    const user = await User.findById(req.user.id).select('+password');
  
    if (!(await user.comparePassword(currentPassword))) {
        throw new ApiError(401, 'Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Password updated' });
});

module.exports = {
    getMe,
    updateProfile,
    updateAvatar,
    saveFcmToken,
    updatePassword
};
