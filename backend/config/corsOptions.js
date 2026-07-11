import { logger } from './logger.js';

const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = [...new Set(
  rawOrigins
    .filter(Boolean)
    .map(origin => origin.trim().replace(/\/$/, ''))
)];

export const corsOptions = {
  origin: (origin, callback) => {
    // Also normalize the incoming origin to ensure consistent matching if needed, though standard browsers don't send trailing slashes
    const normalizedOrigin = origin ? origin.trim().replace(/\/$/, '') : origin;
    
    const vercelProjectName = process.env.VERCEL_PROJECT_NAME || 'ktmexpress';
    const isVercelPreviewRegex = new RegExp(`^https:\\/\\/${vercelProjectName}-[a-zA-Z0-9-]+\\.vercel\\.app$`);
    
    if (
      !normalizedOrigin || 
      allowedOrigins.includes(normalizedOrigin) || 
      isVercelPreviewRegex.test(normalizedOrigin)
    ) {
      callback(null, true);
    } else {
      logger.error(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
