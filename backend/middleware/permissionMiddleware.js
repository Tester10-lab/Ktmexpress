export const authorize = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    if (req.user.isSuperAdmin || req.user.role === 'admin') {
      return next();
    }
    if (req.user.hasPermission && req.user.hasPermission(permissionName)) {
      return next();
    }
    if (req.user.permissions && req.user.permissions[permissionName] === true) {
      return next();
    }
    if (req.user.role === 'dispatcher' && (!req.user.permissions || req.user.permissions[permissionName] !== false)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied: missing '${permissionName}' permission.`,
    });
  };
};
