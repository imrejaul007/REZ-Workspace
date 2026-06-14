/**
 * Class Capacity Routes - Fitness class enrollment and capacity management
 * Route: /api/v1/merchant/class-capacity
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { classCapacityService, EnrollResult, ClassStatusResult } from '../services/classCapacityService';

const router = Router();

// All routes require merchant authentication
router.use(merchantAuth);

// ─── CAPACITY MANAGEMENT ───────────────────────────────────────────────────────

// POST /:classId/capacity - Set class capacity
router.post('/:classId/capacity', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { maxCapacity, storeId, waitlistEnabled, waitlistLimit, autoNotify } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    if (!storeId || !Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid store ID' });
    }

    if (typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({ success: false, message: 'Max capacity must be a positive number' });
    }

    const capacity = await classCapacityService.setCapacity(classId, maxCapacity, storeId, merchantId!, {
      waitlistEnabled,
      waitlistLimit,
      autoNotify,
    });

    res.json({
      success: true,
      data: {
        classId: capacity.classId.toString(),
        maxCapacity: capacity.maxCapacity,
        currentEnrollment: capacity.currentEnrollment,
        waitlistEnabled: capacity.waitlistEnabled,
        waitlistLimit: capacity.waitlistLimit,
        waitlistCount: capacity.waitlistCount,
        autoNotify: capacity.autoNotify,
      },
    });
  } catch (error: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to set capacity' : error.message;
    res.status(500).json({ success: false, message });
  }
});

// GET /:classId/capacity - Get class capacity status
router.get('/:classId/capacity', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const merchantId = req.merchantId;

    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    const status = await classCapacityService.getClassStatus(classId, merchantId!);

    res.json({ success: true, data: status });
  } catch (error: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to get capacity status' : error.message;
    res.status(500).json({ success: false, message });
  }
});

// ─── ENROLLMENT ───────────────────────────────────────────────────────────────

// POST /:classId/enroll - Enroll a member in a class
router.post('/:classId/enroll', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { memberId } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    if (!memberId || !Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const result = await classCapacityService.enroll(classId, memberId, merchantId!);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      data: {
        enrolled: !result.waitlist,
        waitlist: result.waitlist,
        position: result.position,
      },
    });
  } catch (error: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to enroll member' : error.message;
    res.status(500).json({ success: false, message });
  }
});

// POST /:classId/cancel - Cancel enrollment
router.post('/:classId/cancel', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { memberId } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    if (!memberId || !Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const result = await classCapacityService.cancelEnrollment(classId, memberId, merchantId!);

    res.json({
      success: result.success,
      data: {
        cancelled: result.success,
        promotedFromWaitlist: result.promotedFromWaitlist,
      },
    });
  } catch (error: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to cancel enrollment' : error.message;
    res.status(500).json({ success: false, message });
  }
});

// ─── WAITLIST ─────────────────────────────────────────────────────────────────

// POST /:classId/waitlist - Add to waitlist
router.post('/:classId/waitlist', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { memberId } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    if (!memberId || !Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const position = await classCapacityService.addToWaitlist(classId, memberId, merchantId!);

    res.json({
      success: true,
      data: {
        added: true,
        position,
      },
    });
  } catch (error: unknown) {
    const statusCode = error.message.includes('not enabled') || error.message.includes('full') ? 400 : 500;
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to add to waitlist'
      : error.message;
    res.status(statusCode).json({ success: false, message });
  }
});

// GET /:classId/waitlist - Get waitlist
router.get('/:classId/waitlist', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const merchantId = req.merchantId;

    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    const waitlist = await classCapacityService.getWaitlist(classId, merchantId!);

    res.json({
      success: true,
      data: {
        waitlist,
        count: waitlist.length,
      },
    });
  } catch (error: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to get waitlist' : error.message;
    res.status(500).json({ success: false, message });
  }
});

// POST /:classId/notify-waitlist - Manually notify and promote from waitlist
router.post('/:classId/notify-waitlist', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const merchantId = req.merchantId;

    if (!classId || !Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }

    const promotedMembers = await classCapacityService.notifyFromWaitlist(classId, merchantId!);

    res.json({
      success: true,
      data: {
        promotedCount: promotedMembers.length,
        promotedMembers,
      },
    });
  } catch (error: unknown) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to notify from waitlist'
      : error.message;
    res.status(statusCode).json({ success: false, message });
  }
});

export default router;
