/**
 * NEIGHBORAI - Complaints Routes
 */

import { Router, Response } from 'express';
import { Complaint } from '../models';
import { complaintSchema, complaintUpdateSchema } from '../utils/validators';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { ComplaintAgentService } from '../services/ai-employees';
import { logger } from '../middleware/logger';

const router = Router();

// GET /api/complaints - List all complaints
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, priority, category, flatNumber, limit = 50, page = 1 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (flatNumber) query.flatNumber = flatNumber;

    const skip = (Number(page) - 1) * Number(limit);

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Complaint.countDocuments(query);

    // Get statistics
    const stats = await ComplaintAgentService.getComplaintStats();

    logger.info('Complaints fetched', {
      count: complaints.length,
      total,
      filters: req.query,
      userId: req.userId
    });

    res.json({
      success: true,
      complaints,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stats
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id - Get single complaint
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
        code: 'COMPLAINT_NOT_FOUND'
      });
    }

    // Get tracking info
    const tracking = await ComplaintAgentService.trackComplaint(req.params.id);

    res.json({
      success: true,
      complaint,
      tracking: tracking.resolution
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints - Register new complaint
router.post('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = complaintSchema.parse(req.body);

    const result = await ComplaintAgentService.registerComplaint(
      validatedData.residentId,
      validatedData.flatNumber,
      validatedData.category,
      validatedData.description,
      validatedData.priority,
      validatedData.wing
    );

    res.status(201).json({
      success: true,
      ...result
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

// PATCH /api/complaints/:id - Update complaint
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = complaintUpdateSchema.parse(req.body);

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
        code: 'COMPLAINT_NOT_FOUND'
      });
    }

    // Update fields
    Object.assign(complaint, validatedData);

    // Set resolvedAt if status changed to resolved
    if (validatedData.status === 'resolved' && complaint.status !== 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    logger.info('Complaint updated', {
      complaintId: complaint._id,
      updates: Object.keys(validatedData),
      userId: req.userId
    });

    res.json({
      success: true,
      complaint,
      message: `Complaint ${complaint._id.toString().slice(-8).toUpperCase()} updated`
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

// POST /api/complaints/:id/resolve - Resolve complaint
router.post('/:id/resolve', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { resolution, resolvedBy } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        error: 'Resolution description is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await ComplaintAgentService.resolveComplaint(
      req.params.id,
      resolution,
      resolvedBy || req.userId || 'Admin'
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Complaint not found') {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
        code: 'COMPLAINT_NOT_FOUND'
      });
    }
    next(error);
  }
});

// DELETE /api/complaints/:id - Delete complaint
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
        code: 'COMPLAINT_NOT_FOUND'
      });
    }

    logger.info('Complaint deleted', {
      complaintId: req.params.id,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/stats/summary - Get complaint statistics
router.get('/stats/summary', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await ComplaintAgentService.getComplaintStats();

    // Get category breakdown
    const byCategory = await Complaint.aggregate([
      { $match: { status: { $in: ['open', 'in-progress'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get priority breakdown
    const byPriority = await Complaint.aggregate([
      { $match: { status: { $in: ['open', 'in-progress'] } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      ...stats,
      categoryBreakdown: byCategory.map(c => ({ category: c._id, count: c.count })),
      priorityBreakdown: byPriority.map(p => ({ priority: p._id, count: p.count }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;