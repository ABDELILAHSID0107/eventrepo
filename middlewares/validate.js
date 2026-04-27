const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    const validSchema = {};
    const dataToValidate = {};

    ['params', 'query', 'body'].forEach((key) => {
        if (schema[key]) {
            validSchema[key] = schema[key];
            dataToValidate[key] = req[key];
        }
    });

    const joiSchema = Joi.object(validSchema);
    const { value, error } = joiSchema.validate(dataToValidate, { 
        abortEarly: false,
        stripUnknown: true 
    });

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    }

    Object.assign(req, value);
    return next();
};

module.exports = validate;
