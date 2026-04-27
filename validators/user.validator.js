const Joi = require('joi');

const updateProfile = {
    body: Joi.object().keys({
        firstName: Joi.string().max(50),
        lastName: Joi.string().max(50),
        phone: Joi.string().pattern(/^(\+213|0)(5|6|7)\d{8}$/),
        preferredLang: Joi.string().valid('ar', 'fr', 'en')
    })
};

const updateAvatar = {
    body: Joi.object().keys({
        avatarUrl: Joi.string().uri() 
    })
};

const saveFcmToken = {
    body: Joi.object().keys({
        fcmToken: Joi.string().required()
    })
};

const updatePassword = {
    body: Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required().min(8)
    })
};

module.exports = {
    updateProfile,
    updateAvatar,
    saveFcmToken,
    updatePassword
};