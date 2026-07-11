import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getAllPackages,
  updatePackage,
  trackPackage,
  confirmWarehouseArrival
 } from '../controllers/packageController.js';
import { warehouseArrivalLimiter } from '../middleware/rateLimiter.js';

// All routes require auth
router.use(auth);

// Get all packages (admin/dispatcher)
router.get('/', roleGuard('admin', 'dispatcher'), getAllPackages);

// Authenticated Tracking (Vendor only needs their own, admin/dispatcher any)
router.get('/track/:trackingCode(*)', trackPackage);

// Warehouse Arrival (Admin/Dispatcher only)
router.patch('/:trackingCode/warehouse-arrival', roleGuard('admin', 'dispatcher'), warehouseArrivalLimiter, confirmWarehouseArrival);

// Update package (admin only override)
router.put('/:id', roleGuard('admin'), updatePackage);

export default router;
