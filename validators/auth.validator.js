const Joi = require('joi');

const register = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        firstName: Joi.string().required().max(50),
        lastName: Joi.string().required().max(50),
        phone: Joi.string().pattern(/^(\+213|0)(5|6|7)\d{8}$/).required(),
        role: Joi.string().valid('client', 'provider', 'admin').default('client')
    })
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    })
};

const firebaseLogin = {
    body: Joi.object().keys({
        firebaseIdToken: Joi.string().required()
    })
};

const refreshToken = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required()
    })
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().required().email()
    })
};

const resetPassword = {
    params: Joi.object().keys({
        token: Joi.string().required()
    }),
    body: Joi.object().keys({
        password: Joi.string().required().min(8),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    })
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required()
    })
};

module.exports = {
    register,
    login,
    firebaseLogin,
    refreshToken,
    forgotPassword,
    resetPassword,
    logout
};
