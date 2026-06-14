/**
 * Shift Routes
 */

import { Router, Request, Response } from 'express';
import { Shift } from '../models/Shift';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Create shift
router.post('/', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const shiftId = `SFT${Date.now()}${crypto.randomUUID().split('-')[0]}`;
    const shift = new Shift({
      shiftId,
      ...req.body,
    });
    await shift.save();
    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create shift' });
  }
});

// Get shifts by date range
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, employeeId, startDate, endDate, status } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const shifts = await Shift.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch shifts' });
  }
});

// Get shift by ID
router.get('/:shiftId', async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findOne({ shiftId: req.params.shiftId });
    if (!shift) {
      res.status(404).json({ success: false, error: 'Shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch shift' });
  }
});

// Update shift
router.put('/:shiftId', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findOneAndUpdate(
      { shiftId: req.params.shiftId },
      req.body,
      { new: true }
    );
    if (!shift) {
      res.status(404).json({ success: false, error: 'Shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update shift' });
  }
});

// Cancel shift
router.post('/:shiftId/cancel', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findOneAndUpdate(
      { shiftId: req.params.shiftId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!shift) {
      res.status(404).json({ success: false, error: 'Shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel shift' });
  }
});

export { router as shiftRoutes };
