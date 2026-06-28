import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Middleware to log admin actions.
 * Extracts the user, HTTP method, route, and body to store an audit trail.
 */
export const auditAction = async (req, res, next) => {
  // Only log state-changing actions
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Intercept the response to log only successful actions (or all actions)
    const originalSend = res.send;
    
    res.send = function (body) {
      res.send = originalSend;
      
      // Attempt to log asynchronously
      if (req.user && res.statusCode >= 200 && res.statusCode < 400) {
        const auditLog = new AuditLog({
          user: req.user.id || req.user._id,
          action: req.method,
          resource: req.originalUrl,
          details: {
            body: req.method !== 'DELETE' ? req.body : undefined,
            query: req.query,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
        });

        auditLog.save().catch(err => {
          logger.error('Failed to write audit log:', { error: err.message });
        });
      }

      return res.send(body);
    };
  }
  
  next();
};
