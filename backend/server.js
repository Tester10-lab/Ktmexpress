import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import dispatcherRoutes from './routes/dispatcherRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import scanRoutes from './routes/scanRoutes.js';

// ─── Validate critical env variables at startup ───────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

// ─── CORS — first middleware, before any routes ───────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://delivery-system-sand-seven.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    callback(new Error(`CORS policy: Origin "${origin}" is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
};

// Apply CORS globally and handle all preflight OPTIONS requests
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ─── Root health check (for Render uptime monitoring) ────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Logistic API is running ✓', status: 'ok' });
});

// ─── Detailed health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: true,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/dispatcher', dispatcherRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/scan', scanRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  // CORS errors from our policy
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] ✓ Running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[SERVER] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('[SERVER] Failed to connect to MongoDB. Exiting.', err.message);
    process.exit(1);
  });
