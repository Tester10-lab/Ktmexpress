import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { stack: err.stack });

  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(err.status || statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
