import { logger } from './logger.js';

const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

const allowedOrigins = [...new Set(
  rawOrigins
    .filter(Boolean)
    .map(origin => origin.trim().replace(/\/$/, ''))
)];

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    
    const vercelProjectName = process.env.VERCEL_PROJECT_NAME || 'kdmexpress';
    const isVercelPreviewRegex = new RegExp(`^https:\\/\\/${vercelProjectName}-[a-zA-Z0-9-]+\\.vercel\\.app$`);
    
    let hostname = '';
    try {
      hostname = new URL(normalizedOrigin).hostname;
    } catch {
      hostname = normalizedOrigin;
    }

    const isAllowed = 
      allowedOrigins.includes(normalizedOrigin) || 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      hostname.endsWith('kdmexpress.com') ||
      hostname.endsWith('hostinger.com') ||
      hostname.endsWith('hostingervps.com') ||
      isVercelPreviewRegex.test(normalizedOrigin);

    if (isAllowed) {
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
