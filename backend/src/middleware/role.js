/**
 * middleware/role.js
 * 
 * Role-based access control middleware
 * Usage: app.use('/admin', allowRoles('admin'))
 */

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
        },
      });
    }

    next();
  };
};

module.exports = allowRoles;
