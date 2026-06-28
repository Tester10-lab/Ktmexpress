import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getAllPackages,
  getPackageByCode,
  updatePackage,
  createPackage,
 } from '../controllers/packageController.js';

// All routes require auth
router.use(auth);

// Create package (vendor only)
router.post('/', roleGuard('vendor'), createPackage);

// Get all packages (admin/dispatcher)
router.get('/', roleGuard('admin', 'dispatcher'), getAllPackages);

// Get package by tracking code (all roles)
router.get('/:code', getPackageByCode);

// Update package (admin only override)
router.put('/:id', roleGuard('admin'), updatePackage);

export default router;
