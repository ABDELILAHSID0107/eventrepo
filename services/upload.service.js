const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const config = require('../config/index');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});


const uploadImageBuffer = async (fileBuffer, folder = 'fetesalle-dz', options = {}) => {
    const width = options.width || 800;
    const height = options.height || undefined;
    const quality = options.quality || 80;


    const processedBuffer = await sharp(fileBuffer)
      .resize(width, height, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality })
      .toBuffer();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
            resolve(result.secure_url);
        }
      );

      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(processedBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
};


const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const parts = imageUrl.split('/');
      const lastPart = parts[parts.length - 1];
      const publicIdWithFolder = parts[parts.length - 2] + '/' + lastPart.split('.')[0];
    
      await cloudinary.uploader.destroy(publicIdWithFolder);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
};

module.exports = {
    uploadImageBuffer,
    deleteImage,
};
