import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import { authorize } from '../middleware/permissionMiddleware.js';
import { verifyRateLimiter, bulkVerifyRateLimiter, reopenRateLimiter } from '../middleware/rateLimitMiddleware.js';
import multer from 'multer';
import { addPackageComment } from '../controllers/packageController.js';
import { 
  getDashboardStats,
  getFinancialAnalytics,
  updatePricing,
  getAllUsers,
  createUser,
  updateUser,
  suspendUser,
  reactivateUser,
  getAllPackagesAdmin,
  updatePackageAdmin,
  deletePackageAdmin,
  createPackageForVendor,
  bulkCreatePackagesForVendor,
  uploadCsvForVendor,
  reconcileRiderCOD,
  getAllExpenses,
  updateExpenseStatus,
  getSettlements,
  updateSettlement,
  directVendorPayout,
  getVendorBalances,
  requestPickupAdmin,
  verifyCOD,
  markVendorPaid,
  exportSettlements,
  uploadLogo,
  savePackageVerificationDraft,
  verifyPackageAdmin,
  reopenPackageAdmin,
  bulkVerifyPackagesAdmin,
  exportDailyExcel
} from '../controllers/adminController.js';

import {
  getGlobalPricingSettings,
  updateGlobalPricingSettings,
  getPricingDashboardSummary,
  getOutsideValleyFees,
  createOutsideValleyFee,
  updateOutsideValleyFee,
  deleteOutsideValleyFee,
  getVendorsPricing,
  updateVendorPricing,
  previewCalculateFee,
  importExcelPricingController
} from '../controllers/pricingController.js';
import {
  getAllDeliveryChargeRules,
  createDeliveryChargeRule,
  updateDeliveryChargeRule,
  deleteDeliveryChargeRule,
  toggleDeliveryChargeRule,
} from '../controllers/deliveryChargeController.js';

import { validateGlobalSettings, validateOutsideValleyFee } from '../middleware/pricingValidation.js';

// Multer config for CSV uploads - hardened with fileFilter and limits
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || 
                  file.mimetype === 'application/vnd.ms-excel' ||
                  file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  }
});

// Multer config for image uploads (logos)
const imageUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  }
});

// All routes require auth + admin role
router.use(auth, roleGuard('admin'));

// Apply audit middleware to record admin state changes
router.use(auditAction);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getFinancialAnalytics);
router.put('/pricing', updatePricing);

// --- Pricing & System Settings (Admin only) ---
router.get('/pricing-engine/settings', getGlobalPricingSettings);
router.get('/pricing-engine/summary', getPricingDashboardSummary);
router.put('/pricing-engine/settings', validateGlobalSettings, updateGlobalPricingSettings);
router.post('/settings/logo', imageUpload.single('logo'), uploadLogo);
router.get('/pricing-engine/outside-valley', getOutsideValleyFees);
router.post('/pricing-engine/outside-valley', validateOutsideValleyFee, createOutsideValleyFee);
router.put('/pricing-engine/outside-valley/:id', updateOutsideValleyFee);
router.delete('/pricing-engine/outside-valley/:id', deleteOutsideValleyFee);
router.get('/pricing-engine/vendors', getVendorsPricing);
router.put('/pricing-engine/vendors/:id', updateVendorPricing);
router.post('/pricing-engine/calculate', previewCalculateFee);
router.post('/pricing-engine/import-excel', importExcelPricingController);

// --- Delivery Charge Rules (branch-to-branch) ---
router.get('/delivery-charges', getAllDeliveryChargeRules);
router.post('/delivery-charges', createDeliveryChargeRule);
router.put('/delivery-charges/:id', updateDeliveryChargeRule);
router.delete('/delivery-charges/:id', deleteDeliveryChargeRule);
router.patch('/delivery-charges/:id/toggle', toggleDeliveryChargeRule);

// User management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/reactivate', reactivateUser);

// Package management (CRUD + bulk)
router.get('/packages', getAllPackagesAdmin);
router.post('/packages', createPackageForVendor);
router.post('/packages/bulk', bulkCreatePackagesForVendor);
router.post('/packages/upload-csv', upload.single('file'), uploadCsvForVendor);
router.post('/packages/pickup-request', requestPickupAdmin);
router.put('/packages/:id', updatePackageAdmin);
router.delete('/packages/:id', deletePackageAdmin);

// COD reconciliation
router.post('/reconcile/:riderId', reconcileRiderCOD);

// Expenses & Settlements
router.get('/expenses', getAllExpenses);
router.put('/expenses/:id/status', updateExpenseStatus);
router.get('/settlements', getSettlements);
router.get('/settlements/vendor-balances', getVendorBalances);
router.post('/settlements/direct-payout', authorize('canVerifyPackages'), directVendorPayout);
router.put('/settlements/:id', authorize('canVerifyPackages'), updateSettlement);
router.post('/settlements/verify-cod/:packageId', authorize('canVerifyPackages'), verifyCOD);
router.post('/settlements/mark-paid', authorize('canVerifyPackages'), markVendorPaid);
router.get('/settlements/export', exportSettlements);

// Package Comments
router.post('/packages/:id/comments', addPackageComment);

// Operational & Financial Verification endpoints
router.put('/packages/:id/verification-draft', authorize('canEditVerification'), savePackageVerificationDraft);
router.post('/packages/:id/verify-action', verifyRateLimiter, authorize('canVerifyPackages'), verifyPackageAdmin);
router.post('/packages/:id/reopen', reopenRateLimiter, authorize('canReopenVerification'), reopenPackageAdmin);
router.post('/packages/bulk-verify', bulkVerifyRateLimiter, authorize('canVerifyPackages'), bulkVerifyPackagesAdmin);

// Daily Excel Export (2 sheets in 1 .xlsx file)
router.get('/export/daily-excel', exportDailyExcel);

export default router;

