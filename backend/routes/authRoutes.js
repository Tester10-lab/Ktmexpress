import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import {  
  register, 
  login, 
  getProfile,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword 
} from '../controllers/authController.js';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected route
router.get('/profile', auth, getProfile);

export default router;
