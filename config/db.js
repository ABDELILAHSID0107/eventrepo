const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment variables');
  }

  try {
    const conn = await mongoose.connect(config.mongoUri);

    console.log(`[MongoDB] Connected properly to: ${conn.connection.host}`);
    
    // Connection event logging
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
