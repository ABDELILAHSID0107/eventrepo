const Joi = require('joi');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const createReview = {
  body: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).allow('')
  })
};

const getListingReviews = {
  params: Joi.object().keys({
    listingId: Joi.string().custom(objectId).required()
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string()
  })
};

const getMyReviews = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const deleteReview = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

module.exports = {
  createReview,
  getListingReviews,
  getMyReviews,
  deleteReview
};
