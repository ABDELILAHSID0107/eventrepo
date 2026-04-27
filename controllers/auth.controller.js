const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse'); // assuming it exists

const register = asyncHandler(async (req, res) => {
    const data = await authService.registerUser(req.body);
    res.status(201).json({
        status: 'success',
        data
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.loginUserWithEmailAndPassword(email, password);
    res.status(200).json({
        status: 'success',
        data
    });
});

const firebaseLogin = asyncHandler(async (req, res) => {
    const data = await authService.loginWithFirebase(req.firebaseUser);
    res.status(200).json({
        status: 'success',
        data
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const data = await authService.refreshAuth(req.body.refreshToken);
    res.status(200).json({
        status: 'success',
        data
    });
});

const forgotPassword = asyncHandler(async (req, res) => {
    await authService.resetPasswordRequest(req.body.email);
    res.status(200).json({
        status: 'success',
        message: 'Reset email sent'
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    await authService.resetPasswordProcess(req.params.token, req.body.password);
    res.status(200).json({
        status: 'success',
        message: 'Password reset successful'
    });
});

const logout = asyncHandler(async (req, res) => {
    await authService.logoutUser(req.body.refreshToken || req.user.refreshToken);
    res.status(200).json({
        status: 'success',
        message: 'Logged out'
    });
});

module.exports = {
    register,
    login,
    firebaseLogin,
    refreshToken,
    forgotPassword,
    resetPassword,
    logout
};
