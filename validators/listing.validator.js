const Joi = require('joi');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

// Sub-schemas for JSON parsed fields (since multer parses multipart as strings payload)
const addressSchema = Joi.object({
  street: Joi.string().allow(''),
  city: Joi.string().required(),
  wilaya: Joi.string().required(),
  postalCode: Joi.string().allow('')
});

const priceRangeSchema = Joi.object({
  min: Joi.number().min(0).required(),
  max: Joi.number().min(0).greater(Joi.ref('min')).required(),
  currency: Joi.string().valid('DZD').default('DZD')
});

const capacitySchema = Joi.object({
  min: Joi.number().min(1).default(1),
  max: Joi.number().min(1).greater(Joi.ref('min')).required()
});

const createListing = {
  body: Joi.object().keys({
    title: Joi.string().max(120).required(),
    description: Joi.string().max(2000).required(),
    category: Joi.string().valid('venue', 'photographer', 'dj', 'caterer', 'decorator', 'other').required(),
    subcategory: Joi.string().max(60).allow(''),
    // These might come as JSON strings in formData, so we allow string and rely on a middleware to parse OR allow object
    address: Joi.alternatives().try(Joi.string(), addressSchema).required(),
    priceRange: Joi.alternatives().try(Joi.string(), priceRangeSchema).required(),
    capacity: Joi.alternatives().try(Joi.string(), capacitySchema).required(),
    amenities: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))
  })
};

const updateListing = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().max(120),
    description: Joi.string().max(2000),
    category: Joi.string().valid('venue', 'photographer', 'dj', 'caterer', 'decorator', 'other'),
    subcategory: Joi.string().max(60).allow(''),
    address: Joi.alternatives().try(Joi.string(), addressSchema),
    priceRange: Joi.alternatives().try(Joi.string(), priceRangeSchema),
    capacity: Joi.alternatives().try(Joi.string(), capacitySchema),
    amenities: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    deleteImages: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))
  }).min(1)
};

const getListings = {
  query: Joi.object().keys({
    category: Joi.string(),
    wilaya: Joi.string(),
    minPrice: Joi.number(),
    maxPrice: Joi.number(),
    minRating: Joi.number().min(0).max(5),
    sort: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
  })
};

const getGeoSearch = {
  query: Joi.object().keys({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(0).max(100000).default(5000), // meters
    category: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  })
};

const getListing = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const deleteListing = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const createAvailability = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required() // Listing ID
  }),
  body: Joi.object().keys({
    date: Joi.date().iso().required(),
    timeSlots: Joi.array().items(
      Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
      })
    ),
    isFullDayBlocked: Joi.boolean().default(false),
    note: Joi.string().max(200).allow('')
  }).min(1)
};

const updateAvailability = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(), // Listing ID
    slotId: Joi.string().custom(objectId).required() // Availability ID
  }),
  body: Joi.object().keys({
    timeSlots: Joi.array().items(
      Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        isBooked: Joi.boolean()
      })
    ),
    isFullDayBlocked: Joi.boolean(),
    note: Joi.string().max(200).allow('')
  }).min(1)
};

const deleteAvailability = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(), // Listing ID
    slotId: Joi.string().custom(objectId).required() // Availability ID
  })
};

const getAvailability = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(), // Listing ID
  }),
  query: Joi.object().keys({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/) // e.g. "2026-03"
  })
};

module.exports = {
  createListing,
  updateListing,
  getListings,
  getGeoSearch,
  getListing,
  deleteListing,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailability,
};
