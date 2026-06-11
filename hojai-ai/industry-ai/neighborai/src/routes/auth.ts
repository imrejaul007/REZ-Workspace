/**
 * NEIGHBORAI - Auth Routes
 */

import { Router, Response } from 'express';
import { User } from '../models';
import { loginSchema, registerSchema } from '../utils/validators';
import { authMiddleware, AuthRequest, generateToken, hashPassword, comparePassword } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await User.create({
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      role: validatedData.role,
      flatNumber: validatedData.flatNumber
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      flatNumber: user.flatNumber
    });

    logger.info('New user registered', { userId: user._id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        flatNumber: user.flatNumber
      },
      token,
      message: 'Registration successful'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Compare password
    const isMatch = await comparePassword(validatedData.password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      flatNumber: user.flatNumber
    });

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        flatNumber: user.flatNumber
      },
      token,
      message: 'Login successful'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        flatNumber: user.flatNumber,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/auth/password - Change password
router.patch('/password', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
        code: 'VALIDATION_ERROR'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Update password
    user.password = await hashPassword(newPassword);
    await user.save();

    logger.info('Password changed', { userId: user._id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/seed - Seed default admin user
router.post('/seed', async (req: AuthRequest, res: Response, next) => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists',
        code: 'ADMIN_EXISTS'
      });
    }

    // Create default admin
    const hashedPassword = await hashPassword('admin123');
    const admin = await User.create({
      email: 'admin@neighborai.com',
      password: hashedPassword,
      name: 'Society Admin',
      role: 'admin',
      flatNumber: 'ADMIN'
    });

    logger.info('Default admin created', { userId: admin._id });

    res.status(201).json({
      success: true,
      message: 'Default admin user created',
      credentials: {
        email: 'admin@neighborai.com',
        password: 'admin123'
      },
      warning: 'Please change the default password after first login'
    });
  } catch (error) {
    next(error);
  }
});

export default router;