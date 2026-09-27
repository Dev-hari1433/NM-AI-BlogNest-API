const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT token in Bearer authorization header.
 * Attaches authenticated user document to req.user.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({
      success: false,
      message: 'Malformed authorization token. Expected Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token'
    });
  }
};

/**
 * Optional authentication middleware: if Authorization header is provided,
 * verifies and attaches user to req.user. Otherwise, leaves req.user null and continues.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(parts[1], env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
