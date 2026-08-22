const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect - verifies the "Authorization: Bearer <token>" JWT and attaches
 * the authenticated user to req.user. Rejects with 401 otherwise.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * superAdminOnly - allows the request through only when the authenticated
 * user has the super-admin role. Must run after protect.
 */
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'super-admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: super-admin only' });
};

module.exports = { protect, superAdminOnly };
