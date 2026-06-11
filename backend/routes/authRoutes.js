import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import {  register, login, getProfile  } from '../controllers/authController.js';

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/profile', auth, getProfile);

export default router;
