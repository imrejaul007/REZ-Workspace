/**
 * LEDGERAI - Authentication Routes
 * User registration, login, and token management
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, AuditLog } from '../models';
import { authenticate, authorize, generateToken } from '../middleware/auth';
import { validate, registerUserSchema, loginUserSchema } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import logger from '../middleware/logger';

const router = Router();

// ============================================
// POST /api/auth/register - Register new user
// ============================================
router.post('/register', authLimiter, validate(registerUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email already registered',
        code: 'USER_EXISTS'
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'user',
      isActive: true
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Log the registration
    await AuditLog.create({
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info('User registered', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    logger.error('Registration error', { error });
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// ============================================
// POST /api/auth/login - User login
// ============================================
router.post('/login', authLimiter, validate(loginUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed attempt
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      logger.warn('Failed login attempt', { email, ip: req.ip });

      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// ============================================
// GET /api/auth/me - Get current user
// ============================================
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get current user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      code: 'GET_USER_ERROR'
    });
  }
});

// ============================================
// POST /api/auth/change-password - Change password
// ============================================
router.post('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current and new passwords are required',
        code: 'MISSING_PASSWORD'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    // Log password change
    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info('Password changed', { userId: user._id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// ============================================
// GET /api/auth/users - List users (admin only)
// ============================================
router.get('/users', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isActive, search, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('List users error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
      code: 'LIST_USERS_ERROR'
    });
  }
});

// ============================================
// PATCH /api/auth/users/:id - Update user (admin only)
// ============================================
router.patch('/users/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Prevent self-demotion from admin
    if (req.params.id === req.user?.userId && role && role !== 'admin') {
      res.status(400).json({
        success: false,
        error: 'Cannot change your own admin role',
        code: 'SELF_DEMOTION'
      });
      return;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Log the update
    await AuditLog.create({
      userId: req.user?.userId ? undefined : undefined,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user._id,
      details: { updatedBy: req.user?.userId, changes: { name, role, isActive } },
      ipAddress: req.ip
    });

    logger.info('User updated', { userId: user._id, updatedBy: req.user?.userId });

    res.json({
      success: true,
      data: { user: { ...user.toObject(), password: undefined } },
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// ============================================
// DELETE /api/auth/users/:id - Delete user (admin only)
// ============================================
router.delete('/users/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user?.userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
        code: 'SELF_DELETE'
      });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Soft delete - deactivate instead of hard delete
    user.isActive = false;
    await user.save();

    // Log deletion
    await AuditLog.create({
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: user._id,
      details: { deletedBy: req.user?.userId, email: user.email },
      ipAddress: req.ip
    });

    logger.info('User deactivated', { userId: req.params.id, deletedBy: req.user?.userId });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      code: 'DELETE_USER_ERROR'
    });
  }
});

// ============================================
// GET /api/auth/audit-log - Get audit logs (admin only)
// ============================================
router.get('/audit-log', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, action, entityType, startDate, endDate, page = '1', limit = '50' } = req.query;

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Get audit logs error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs',
      code: 'AUDIT_LOGS_ERROR'
    });
  }
});

export default router;