import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { corsOptions } from './config/corsOptions.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { logger } from './config/logger.js';
import jwt from 'jsonwebtoken';

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

const app = express();
const server = http.createServer(app);

// ─── Socket.io Initialization ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions
});

global.io = io;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  socket.join(`role_${socket.user.role}`);
  socket.join(`user_${socket.user.id}`);
  socket.on('join_role', (role) => {
    if (socket.user.role === role) socket.join(`role_${role}`);
  });
  socket.on('join_user', (userId) => {
    if (socket.user.id === userId) socket.join(`user_${userId}`);
  });
});

// ─── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(mongoSanitize());
app.use(hpp());

// Trust proxy (required for Render/Vercel)
app.set('trust proxy', 1);

// ─── Performance Middleware ───────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(process.env.NODE_ENV === 'production'
  ? morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } })
  : morgan('dev')
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── Socket.io Middleware ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get(['/', '/health', '/api/health'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 200 : 503;
  res.status(status).json({
    status: isDbConnected ? 'OK' : 'ERROR',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
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
app.use('/api/delivery-charges', deliveryChargeRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
  });
}

// Graceful Shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Closing server...`);
  if (global.io) global.io.close();
  server.close(async () => {
    try {
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
