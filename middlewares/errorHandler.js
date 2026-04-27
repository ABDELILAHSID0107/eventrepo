const config = require('../config');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error instanceof require('mongoose').Error ? 400 : 500);
        const message = error.message || 'Something went wrong';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    const { statusCode, message } = error;

    res.locals.errorMessage = err.message;

    const response = {
        code: statusCode,
        message,
        ...(config.env === 'development' && { stack: err.stack }),
    };

    if (config.env === 'development') {
        console.error(`[Error] ${statusCode} - ${message}`);
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
