import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

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
import deliveryChargeRoutes from './routes/deliveryChargeRoutes.js';

// ─── Validate critical env variables at startup ───────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// ─── CORS Origins ─────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://delivery-system-sand-seven.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const isOriginAllowed = (origin, callback) => {
  if (!origin) return callback(null, true); // Allow non-browser clients (e.g. Postman)
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  if (origin.endsWith('.vercel.app')) return callback(null, true); // Allow Vercel preview deployments
  
  console.warn(`[CORS] Blocked request from origin: ${origin}`);
  callback(new Error(`CORS policy: Origin "${origin}" is not allowed.`));
};

// ─── Socket.io Initialization ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

// Attach io to req and global for use in controllers
global.io = io;
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    logger.warn(`[SOCKET] Authentication error: No token provided (${socket.id})`);
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    logger.warn(`[SOCKET] Authentication error: Invalid token (${socket.id})`);
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`[SOCKET] User connected: ${socket.id} (Role: ${socket.user.role})`);
  
  // Automatically join the user's explicit role room based on JWT to prevent spoofing
  socket.join(`role_${socket.user.role}`);
  socket.join(`user_${socket.user.id}`);

  // Prevent users from manually joining arbitrary roles
  socket.on('join_role', (role) => {
    if (socket.user.role === role) {
      socket.join(`role_${role}`);
    } else {
      logger.warn(`[SOCKET] Unauthorized room join attempt: User ${socket.user.id} tried to join role_${role}`);
    }
  });

  socket.on('join_user', (userId) => {
    if (socket.user.id === userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// ─── CORS — first middleware, before any routes ───────────────────────────────
const corsOptions = {
  origin: isOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(compression());
app.use(cookieParser());

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

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

// ─── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Auth Route Rate Limiting (Stricter)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again after 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

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
app.use('/api/delivery-charges', deliveryChargeRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    res.status(200).json({ status: 'OK', message: 'API and Database are healthy', timestamp: new Date() });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'Database connection is down', timestamp: new Date() });
  }
});

app.get('/', (req, res) => {
  res.send('Logistic System API is running...');
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ─── Start Server & Graceful Shutdown ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      server.listen(PORT, '0.0.0.0', () => {
        logger.info(`[SERVER] ✓ Running on port ${PORT}`);
        logger.info(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`[SERVER] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
      });
    })
    .catch(err => {
      logger.error('[SERVER] Failed to connect to MongoDB. Exiting.', { stack: err.stack });
      process.exit(1);
    });
}

// Graceful Shutdown implementation
const shutdown = (signal) => {
  logger.info(`[SERVER] Received ${signal}. Closing HTTP server...`);
  server.close(async () => {
    logger.info('[SERVER] HTTP server closed.');
    try {
      await mongoose.connection.close();
      logger.info('[DB] MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('[DB] Error during MongoDB disconnection', { error: err.message });
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
