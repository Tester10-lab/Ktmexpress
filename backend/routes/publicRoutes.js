import express from 'express';
const router = express.Router();
import { trackPackage, getSystemSettings } from '../controllers/publicController.js';
import { cacheResponse } from '../middleware/cacheMiddleware.js';

router.get('/track/:code(*)', cacheResponse(10), trackPackage);
router.get('/settings', cacheResponse(60), getSystemSettings);
router.get('/outside-valley-cities', cacheResponse(120), async (req, res) => {
  try {
    const { getActiveCitiesController } = await import('../controllers/pricingController.js');
    return getActiveCitiesController(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
