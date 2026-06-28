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
  requestSettlement,
  getSettlements,
  uploadCsv,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
 } from '../controllers/vendorController.js';
import multer from 'multer';

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

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', updateStock);

export default router;
