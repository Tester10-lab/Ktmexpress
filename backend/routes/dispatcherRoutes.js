import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  getPickupRequests,
  assignRiderToPickup,
  confirmWarehouseArrival,
  assignRiderForDelivery,
  bulkAssignPackages,
  confirmReturn,
  getDispatcherDashboard,
  getAllPackagesForDispatcher,
  getAvailableRiders,
  getCodHandovers,
  verifyCodHandover,
  getRiderHistory,
  bulkVendorHandover
} from '../controllers/dispatcherController.js';

// All routes require auth + dispatcher or admin role
router.use(auth, roleGuard('dispatcher', 'admin'));

router.get('/dashboard', getDispatcherDashboard);
router.get('/pickups', getPickupRequests);
router.get('/packages', getAllPackagesForDispatcher);
router.get('/riders', getAvailableRiders);
router.put('/assign-pickup', assignRiderToPickup);
router.put('/confirm-warehouse', confirmWarehouseArrival);
router.put('/assign-delivery', assignRiderForDelivery);
router.put('/bulk-assign', bulkAssignPackages);
router.put('/confirm-return', confirmReturn);
router.put('/bulk-vendor-handover', bulkVendorHandover);
router.get('/cod-handovers', getCodHandovers);
router.put('/cod-handovers/:id/verify', verifyCodHandover);
router.get('/riders/:id/history', getRiderHistory);

export default router;

