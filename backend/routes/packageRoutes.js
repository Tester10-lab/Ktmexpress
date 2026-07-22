import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { authorize } from '../middleware/permissionMiddleware.js';
import { verifyRateLimiter, bulkVerifyRateLimiter, reopenRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { 
  getAllPackages,
  updatePackage,
  trackPackage,
  confirmWarehouseArrival,
  requestVerification,
  addPackageComment
 } from '../controllers/packageController.js';
import { 
  savePackageVerificationDraft,
  verifyPackageAdmin,
  reopenPackageAdmin,
  bulkVerifyPackagesAdmin
} from '../controllers/adminController.js';
import { warehouseArrivalLimiter } from '../middleware/rateLimiter.js';

// All routes require auth
router.use(auth);

// Package Comments (Admin/Dispatcher/Vendor/Rider)
router.post('/:id/comments', roleGuard('admin', 'dispatcher', 'vendor', 'rider'), addPackageComment);

// Request Verification (Admin/Dispatcher/Vendor/Rider)
router.post('/:id/request-verification', roleGuard('admin', 'dispatcher', 'vendor', 'rider'), requestVerification);

// Verification Actions (Admin & Dispatcher with permission check)
router.put('/:id/verification-draft', roleGuard('admin', 'dispatcher'), authorize('canEditVerification'), savePackageVerificationDraft);
router.post('/:id/verify-action', roleGuard('admin', 'dispatcher'), verifyRateLimiter, authorize('canVerifyPackages'), verifyPackageAdmin);
router.post('/:id/reopen', roleGuard('admin', 'dispatcher'), reopenRateLimiter, authorize('canReopenVerification'), reopenPackageAdmin);
router.post('/bulk-verify', roleGuard('admin', 'dispatcher'), bulkVerifyRateLimiter, authorize('canVerifyPackages'), bulkVerifyPackagesAdmin);

// Get all packages (admin/dispatcher)
router.get('/', roleGuard('admin', 'dispatcher'), getAllPackages);

// Authenticated Tracking (Vendor only needs their own, admin/dispatcher any)
router.get('/track/:trackingCode(*)', trackPackage);

// Warehouse Arrival (Admin/Dispatcher only)
router.patch('/:trackingCode/warehouse-arrival', roleGuard('admin', 'dispatcher'), warehouseArrivalLimiter, confirmWarehouseArrival);

// Update package (admin only override)
router.put('/:id', roleGuard('admin'), updatePackage);

export default router;
