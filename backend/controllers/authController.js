import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, contact, vendorMeta } = req.body;

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

    const token = generateToken(user);

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

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
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

    // Update last active
    user.lastActive = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user);

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
