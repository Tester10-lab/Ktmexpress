export const authorize = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    if (req.user.isSuperAdmin) {
      return next();
    }
    if (req.user.hasPermission && req.user.hasPermission(permissionName)) {
      return next();
    }
    if (req.user.permissions && req.user.permissions[permissionName] === true) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied: missing '${permissionName}' permission.`,
    });
  };
};
