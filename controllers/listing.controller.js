const listingService = require('../services/listing.service');
const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Helper to safely parse JSON strings from form-data
const parseJSONField = (field) => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (error) {
      return field; // Maybe not valid JSON string, but shouldn't throw to break the app, Joi validator previously caught real errors
    }
  }
  return field;
};

const createListing = asyncHandler(async (req, res) => {
  const listingData = req.body;
  
  // Parse fields that might be JSON strings from multipart
  ['address', 'priceRange', 'capacity', 'amenities'].forEach((key) => {
    if (listingData[key]) {
      listingData[key] = parseJSONField(listingData[key]);
    }
  });

  // Handle uploaded images via multer
  if (req.files) {
    // Determine the cover image
    if (req.files.coverImage && req.files.coverImage.length > 0) {
      const coverUrl = await uploadService.uploadImageBuffer(
        req.files.coverImage[0].buffer,
        'fetesalle-dz/listings'
      );
      listingData.coverImageUrl = coverUrl;
    }

    if (req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file => 
        uploadService.uploadImageBuffer(file.buffer, 'fetesalle-dz/listings')
      );
      listingData.imageUrls = await Promise.all(uploadPromises);
    }
    
    if (req.files.panorama && req.files.panorama.length > 0) {
      const uploadPromises = req.files.panorama.map(file => 
        uploadService.uploadImageBuffer(file.buffer, 'fetesalle-dz/listings/panoramas')
      );
      listingData.panoramaUrls = await Promise.all(uploadPromises);
    }
  }

  const listing = await listingService.createListing(req.user.id, listingData);
  res.status(201).json({ status: 'success', data: { listing } });
});

const getListings = asyncHandler(async (req, res) => {
  const filter = {
    category: req.query.category,
    wilaya: req.query.wilaya,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    minRating: req.query.minRating,
  };

  const options = {
    sort: req.query.sort,
    page: req.query.page,
    limit: req.query.limit,
  };

  const result = await listingService.queryListings(filter, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const getGeoSearch = asyncHandler(async (req, res) => {
  const { lat, lng, radius, category, page, limit } = req.query;
  const filter = { category };
  const options = { page, limit };

  const result = await listingService.geoSearchListings(lat, lng, radius, filter, options);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

const getListing = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id);
  res.status(200).json({ status: 'success', data: { listing } });
});

const updateListing = asyncHandler(async (req, res) => {
  const updateData = req.body;
  
  ['address', 'priceRange', 'capacity', 'amenities', 'deleteImages'].forEach((key) => {
    if (updateData[key]) {
      updateData[key] = parseJSONField(updateData[key]);
    }
  });

  // Upload new images
  if (req.files) {
    if (req.files.coverImage && req.files.coverImage.length > 0) {
      updateData.coverImageUrl = await uploadService.uploadImageBuffer(req.files.coverImage[0].buffer, 'fetesalle-dz/listings');
    }

    if (req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file => uploadService.uploadImageBuffer(file.buffer, 'fetesalle-dz/listings'));
      updateData.$push = { imageUrls: { $each: await Promise.all(uploadPromises) } };
    }
  }

  // Delete requested images
  if (updateData.deleteImages && Array.isArray(updateData.deleteImages)) {
    const deletePromises = updateData.deleteImages.map(url => uploadService.deleteImage(url));
    await Promise.all(deletePromises);
    updateData.$pull = { imageUrls: { $in: updateData.deleteImages } };
    delete updateData.deleteImages;
  }

  const listing = await listingService.updateListing(req.params.id, req.user.id, req.user.role, updateData);
  res.status(200).json({ status: 'success', data: { listing } });
});

const deleteListing = asyncHandler(async (req, res) => {
  await listingService.deleteListing(req.params.id, req.user.id, req.user.role);
  res.status(204).send();
});

const getAvailability = asyncHandler(async (req, res) => {
  const slots = await listingService.getAvailability(req.params.id, req.query.month);
  res.status(200).json({ status: 'success', data: { slots } });
});

const createAvailability = asyncHandler(async (req, res) => {
  const availability = await listingService.createAvailability(req.params.id, req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { availability } });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const availability = await listingService.updateAvailability(req.params.id, req.params.slotId, req.user.id, req.body);
  res.status(200).json({ status: 'success', data: { availability } });
});

const deleteAvailability = asyncHandler(async (req, res) => {
  await listingService.deleteAvailability(req.params.id, req.params.slotId, req.user.id);
  res.status(204).send();
});

module.exports = {
  createListing,
  getListings,
  getGeoSearch,
  getListing,
  updateListing,
  deleteListing,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
};
