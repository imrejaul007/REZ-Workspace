/**
 * PROPFLOW - Real Estate AI Operating System
 * Authentication Routes
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { config } from '../config';
import { logger } from '../config/logger';
import {
  authenticate,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  authLimiter,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import { registerUserSchema, loginSchema } from '../schemas/validation';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, password, role, assignedRegion } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw Errors.conflict('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: role || 'agent',
      assignedRegion
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info('User registered', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token,
      refreshToken
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw Errors.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw Errors.forbidden('Account has been deactivated');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw Errors.unauthorized('Invalid email or password');
    }

    // Update login info
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedRegion: user.assignedRegion
      },
      token,
      refreshToken
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw Errors.badRequest('Refresh token required');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw Errors.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw Errors.unauthorized('User not found or inactive');
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw Errors.notFound('User');
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedRegion: user.assignedRegion,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt
      }
    });
  })
);

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post(
  '/change-password',
  authenticate,
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);

    if (!user) {
      throw Errors.notFound('User');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw Errors.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    logger.info('Password changed', { userId: user._id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

export default router;