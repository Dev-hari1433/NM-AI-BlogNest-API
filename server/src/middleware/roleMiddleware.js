/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 * @param  {...string} roles - List of allowed roles (e.g. 'admin', 'editor', 'author', 'reader')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role permissions'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}]. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

module.exports = {
  requireRole
};
