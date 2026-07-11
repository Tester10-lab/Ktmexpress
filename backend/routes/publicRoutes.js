import express from 'express';
const router = express.Router();
import { trackPackage, getSystemSettings } from '../controllers/publicController.js';

router.get('/track/:code(*)', trackPackage);
router.get('/settings', getSystemSettings);

export default router;
