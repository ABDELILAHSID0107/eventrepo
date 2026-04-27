const https = require('https');

const geocodeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Queue mechanism to respect Nominatim rate limits (Max 1 request per second)
const requestQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const { address, resolve, reject } = requestQueue.shift();

    try {
      const location = await performGeocodeRequest(address);
      resolve(location);
    } catch (error) {
      reject(error);
    }

    // Wait 1 second between requests (Nominatim usage policy)
    if (requestQueue.length > 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  isProcessingQueue = false;
};

const performGeocodeRequest = (address) => {
  return new Promise((resolve, reject) => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('q', address);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');

    const options = {
      headers: {
        'User-Agent': 'FeteSalleDZ/1.0 (contact@fetesalle.dz)' // Nominatim requires a valid Custom User-Agent
      }
    };

    const req = https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const results = JSON.parse(data);
            if (results && results.length > 0) {
              const location = {
                lat: parseFloat(results[0].lat),
                lng: parseFloat(results[0].lon) // Nominatim uses 'lon' instead of 'lng'
              };

              // Save to cache
              geocodeCache.set(address, {
                location,
                timestamp: Date.now(),
              });

              resolve(location);
            } else {
              reject(new Error('No results found for provided address.'));
            }
          } catch (e) {
            reject(new Error('Failed to parse geocoding response'));
          }
        } else {
          reject(new Error(`Geocoding failed with status: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Geocoding error:', error.message);
      reject(new Error('Failed to geocode address'));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Geocoding request timeout'));
    });
  });
};

/**
 * Geocode an address string to `{ lat, lng }` using OpenStreetMap (Nominatim).
 * Uses a basic in-memory cache and a queue to handle multiple concurrent requests without getting rate-limited.
 * @param {string} address - Address string to geocode
 * @returns {Promise<{ lat: number, lng: number }>}
 */
const geocodeAddress = (address) => {
  return new Promise((resolve, reject) => {
    if (!address) return resolve(null);

    // Check cache first to avoid queuing unnecessary requests
    const cached = geocodeCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return resolve(cached.location);
    }

    // Add request to the queue
    requestQueue.push({ address, resolve, reject });
    
    // Trigger queue processing
    processQueue();
  });
};

module.exports = {
  geocodeAddress,
};
