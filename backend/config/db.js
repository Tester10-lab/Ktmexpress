import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from './logger.js';



export const connectDB = async () => {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('Failed to set DNS servers', err);
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
      let currentUri = mongoUri;
      if (retries > 0 && currentUri.includes('mongodb+srv://')) {
        // Fallback SRV to direct shard endpoints if querySrv is blocked by host DNS
        currentUri = currentUri.replace(
          'mongodb+srv://kdmexpress7_db_user:kdmexpress7_db_user@cluster0.cnh6hgr.mongodb.net/kdmexpress',
          'mongodb://kdmexpress7_db_user:kdmexpress7_db_user@ac-ta5bhnp-shard-00-00.cnh6hgr.mongodb.net:27017,ac-ta5bhnp-shard-00-01.cnh6hgr.mongodb.net:27017,ac-ta5bhnp-shard-00-02.cnh6hgr.mongodb.net:27017/kdmexpress?ssl=true&replicaSet=atlas-13b7m1-shard-0&authSource=admin'
        );
      }
      const conn = await mongoose.connect(currentUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
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
      await new Promise(r => setTimeout(r, 2000 * retries));
    }
  }
};
