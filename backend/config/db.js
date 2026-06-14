import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
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
