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
  bulkUpdatePackageStatus,
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
  importExcelPricingController,
  uploadPricingSheetController
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

// Multer config for Excel & CSV spreadsheet uploads
const sheetUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const isSpreadsheet = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') ||
                          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                          file.mimetype === 'application/vnd.ms-excel' ||
                          file.mimetype === 'text/csv';
    if (!isSpreadsheet) {
      return cb(new Error('Only Excel (.xlsx/.xls) or CSV (.csv) files are allowed'), false);
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

// All routes require authentication and audit logging
router.use(auth);
router.use(auditAction);

// --- Admin Only: Overview, Financial Analytics & System Settings ---
router.get('/dashboard', roleGuard('admin'), getDashboardStats);
router.get('/analytics', roleGuard('admin'), getFinancialAnalytics);
router.put('/pricing', roleGuard('admin'), updatePricing);

// --- Pricing & System Settings (Admin only) ---
router.get('/pricing-engine/settings', roleGuard('admin'), getGlobalPricingSettings);
router.get('/pricing-engine/summary', roleGuard('admin'), getPricingDashboardSummary);
router.put('/pricing-engine/settings', roleGuard('admin'), validateGlobalSettings, updateGlobalPricingSettings);
router.post('/settings/logo', roleGuard('admin'), imageUpload.single('logo'), uploadLogo);
router.get('/pricing-engine/outside-valley', roleGuard('admin'), getOutsideValleyFees);
router.post('/pricing-engine/outside-valley', roleGuard('admin'), validateOutsideValleyFee, createOutsideValleyFee);
router.put('/pricing-engine/outside-valley/:id', roleGuard('admin'), updateOutsideValleyFee);
router.delete('/pricing-engine/outside-valley/:id', roleGuard('admin'), deleteOutsideValleyFee);
router.get('/pricing-engine/vendors', roleGuard('admin'), getVendorsPricing);
router.put('/pricing-engine/vendors/:id', roleGuard('admin'), updateVendorPricing);
router.post('/pricing-engine/calculate', roleGuard('admin'), previewCalculateFee);
router.post('/pricing-engine/import-excel', roleGuard('admin'), importExcelPricingController);
router.post('/pricing-engine/upload-sheet', roleGuard('admin'), sheetUpload.single('file'), uploadPricingSheetController);
router.post('/send-daily-report', roleGuard('admin'), async (req, res) => {
  try {
    const { sendDailyEmailBackup } = await import('../services/dailyReportService.js');
    const result = await sendDailyEmailBackup();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Delivery Charge Rules (Admin only) ---
router.get('/delivery-charges', roleGuard('admin'), getAllDeliveryChargeRules);
router.post('/delivery-charges', roleGuard('admin'), createDeliveryChargeRule);
router.put('/delivery-charges/:id', roleGuard('admin'), updateDeliveryChargeRule);
router.delete('/delivery-charges/:id', roleGuard('admin'), deleteDeliveryChargeRule);
router.patch('/delivery-charges/:id/toggle', roleGuard('admin'), toggleDeliveryChargeRule);

// User management (Admin full access; Dispatchers can read user lists for vendor/rider selections)
router.get('/users', roleGuard('admin', 'dispatcher'), getAllUsers);
router.post('/users', roleGuard('admin'), createUser);
router.put('/users/:id', roleGuard('admin'), updateUser);
router.patch('/users/:id/suspend', roleGuard('admin'), suspendUser);
router.patch('/users/:id/reactivate', roleGuard('admin'), reactivateUser);

// Package management (Admin & Dispatcher CRUD + bulk)
router.get('/packages', roleGuard('admin', 'dispatcher'), getAllPackagesAdmin);
router.post('/packages', roleGuard('admin', 'dispatcher'), createPackageForVendor);
router.post('/packages/bulk', roleGuard('admin', 'dispatcher'), bulkCreatePackagesForVendor);
router.put('/packages/bulk-status', roleGuard('admin', 'dispatcher'), bulkUpdatePackageStatus);
router.post('/packages/upload-csv', roleGuard('admin', 'dispatcher'), upload.single('file'), uploadCsvForVendor);
router.post('/packages/pickup-request', roleGuard('admin', 'dispatcher'), requestPickupAdmin);
router.put('/packages/:id', roleGuard('admin', 'dispatcher'), updatePackageAdmin);
router.delete('/packages/:id', roleGuard('admin', 'dispatcher'), deletePackageAdmin);

// COD reconciliation (Admin only)
router.post('/reconcile/:riderId', roleGuard('admin'), reconcileRiderCOD);

// Expenses & Settlements
router.get('/expenses', roleGuard('admin', 'dispatcher'), getAllExpenses);
router.put('/expenses/:id/status', roleGuard('admin', 'dispatcher'), updateExpenseStatus);
router.get('/settlements', roleGuard('admin'), getSettlements);
router.get('/settlements/vendor-balances', roleGuard('admin'), getVendorBalances);
router.post('/settlements/direct-payout', roleGuard('admin'), authorize('canVerifyPackages'), directVendorPayout);
router.put('/settlements/:id', roleGuard('admin'), authorize('canVerifyPackages'), updateSettlement);
router.post('/settlements/verify-cod/:packageId', roleGuard('admin'), authorize('canVerifyPackages'), verifyCOD);
router.post('/settlements/mark-paid', roleGuard('admin'), authorize('canVerifyPackages'), markVendorPaid);
router.get('/settlements/export', roleGuard('admin'), exportSettlements);

// Package Comments
router.post('/packages/:id/comments', roleGuard('admin', 'dispatcher'), addPackageComment);

// Operational & Financial Verification endpoints
router.put('/packages/:id/verification-draft', roleGuard('admin', 'dispatcher'), authorize('canEditVerification'), savePackageVerificationDraft);
router.post('/packages/:id/verify-action', roleGuard('admin', 'dispatcher'), verifyRateLimiter, authorize('canVerifyPackages'), verifyPackageAdmin);
router.post('/packages/:id/reopen', roleGuard('admin', 'dispatcher'), reopenRateLimiter, authorize('canReopenVerification'), reopenPackageAdmin);
router.post('/packages/bulk-verify', roleGuard('admin', 'dispatcher'), bulkVerifyRateLimiter, authorize('canVerifyPackages'), bulkVerifyPackagesAdmin);

// Daily Excel Export (2 sheets in 1 .xlsx file)
router.get('/export/daily-excel', roleGuard('admin', 'dispatcher'), exportDailyExcel);

export default router;

