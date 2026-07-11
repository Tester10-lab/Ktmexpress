import rateLimit from 'express-rate-limit';

export const verifyRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 verification requests per minute
  message: {
    success: false,
    message: 'Too many verification requests from this IP. Please try again after 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bulkVerifyRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 bulk verification requests per minute
  message: {
    success: false,
    message: 'Too many bulk verification requests from this IP. Please try again after 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reopenRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 reopen requests per minute
  message: {
    success: false,
    message: 'Too many reopen requests from this IP. Please try again after 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
