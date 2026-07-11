import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from './logger.js';



export const connectDB = async () => {
  // Workaround for Windows local environments where Node.js fails to query SRV records via IPv6 DNS
  if (process.env.NODE_ENV === 'development') {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (err) {
      console.warn('Failed to set DNS servers', err);
    }
  }

  let mongoUri = process.env.MONGO_URI;

  if (process.env.USE_MEMORY_DB === 'true') {
    logger.info('Starting In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      logger.info(`In-Memory MongoDB Server started at: ${mongoUri}`);
      global.__MONGOD__ = mongod;
      process.env.MONGO_URI = mongoUri;
    } catch (err) {
      logger.error(`Failed to start In-Memory MongoDB Server: ${err.message}`);
      process.exit(1);
    }
  }

  const MAX_RETRIES = 5;
  let retries = 0;

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected! Mongoose will attempt to reconnect automatically...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 to prevent IPv6 DNS SRV issues
      });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed: ${err.message}`);
      if (retries === MAX_RETRIES) {
        logger.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 3000 * retries));
    }
  }
};
