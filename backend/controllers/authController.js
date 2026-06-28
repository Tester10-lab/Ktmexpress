import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate JWT Refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, contact, vendorMeta } = req.body;

    if (role && role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Role registration restricted. Only vendor accounts can be created publicly.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      contact: contact || '',
      vendorMeta: vendorMeta || {},
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in HTTP-only cookie
    res.cookie(`refreshToken_${role}`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        status: user.status,
        vendorMeta: user.vendorMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Must select lock fields to check them
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }


    if (user.isLocked) {
      const msLeft = user.lockUntil - Date.now();
      const minsLeft = Math.ceil(msLeft / 60000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minsLeft} minutes.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Contact admin.',
      });
    }

    // Successful login: reset attempts & update lastActive
    await user.updateOne({
      $set: { loginAttempts: 0, lastActive: new Date() },
      $unset: { lockUntil: 1 }
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in HTTP-only cookie
    res.cookie(`refreshToken_${user.role}`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        status: user.status,
        vendorMeta: user.vendorMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        contact: req.user.contact,
        status: req.user.status,
        vendorMeta: req.user.vendorMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    const rfToken = req.cookies[`refreshToken_${role}`];
    if (!rfToken) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(rfToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Invalid or suspended user' });
    }

    const token = generateAccessToken(user);
    res.json({ success: true, token });
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

  res.clearCookie(`refreshToken_${role}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

import crypto from 'crypto';

import sendEmail from '../utils/emailService.js';

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Also unlock account just in case
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
