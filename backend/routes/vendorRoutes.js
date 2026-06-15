import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getVendorDashboard,
  getVendorPackages,
  createPickupRequest,
  createPackage,
  updatePackage,
  bulkCreatePackages,
  requestReturn,
  addComment,
  getFinance,
  getProducts,
  createProduct,
  updateProduct,
  requestSettlement,
  getSettlements,
  uploadCsv
 } from '../controllers/vendorController.js';
import multer from 'multer';

// Multer config for CSV uploads
const upload = multer({ dest: 'uploads/' });

// All routes require auth + vendor role
router.use(auth, roleGuard('vendor'));

router.get('/dashboard', getVendorDashboard);
router.get('/packages', getVendorPackages);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.post('/packages/bulk', bulkCreatePackages);
router.post('/packages/upload-csv', upload.single('file'), uploadCsv);
router.post('/pickup-request', createPickupRequest);
router.put('/packages/:id/return', requestReturn);
router.post('/packages/:id/comments', addComment);
router.get('/finance', getFinance);

// Settlements
router.get('/settlements', getSettlements);
router.post('/settlements', requestSettlement);

// Products (Inventory)
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);

export default router;
