import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import {
  scanPackage,
  bulkScan,
  getScanHistory,
  getScanHistoryByCode,
  getMyScanHistory,
  getAllScanHistory,
  lookupPackage,
} from '../controllers/scanController.js';

// All routes require authentication
router.use(auth);

// Lookup a package before scanning (all authenticated roles)
router.get('/lookup/:code', lookupPackage);

// Core scan — dispatcher, rider, admin only
router.post('/', roleGuard('dispatcher', 'rider', 'admin'), scanPackage);

// Bulk scan
router.post('/bulk', roleGuard('dispatcher', 'rider', 'admin'), bulkScan);

// Scan history for a package (by id or tracking code)
router.get('/history/:packageId', roleGuard('dispatcher', 'admin'), getScanHistory);
router.get('/history-by-code/:trackingCode', getScanHistoryByCode);

// My own scan history (for dispatcher + rider dashboards)
router.get('/my-history', getMyScanHistory);

// All scan history — admin only
router.get('/all', roleGuard('admin'), getAllScanHistory);

export default router;
