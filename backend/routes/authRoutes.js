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
  resetPassword,
  changePassword 
} from '../controllers/authController.js';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/change-password', auth, changePassword);

export default router;
