import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import config from '../../config/index.js';
import { User, Tenant, Employee } from '../../models/index.js';
import { authenticate, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
});

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
    });
  })
);

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, companyName } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const tenant = await Tenant.create({
      name: companyName,
      slug: companyName.toLowerCase().replace(/\s+/g, '-'),
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      tenantId: tenant._id.toString(),
    });

    await Employee.create({
      tenantId: tenant._id.toString(),
      employeeId: `EMP-${Date.now()}`,
      firstName,
      lastName,
      email,
      department: 'Management',
      designation: 'Administrator',
      joiningDate: new Date(),
      userId: user._id.toString(),
    });

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
        tenant,
      },
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const employee = await Employee.findOne({ userId: user._id.toString(), isDeleted: false });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        employee,
      },
    });
  })
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

export default router;
