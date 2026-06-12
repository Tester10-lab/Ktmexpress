import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getDashboardStats,
  getFinancialAnalytics,
  updatePricing,
  getAllUsers,
  toggleUserStatus,
  createUser,
  deleteUser,
  updateUser,
  getAllPackagesAdmin,
  reconcileRiderCOD,
  getAllExpenses,
  getSettlements,
  updateSettlement
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
  previewCalculateFee
} from '../controllers/pricingController.js';
import {
  getAllDeliveryChargeRules,
  createDeliveryChargeRule,
  updateDeliveryChargeRule,
  deleteDeliveryChargeRule,
  toggleDeliveryChargeRule,
} from '../controllers/deliveryChargeController.js';

import { validateGlobalSettings, validateOutsideValleyFee } from '../middleware/pricingValidation.js';

// All routes require auth + admin role
router.use(auth, roleGuard('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getFinancialAnalytics);
router.put('/pricing', updatePricing);

// --- Pricing Engine ---
router.get('/pricing-engine/settings', getGlobalPricingSettings);
router.put('/pricing-engine/settings', validateGlobalSettings, updateGlobalPricingSettings);
router.get('/pricing-engine/summary', getPricingDashboardSummary);
router.get('/pricing-engine/outside-valley', getOutsideValleyFees);
router.post('/pricing-engine/outside-valley', validateOutsideValleyFee, createOutsideValleyFee);
router.put('/pricing-engine/outside-valley/:id', updateOutsideValleyFee);
router.delete('/pricing-engine/outside-valley/:id', deleteOutsideValleyFee);
router.get('/pricing-engine/vendors', getVendorsPricing);
router.put('/pricing-engine/vendors/:id', updateVendorPricing);
router.post('/pricing-engine/calculate', previewCalculateFee);

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
router.delete('/users/:id', deleteUser);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Package overview
router.get('/packages', getAllPackagesAdmin);

// COD reconciliation
router.post('/reconcile/:riderId', reconcileRiderCOD);

// Expenses & Settlements
router.get('/expenses', getAllExpenses);
router.get('/settlements', getSettlements);
router.put('/settlements/:id', updateSettlement);

export default router;
