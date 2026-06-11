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

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/dispatcher', dispatcherRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/scan', scanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Logistic API running on port ${PORT}`);
    console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
  });
});
