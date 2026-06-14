// ReZ Schedule - User Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  timeZone: z.string().optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
  phone: z.string().optional(),
  language: z.string().optional(),
  videoProvider: z.enum(['zoom', 'google_meet', 'teams', 'daily']).optional(),
});

const createUserSchema = z.object({
  userId: z.string(), // RABTUL Auth user ID
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  email: z.string().email(),
  timeZone: z.string().default('Asia/Kolkata'),
  weekStartDay: z.number().int().min(0).max(6).default(0),
});

/**
 * Get current user profile
 * GET /api/users/me
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        username: true,
        name: true,
        email: true,
        timeZone: true,
        weekStartDay: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        language: true,
        active: true,
        videoProvider: true,
        videoSettings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('[User] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * Create user profile
 * POST /api/users
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken',
      });
    }

    // Check if email is taken
    const existingEmail = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        userId: data.userId,
        username: data.username,
        name: data.name,
        email: data.email,
        timeZone: data.timeZone,
        weekStartDay: data.weekStartDay,
      },
    });

    // Create default schedule for user
    await prisma.schedule.create({
      data: {
        userId: user.id,
        name: 'Default',
        isDefault: true,
        availability: {
          createMany: {
            data: [
              { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
            ],
          },
        },
      },
    });

    logger.info(`[User] Created user ${user.username}`);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[User] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

/**
 * Update user profile
 * PATCH /api/users/me
 */
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { userId },
      data,
    });

    logger.info(`[User] Updated user ${user.username}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[User] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

/**
 * Get user by username (public)
 * GET /api/users/:username
 */
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        timeZone: true,
        active: true,
        eventTypes: {
          where: { active: true, isPublic: true },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            duration: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        timeZone: user.timeZone,
        eventTypes: user.eventTypes,
      },
    });
  } catch (error) {
    logger.error('[User] Get by username error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * Update video settings
 * PATCH /api/users/me/video
 */
router.patch('/me/video', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const { videoProvider, settings } = req.body;

    const user = await prisma.user.update({
      where: { userId },
      data: {
        videoProvider,
        videoSettings: settings,
      },
    });

    res.json({
      success: true,
      data: {
        videoProvider: user.videoProvider,
        videoSettings: user.videoSettings,
      },
    });
  } catch (error) {
    logger.error('[User] Video settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update video settings',
    });
  }
});

/**
 * Get user schedule
 * GET /api/users/me/schedule
 */
router.get('/me/schedule', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: { userId: user.id },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    logger.error('[User] Schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schedule',
    });
  }
});

/**
 * Create schedule
 * POST /api/users/me/schedule
 */
router.post('/me/schedule', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { name, isDefault, availability } = req.body;

    // If setting as default, unset others
    if (isDefault) {
      await prisma.schedule.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId: user.id,
        name: name || 'Custom Schedule',
        isDefault: isDefault || false,
        availability: {
          createMany: {
            data: availability || [
              { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
            ],
          },
        },
      },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    logger.info(`[User] Created schedule ${schedule.name}`);

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    logger.error('[User] Create schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
    });
  }
});

export default router;
