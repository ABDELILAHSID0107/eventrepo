const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const config = require('../config/index');
const crypto = require('crypto');
// Import email service for Phase 3
const emailService = require('./email.service');

const generateAuthTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(400, 'Email already in use');
  }

  const user = await User.create(userData);
  const tokens = await generateAuthTokens(user);

  // Send welcome email (asynchronously, no need to await so it doesn't block response)
  emailService.sendWelcomeEmail(user.email, user.firstName).catch(err => console.error('Failed to send welcome email', err));
  
  // Clean up user object before returning
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, ...tokens };
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account deactivated');
  }

  user.lastLoginAt = Date.now();

  const tokens = await generateAuthTokens(user);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, ...tokens };
};

const loginWithFirebase = async (firebaseUser) => {
  let user = await User.findByFirebaseUid(firebaseUser.uid);

  if (!user) {
    // If we only have UID, we'll try to find by email
    if (firebaseUser.email) {
      user = await User.findOne({ email: firebaseUser.email });
      if (user) {
        user.firebaseUid = firebaseUser.uid;
        await user.save({ validateBeforeSave: false });
      }
    }
  }

  // If still no user, we could create one or throw an error.
  // The plan usually implies client registers first or we auto-register.
  // For safety, let's just make sure user exists.
  if (!user) {
    throw new ApiError(404, 'User not found. Please register first.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account deactivated');
  }

  user.lastLoginAt = Date.now();
  const tokens = await generateAuthTokens(user);

  const userObj = user.toObject();
  delete userObj.refreshToken;

  return { user: userObj, ...tokens };
};

const refreshAuth = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error();
    }

    // Refresh Tokens rotation would mean we generate new ones
    return await generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(401, 'Please authenticate with valid refresh token');
  }
};

const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }
};

const resetPasswordRequest = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't leak whether the email exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Send password reset email
  await emailService.sendPasswordResetEmail(user.email, resetToken);
  console.log(`Password reset email sent to ${user.email}`);
};

const resetPasswordProcess = async (resetToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
};

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  loginWithFirebase,
  refreshAuth,
  logoutUser,
  resetPasswordRequest,
  resetPasswordProcess
};
