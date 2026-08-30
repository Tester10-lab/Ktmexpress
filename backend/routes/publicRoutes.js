import express from 'express';
const router = express.Router();
import { trackPackage, getSystemSettings } from '../controllers/publicController.js';

router.get('/track/:code(*)', trackPackage);
router.get('/settings', getSystemSettings);
router.get('/outside-valley-cities', async (req, res) => {
  try {
    const { getActiveCitiesController } = await import('../controllers/pricingController.js');
    return getActiveCitiesController(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
