const cloudinary = require('cloudinary').v2;
const config = require('./index');

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.log('[Cloudinary] Configured successfully');
} else {
  console.warn('[Cloudinary] Missing credentials. Image uploads may fail.');
}

module.exports = cloudinary;
