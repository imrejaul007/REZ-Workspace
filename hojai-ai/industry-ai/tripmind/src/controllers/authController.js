const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { NotFoundError, UnauthorizedError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = new User({
      email,
      password,
      name,
      phone
    });

    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    throw error;
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    throw error;
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    throw error;
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    throw error;
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'preferences', 'travelPreferences', 'address'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    logger.info(`Profile updated: ${user.email}`);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    throw error;
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      throw new NotFoundError('User');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    logger.info(`Password changed: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token,
        refreshToken
      }
    });
  } catch (error) {
    throw error;
  }
};