const jwt = require('jsonwebtoken');
const config = require('../config/index');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        let token;
    
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return next(new ApiError(401, 'Not authorized to access this route. Please login.'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError(401, 'The user belonging to this token does no longer exist.'));
        }

        if (!user.isActive) {
            return next(new ApiError(403, 'Your account has been deactivated. Please contact support.'));
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Token expired. Please refresh your token.'));
        }
        return next(new ApiError(401, 'Not authorized, token failed'));
    }
};

module.exports = auth;
