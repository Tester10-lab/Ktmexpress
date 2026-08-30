import dotenv from 'dotenv';
dotenv.config();
import { validateEnv } from './config/validateEnv.js';
const env = validateEnv();

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
import { publicLimiter, authLimiter, vendorLimiter, riderLimiter, staffLimiter } from './middleware/rateLimiter.js';
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
import './services/eventBusHandlers.js';

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

// Trust proxy (required for Render/Vercel) - Must be before rate limiters/security
app.set('trust proxy', 1);

// ─── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(mongoSanitize());
app.use(hpp());

// ─── Performance Middleware ───────────────────────────────────────────────────
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(process.env.NODE_ENV === 'production'
  ? morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } })
  : morgan('dev')
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Handled route-by-route below

// ─── Socket.io Middleware ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get(['/', '/health', '/api/health'], (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'disconnected';
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 200 : 503;
  
  res.status(status).json({
    status: isDbConnected ? 'ok' : 'error',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes with Role-Specific Rate Limiting ────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', staffLimiter, adminRoutes);
app.use('/api/v1/admin', staffLimiter, adminRoutes);
app.use('/api/vendor', vendorLimiter, vendorRoutes);
app.use('/api/dispatcher', staffLimiter, dispatcherRoutes);
app.use('/api/rider', riderLimiter, riderRoutes);
app.use('/api/packages', staffLimiter, packageRoutes);
app.use('/api/expenses', staffLimiter, expenseRoutes);
app.use('/api/public', publicLimiter, publicRoutes);
app.use('/api/scan', staffLimiter, scanRoutes);
app.use('/api/delivery-charges', staffLimiter, deliveryChargeRoutes);

// ─── Serve Frontend in Production ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    } else {
      next();
    }
  });
}

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Auto-seed default accounts for all roles
    try {
      const User = (await import('./models/User.js')).default;
      
      const defaultUsers = [
        { name: 'System Admin', email: 'admin@kdmexpress.com', password: 'admin123', role: 'admin', isSuperAdmin: true, contact: '9800000000' },
        { name: 'Demo Vendor', email: 'vendor@kdmexpress.com', password: 'vendor123', role: 'vendor', contact: '9800000001', vendorMeta: { shopName: 'Demo Store' } },
        { name: 'Demo Dispatcher', email: 'dispatcher@kdmexpress.com', password: 'dispatcher123', role: 'dispatcher', contact: '9800000002' },
        { name: 'Demo Rider', email: 'rider@kdmexpress.com', password: 'rider123', role: 'rider', contact: '9800000003' },
        // Backwards-compatible aliases
        { name: 'System Admin', email: 'admin@ktmexpress.com', password: 'admin123', role: 'admin', isSuperAdmin: true, contact: '9800000000' },
        { name: 'Demo Vendor', email: 'vendor@ktmexpress.com', password: 'vendor123', role: 'vendor', contact: '9800000001', vendorMeta: { shopName: 'Demo Store' } },
        { name: 'Demo Dispatcher', email: 'dispatcher@ktmexpress.com', password: 'dispatcher123', role: 'dispatcher', contact: '9800000002' },
        { name: 'Demo Rider', email: 'rider@ktmexpress.com', password: 'rider123', role: 'rider', contact: '9800000003' }
      ];

      for (const u of defaultUsers) {
        let user = await User.findOne({ email: u.email }).select('+password +loginAttempts +lockUntil');
        if (!user) {
          user = new User({ ...u, status: 'Active' });
          await user.save();
          logger.info(`Seeded account: ${u.email} (${u.role})`);
        } else {
          // Reset password & clear lock
          user.password = u.password;
          user.status = 'Active';
          user.loginAttempts = 0;
          user.lockUntil = null;
          await user.save();
          logger.info(`Updated/unlocked account: ${u.email}`);
        }
      }

      // Auto-seed/update master pricing rates from Excel catalog
      const { seedExcelPricing } = await import('./services/excelPricingSeeder.js');
      await seedExcelPricing();

      // Initialize daily email backup scheduler
      const { scheduleDailyEmailBackup } = await import('./services/dailyReportService.js');
      scheduleDailyEmailBackup();
    } catch (seedErr) {
      logger.error(`Auto-seeding / email scheduler failed: ${seedErr.message}`);
    }

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
