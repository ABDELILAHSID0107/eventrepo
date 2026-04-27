const Joi = require('joi');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const getUsers = {
  query: Joi.object().keys({
    role: Joi.string().valid('client', 'provider', 'admin'),
    isVerified: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    isVerified: Joi.boolean(),
    isActive: Joi.boolean(),
    role: Joi.string().valid('client', 'provider', 'admin')
  }).min(1)
};

const getListings = {
  query: Joi.object().keys({
    isVerified: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const verifyListing = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    isVerified: Joi.boolean().required()
  })
};

const getBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending_payment','confirmed','in_progress','completed','cancelled','disputed'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const resolveDispute = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    resolution: Joi.string().valid('completed', 'cancelled').required(),
    reason: Joi.string().required()
  })
};

const getRevenue = {
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().min(Joi.ref('from'))
  })
};

module.exports = {
  getUsers,
  updateUser,
  getListings,
  verifyListing,
  getBookings,
  resolveDispute,
  getRevenue
};
