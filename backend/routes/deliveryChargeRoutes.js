import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import { calculateDeliveryCharge, getActiveDeliveryCities } from '../controllers/deliveryChargeController.js';

// GET /api/delivery-charges/cities
// Public/authenticated access to list of configured active delivery cities
router.get('/cities', getActiveDeliveryCities);

// GET /api/delivery-charges/calculate?from=BRANCH&to=BRANCH&weight=KG
// Accessible by any authenticated user (vendor, dispatcher, admin, rider)
router.get('/calculate', auth, calculateDeliveryCharge);

export default router;
