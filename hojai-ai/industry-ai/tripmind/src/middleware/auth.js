const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId).select('-password -refreshTokens');

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is deactivated');
      }

      req.user = user;
      req.userId = user._id;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`));
    }

    next();
  };
};

const isAdmin = authorize('admin');
const isAgent = authorize('agent', 'admin');
const isUser = authorize('user', 'agent', 'admin');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  isAdmin,
  isAgent,
  isUser
};