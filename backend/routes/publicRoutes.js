import express from 'express';
const router = express.Router();
import { trackPackage } from '../controllers/publicController.js';

router.get('/track/:code', trackPackage);

export default router;
