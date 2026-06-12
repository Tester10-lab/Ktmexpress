import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import { calculateDeliveryCharge } from '../controllers/deliveryChargeController.js';

// GET /api/delivery-charges/calculate?from=BRANCH&to=BRANCH&weight=KG
// Accessible by any authenticated user (vendor, dispatcher, admin, rider)
router.get('/calculate', auth, calculateDeliveryCharge);

export default router;
