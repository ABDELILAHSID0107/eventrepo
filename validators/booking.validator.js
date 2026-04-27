const Joi = require('joi');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const createBooking = {
  body: Joi.object().keys({
    listingId: Joi.string().custom(objectId).required(),
    eventDate: Joi.date().iso().required(),
    eventEndDate: Joi.date().iso().min(Joi.ref('eventDate')),
    guestCount: Joi.number().integer().min(1),
    specialRequests: Joi.string().max(500).allow(''),
    addOns: Joi.array().items(
      Joi.object().keys({
        listingId: Joi.string().custom(objectId),
        price: Joi.number().min(0).required(),
        title: Joi.string(),
        category: Joi.string()
      })
    )
  })
};

const getBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const getBooking = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const actionBookingProvider = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const rejectCancelDisputeBooking = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().max(500).required()
  })
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  actionBookingProvider,
  rejectCancelDisputeBooking
};
