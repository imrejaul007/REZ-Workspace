/**
 * NEIGHBORAI - Visitors Routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { Visitor } from '../models';
import { visitorCheckInSchema } from '../utils/validators';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { VisitorAgentService } from '../services/ai-employees';
import { logger } from '../middleware/logger';

const router = Router();

// Webhook configuration
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'neighborai' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'neighborai', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

// GET /api/visitors - List visitors
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, hostFlat, date, limit = 50 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (hostFlat) query.hostFlat = hostFlat;
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      query.checkIn = { $gte: startOfDay, $lte: endOfDay };
    }

    const visitors = await Visitor.find(query)
      .sort({ checkIn: -1 })
      .limit(Number(limit));

    const total = await Visitor.countDocuments(query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Visitor.countDocuments({
      checkIn: { $gte: today },
      ...(hostFlat ? { hostFlat } : {})
    });

    logger.info('Visitors fetched', { count: visitors.length, filters: req.query, userId: req.userId });

    res.json({
      success: true,
      visitors,
      total,
      stats: {
        todayCount,
        currentlyInside: await Visitor.countDocuments({ status: 'checked-in' }),
        pendingApproval: await Visitor.countDocuments({ status: 'pending' })
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/visitors/:id - Get visitor by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      visitor
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/visitors/checkin - Check in visitor
router.post('/checkin', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = visitorCheckInSchema.parse(req.body);

    // Generate entry code
    const entryCode = generateEntryCode();

    const visitor = await Visitor.create({
      ...validatedData,
      checkIn: new Date(),
      status: 'checked-in',
      entryCode
    });

    logger.info('Visitor checked in', {
      visitorId: visitor._id,
      hostFlat: visitor.hostFlat,
      entryCode
    });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('neighborai.visitor.checked_in', { visitorId: visitor._id.toString(), name: visitor.name, hostFlat: visitor.hostFlat, entryCode });
    await syncToHOJAI('visitor', 'checked_in', { visitorId: visitor._id.toString(), name: visitor.name, hostFlat: visitor.hostFlat, entryCode });

    res.status(201).json({
      success: true,
      visitor,
      message: `${visitor.name} checked in for Flat ${visitor.hostFlat}`,
      entryCode: visitor.entryCode
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

// POST /api/visitors/checkout - Check out visitor
router.post('/checkout', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { visitorId, id } = req.body;
    const targetId = visitorId || id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Visitor ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const visitor = await Visitor.findById(targetId);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }

    if (visitor.status === 'checked-out') {
      return res.status(400).json({
        success: false,
        error: 'Visitor already checked out',
        code: 'ALREADY_CHECKED_OUT'
      });
    }

    visitor.status = 'checked-out';
    visitor.checkOut = new Date();
    await visitor.save();

    const duration = visitor.checkOut.getTime() - visitor.checkIn.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    logger.info('Visitor checked out', {
      visitorId: visitor._id,
      duration: `${hours}h ${minutes}m`
    });

    res.json({
      success: true,
      visitor,
      duration: hours > 0 ? `${hours} hour(s) ${minutes} minute(s)` : `${minutes} minute(s)`,
      message: `${visitor.name} checked out. Visit duration: ${hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/visitors/approve/:id - Approve visitor
router.post('/approve/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }

    visitor.status = 'checked-in';
    visitor.approvedBy = req.body.approvedBy || 'Security';
    visitor.checkIn = new Date();
    await visitor.save();

    logger.info('Visitor approved', {
      visitorId: visitor._id,
      approvedBy: visitor.approvedBy
    });

    res.json({
      success: true,
      visitor,
      message: `${visitor.name} approved for Flat ${visitor.hostFlat}`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/visitors/deny/:id - Deny visitor
router.post('/deny/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }

    visitor.status = 'denied';
    visitor.approvedBy = req.body.deniedBy || 'Security';
    await visitor.save();

    logger.info('Visitor denied', { visitorId: visitor._id });

    res.json({
      success: true,
      visitor,
      message: `${visitor.name} denied entry to Flat ${visitor.hostFlat}`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/visitors/:id - Delete visitor record
router.delete('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }

    logger.info('Visitor record deleted', { visitorId: req.params.id });

    res.json({
      success: true,
      message: 'Visitor record deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate entry code
function generateEntryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default router;