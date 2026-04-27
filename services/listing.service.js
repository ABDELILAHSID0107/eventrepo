const Listing = require('../models/Listing');
const Availability = require('../models/Availability');
const mapsService = require('./maps.service');
const paginate = require('../utils/paginate');
const ApiError = require('../utils/ApiError');

/**
 * Helper to geocode address and set location
 */
const geocodeListingAddress = async (listingData) => {
  if (listingData.address) {
    const addressString = `${listingData.address.street || ''}, ${listingData.address.city}, ${listingData.address.wilaya}, DZ`;
    const fallbackAddressString = `${listingData.address.city}, ${listingData.address.wilaya}, DZ`;
    
    try {
      // First try full address
      const coords = await mapsService.geocodeAddress(addressString);
      if (coords) {
        listingData.location = {
          type: 'Point',
          coordinates: [coords.lng, coords.lat] // GeoJSON is [longitude, latitude]
        };
      }
    } catch (error) {
      console.warn(`Geocoding failed for full address '${addressString}'. Trying fallback to city only...`);
      try {
        // Fallback to City + Wilaya only, since OpenStreetMap is strict about fake/unknown streets
        const fallbackCoords = await mapsService.geocodeAddress(fallbackAddressString);
        if (fallbackCoords) {
          listingData.location = {
            type: 'Point',
            coordinates: [fallbackCoords.lng, fallbackCoords.lat]
          };
        }
      } catch (fallbackError) {
        console.warn(`Fallback geocoding failed for '${fallbackAddressString}'. Using Algiers default.`);
        listingData.location = { type: 'Point', coordinates: [3.0588, 36.7538] }; // Default Algiers
      }
    }
  }
};

const createListing = async (providerId, listingData) => {
  listingData.provider = providerId;
  await geocodeListingAddress(listingData);
  const listing = await Listing.create(listingData);
  return listing;
};

const queryListings = async (filter, options) => {
  const query = { isActive: true };

  // Map filters
  if (filter.category) query.category = filter.category;
  if (filter.wilaya) query['address.wilaya'] = filter.wilaya;
  if (filter.minRating) query.rating = { $gte: filter.minRating };
  
  if (filter.minPrice || filter.maxPrice) {
    query['priceRange.min'] = {};
    query['priceRange.max'] = {};
    if (filter.minPrice) query['priceRange.min'].$gte = filter.minPrice;
    if (filter.maxPrice) query['priceRange.max'].$lte = filter.maxPrice;
    
    // cleanup empty objects mapping
    if (Object.keys(query['priceRange.min']).length === 0) delete query['priceRange.min'];
    if (Object.keys(query['priceRange.max']).length === 0) delete query['priceRange.max'];
  }

  // Ensure default sort ignores null/invalid sorts
  options.populate = 'provider'; // e.g. 'provider' role populating might need specifically select: 'firstName lastName avatarUrl'
  options.select = '-__v';

  return await paginate(Listing, query, options);
};

const geoSearchListings = async (lat, lng, radiusInMeters, filter, options) => {
  const query = {
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusInMeters
      }
    }
  };

  if (filter.category) query.category = filter.category;

  // Pagination for geo query
  options.populate = 'provider';
  return await paginate(Listing, query, options);
};

const getListingById = async (id) => {
  const listing = await Listing.findById(id).populate('provider', 'firstName lastName avatarUrl phone').populate('reviews');
  if (!listing) throw new ApiError(404, 'Listing not found');
  return listing;
};

const updateListing = async (id, providerId, role, updateData) => {
  const listing = await getListingById(id);
  
  // Guard access
  if (listing.provider._id.toString() !== providerId.toString() && role !== 'admin') {
    throw new ApiError(403, 'Not authorized to update this listing');
  }

  if (updateData.address) {
    await geocodeListingAddress(updateData);
  }

  Object.assign(listing, updateData);
  await listing.save();
  return listing;
};

const deleteListing = async (id, providerId, role) => {
  const listing = await getListingById(id);
  
  if (listing.provider._id.toString() !== providerId.toString() && role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this listing');
  }

  await Listing.deleteOne({ _id: id });
};

// Availability management
const getAvailability = async (listingId, month) => {
  const query = { listing: listingId };
  if (month) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    query.date = { $gte: startDate, $lte: endDate };
  }
  return await Availability.find(query).sort({ date: 1 });
};

const createAvailability = async (listingId, providerId, availabilityData) => {
  const listing = await getListingById(listingId);
  if (listing.provider._id.toString() !== providerId.toString()) {
    throw new ApiError(403, 'Not authorized to manage availability for this listing');
  }

  availabilityData.listing = listingId;
  availabilityData.provider = providerId;

  // Enforce unique date per listing constraint
  const existing = await Availability.findOne({ listing: listingId, date: availabilityData.date });
  if (existing) {
    throw new ApiError(400, 'Availability for this date already exists. Please update instead.');
  }

  return await Availability.create(availabilityData);
};

const updateAvailability = async (listingId, slotId, providerId, updateData) => {
  const listing = await getListingById(listingId);
  if (listing.provider._id.toString() !== providerId.toString()) {
    throw new ApiError(403, 'Not authorized to manage availability for this listing');
  }

  const availability = await Availability.findOne({ _id: slotId, listing: listingId });
  if (!availability) {
    throw new ApiError(404, 'Availability slot not found');
  }

  Object.assign(availability, updateData);
  await availability.save();
  return availability;
};

const deleteAvailability = async (listingId, slotId, providerId) => {
  const listing = await getListingById(listingId);
  if (listing.provider._id.toString() !== providerId.toString()) {
    throw new ApiError(403, 'Not authorized to manage availability for this listing');
  }

  const result = await Availability.deleteOne({ _id: slotId, listing: listingId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'Availability slot not found');
  }
};

module.exports = {
  createListing,
  queryListings,
  geoSearchListings,
  getListingById,
  updateListing,
  deleteListing,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
};
