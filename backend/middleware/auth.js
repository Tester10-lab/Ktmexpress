import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Brief in-memory user cache to avoid DB query on every authenticated request.
// TTL: 30 seconds. Keyed by userId. Automatically cleaned up.
const userCache = new Map();
const USER_CACHE_TTL = 30_000;

function getCachedUser(userId) {
  const entry = userCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > USER_CACHE_TTL) {
    userCache.delete(userId);
    return null;
  }
  return entry.user;
}

function setCachedUser(userId, user) {
  userCache.set(userId, { user, ts: Date.now() });
}

// Exported for use by controllers that modify user data (to invalidate cache)
export function invalidateUserCache(userId) {
  userCache.delete(String(userId));
}

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check cache first, then DB
    let user = getCachedUser(decoded.id);
    if (!user) {
      user = await User.findById(decoded.id).select('-password');
      if (user) setCachedUser(decoded.id, user);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

export default auth;

