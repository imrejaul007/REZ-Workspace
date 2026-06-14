/**
 * Schedule Routes
 *
 * Endpoints for housekeeping staff scheduling
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { scheduleService } from '../services/schedule.service';
import { HousekeepingStaff } from '../models/Staff';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[schedule-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createStaffSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  role: z.enum(['housekeeper', 'supervisor', 'manager']),
  shift: z.enum(['morning', 'afternoon', 'night']),
});

const updateStaffSchema = createStaffSchema.partial();

const createScheduleSchema = z.object({
  date: z.string().datetime(),
  assignments: z.array(z.object({
    staffId: z.string().min(1),
    roomIds: z.array(z.string().min(1)),
  })),
});

// ─── Staff Routes ─────────────────────────────────────────────────────────────

/**
 * Create staff
 * POST /api/schedule/staff
 */
router.post('/staff', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const input = createStaffSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const staffId = 'HS' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();

    const staff = new HousekeepingStaff({
      staffId,
      hotelId,
      ...input,
      assignedRooms: [],
      isActive: true,
    });

    await staff.save();
    log('Staff created', { staffId, hotelId });

    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff created successfully',
    });
  } catch (error) {
    log('Create staff error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create staff' });
  }
});

/**
 * Get staff by hotel
 * GET /api/schedule/staff
 */
router.get('/staff', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;
    const shift = req.query.shift as string;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const query: Record<string, unknown> = { hotelId, isActive: true };
    if (shift) query.shift = shift;

    const staff = await HousekeepingStaff.find(query);

    res.json({
      success: true,
      data: { staff, total: staff.length },
    });
  } catch (error) {
    log('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to get staff' });
  }
});

/**
 * Get staff by ID
 * GET /api/schedule/staff/:staffId
 */
router.get('/staff/:staffId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const staff = await HousekeepingStaff.findOne({ staffId: req.params.staffId });

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff not found' });
      return;
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    log('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to get staff' });
  }
});

/**
 * Update staff
 * PUT /api/schedule/staff/:staffId
 */
router.put('/staff/:staffId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const input = updateStaffSchema.parse(req.body);

    const staff = await HousekeepingStaff.findOneAndUpdate(
      { staffId: req.params.staffId },
      { $set: input },
      { new: true }
    );

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff not found' });
      return;
    }

    res.json({
      success: true,
      data: staff,
      message: 'Staff updated successfully',
    });
  } catch (error) {
    log('Update staff error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
});

/**
 * Delete staff (soft delete)
 * DELETE /api/schedule/staff/:staffId
 */
router.delete('/staff/:staffId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const staff = await HousekeepingStaff.findOneAndUpdate(
      { staffId: req.params.staffId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Staff deactivated successfully',
    });
  } catch (error) {
    log('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete staff' });
  }
});

// ─── Schedule Routes ──────────────────────────────────────────────────────────

/**
 * Create daily schedule
 * POST /api/schedule
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'supervisor'), async (req: Request, res: Response) => {
  try {
    const input = createScheduleSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const schedule = await scheduleService.createSchedule(hotelId, input);

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully',
    });
  } catch (error) {
    log('Create schedule error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
});

/**
 * Get daily schedule
 * GET /api/schedule/:hotelId
 */
router.get('/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const scheduleDate = date ? new Date(date as string) : new Date();

    const schedule = await scheduleService.getDailySchedule(req.params.hotelId, scheduleDate);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    log('Get schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to get schedule' });
  }
});

/**
 * Auto-assign tasks
 * POST /api/schedule/:hotelId/auto-assign
 */
router.post('/:hotelId/auto-assign', authenticateToken, requireRoles('admin', 'hotel_owner', 'supervisor'), async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const scheduleDate = date ? new Date(date) : new Date();

    const result = await scheduleService.autoAssignTasks(req.params.hotelId, scheduleDate);

    res.json({
      success: true,
      data: result,
      message: `Assigned ${result.assigned} tasks`,
    });
  } catch (error) {
    log('Auto-assign error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-assign tasks' });
  }
});

/**
 * Get staff performance
 * GET /api/schedule/:staffId/performance
 */
router.get('/:staffId/performance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate required' });
      return;
    }

    const performance = await scheduleService.getStaffPerformance(
      req.params.staffId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, data: performance });
  } catch (error) {
    log('Get performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get staff performance' });
  }
});

export default router;
