import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getMyDeliveries,
  updateDeliveryStatus,
  bulkPickup,
  getRiderSummary,
 } from '../controllers/riderController.js';

// All routes require auth + rider role
router.use(auth, roleGuard('rider'));

router.get('/deliveries', getMyDeliveries);
router.put('/update-status', updateDeliveryStatus);
router.put('/bulk-pickup', bulkPickup);
router.get('/summary', getRiderSummary);

export default router;
