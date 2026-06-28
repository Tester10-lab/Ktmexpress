import { cleanEnv, str, port } from 'envalid';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export const validateEnv = () => {
  try {
    const env = cleanEnv(process.env, {
      NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
      PORT: port({ default: 5000 }),
      MONGO_URI: str(),
      JWT_SECRET: str(),
      CLIENT_URL: str({ default: 'http://localhost:5173' }),
    });
    return env;
  } catch (error) {
    logger.error(`Environment validation failed: ${error.message}`);
    process.exit(1);
  }
};
