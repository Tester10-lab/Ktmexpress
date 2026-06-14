import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] MongoDB disconnected! Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[DB] MongoDB reconnected successfully.');
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`[DB] Connection error: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

export default connectDB;
