require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_EXPIRE || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  chargily: {
    apiKey: process.env.CHARGILY_API_KEY,
    secretKey: process.env.CHARGILY_SECRET_KEY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@fetesalle.dz',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 100,
  },
};

// Application start verification requirements
const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
if (config.env !== 'test') {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[Config] WARNING: Missing essential environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;
