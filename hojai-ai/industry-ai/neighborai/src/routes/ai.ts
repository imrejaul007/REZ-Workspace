/**
 * NEIGHBORAI - AI Employee Routes
 */

import { Router, Response } from 'express';
import { optionalAuth, authMiddleware, AuthRequest } from '../middleware/auth';
import { SocietyManagerService, VisitorAgentService, ComplaintAgentService, CommunityAgentService } from '../services/ai-employees';
import { societyQuerySchema, visitorPreApproveSchema, complaintTrackSchema, eventPlanSchema } from '../utils/validators';
import { logger } from '../middleware/logger';

const router = Router();

// ============================================
// AI STATUS
// ============================================

// GET /ai/status - Get AI system status
router.get('/ai/status', (req, res) => {
  res.json({
    success: true,
    active: true,
    version: '1.0.0',
    service: 'NEIGHBORAI - Residential Society AI Operating System',
    timestamp: new Date().toISOString(),
    aiEmployees: {
      societyManager: {
        name: 'Society Manager AI',
        status: 'active',
        capabilities: ['Operations', 'Billing', 'Maintenance', 'Resident Directory'],
        description: 'Handles society operations, billing queries, and maintenance tracking'
      },
      visitorAgent: {
        name: 'Visitor Agent AI',
        status: 'active',
        capabilities: ['Pre-approval', 'Check-in', 'Check-out', 'Entry codes'],
        description: 'Manages visitor registration, approvals, and gate entry'
      },
      complaintAgent: {
        name: 'Complaint Agent AI',
        status: 'active',
        capabilities: ['Registration', 'Tracking', 'Escalation', 'Resolution'],
        description: 'Tracks complaints, monitors SLAs, and escalates issues'
      },
      communityAgent: {
        name: 'Community Agent AI',
        status: 'active',
        capabilities: ['Event Planning', 'RSVP Management', 'Announcements', 'Analytics'],
        description: 'Coordinates community events and manages communications'
      }
    },
    totalAiEmployees: 4,
    uptime: process.uptime(),
    features: {
      voiceReady: true,
      whatsappIntegration: true,
      securityIntegration: true,
      analyticsDashboard: true
    }
  });
});

// ============================================
// SOCIETY MANAGER - Operations & Billing AI
// ============================================

// POST /api/ai/society/query - Handle society queries
router.post('/api/ai/society/query', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = societyQuerySchema.parse(req.body);
    const { flatNumber, query } = validatedData;

    logger.info('Society query received', { query: query.substring(0, 50), flatNumber, userId: req.userId });

    const response = await SocietyManagerService.handleQuery(flatNumber, query);

    res.json({
      success: true,
      response,
      metadata: {
        query: query.substring(0, 100),
        flatNumber,
        timestamp: new Date().toISOString(),
        processedBy: 'Society Manager AI'
      }
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

// POST /api/ai/society/billing - Get billing info via AI
router.post('/api/ai/society/billing', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { flatNumber } = req.body;

    const response = await SocietyManagerService.handleBillingQuery(flatNumber);

    res.json({
      success: true,
      response,
      metadata: {
        flatNumber,
        timestamp: new Date().toISOString(),
        processedBy: 'Society Manager AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// VISITOR AGENT - Visitor Management AI
// ============================================

// POST /api/ai/visitor/pre-approve - Pre-approve visitor
router.post('/api/ai/visitor/pre-approve', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = visitorPreApproveSchema.parse(req.body);
    const { flatNumber, visitorName, phone, purpose } = validatedData;

    logger.info('Visitor pre-approval requested', { flatNumber, visitorName });

    const result = await VisitorAgentService.preApproveVisitor(flatNumber, visitorName, phone, purpose);

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Visitor Agent AI'
      }
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

// POST /api/ai/visitor/checkin - Check in visitor via AI
router.post('/api/ai/visitor/checkin', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { visitorId, entryCode } = req.body;

    // Find visitor by ID or entry code
    let visitor;
    if (visitorId) {
      visitor = await VisitorAgentService.checkInVisitor(visitorId);
    } else if (entryCode) {
      const { Visitor } = await import('../models');
      const dbVisitor = await Visitor.findOne({ entryCode: entryCode.toUpperCase() });
      if (dbVisitor) {
        visitor = await VisitorAgentService.checkInVisitor(dbVisitor._id.toString());
      } else {
        return res.status(404).json({
          success: false,
          error: 'Invalid entry code',
          code: 'INVALID_ENTRY_CODE'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Visitor ID or entry code required',
        code: 'VALIDATION_ERROR'
      });
    }

    res.json({
      success: true,
      ...visitor,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Visitor Agent AI'
      }
    });
  } catch (error: any) {
    if (error.message === 'Visitor not found') {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }
    next(error);
  }
});

// POST /api/ai/visitor/checkout - Check out visitor via AI
router.post('/api/ai/visitor/checkout', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        error: 'Visitor ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await VisitorAgentService.checkOutVisitor(visitorId);

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Visitor Agent AI'
      }
    });
  } catch (error: any) {
    if (error.message === 'Visitor not found') {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }
    next(error);
  }
});

// GET /api/ai/visitor/summary - Get visitor summary
router.get('/api/ai/visitor/summary', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { flatNumber } = req.query;

    const result = await VisitorAgentService.getVisitorSummary(flatNumber as string);

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Visitor Agent AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// COMPLAINT AGENT - Issue Tracking AI
// ============================================

// POST /api/ai/complaint/track - Track complaint status
router.post('/api/ai/complaint/track', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = complaintTrackSchema.parse(req.body);
    const { complaintId } = validatedData;

    logger.info('Complaint tracking requested', { complaintId });

    const result = await ComplaintAgentService.trackComplaint(complaintId);

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Complaint Agent AI'
      }
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

// POST /api/ai/complaint/register - Register complaint via AI
router.post('/api/ai/complaint/register', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { residentId, flatNumber, category, description, priority = 'medium', wing } = req.body;

    if (!residentId || !flatNumber || !category || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: residentId, flatNumber, category, description',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await ComplaintAgentService.registerComplaint(
      residentId,
      flatNumber,
      category,
      description,
      priority,
      wing
    );

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Complaint Agent AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/complaint/stats - Get complaint statistics
router.get('/api/ai/complaint/stats', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await ComplaintAgentService.getComplaintStats();

    res.json({
      success: true,
      ...stats,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Complaint Agent AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// COMMUNITY AGENT - Events & Announcements AI
// ============================================

// POST /api/ai/event/plan - Plan event via AI
router.post('/api/ai/event/plan', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = eventPlanSchema.parse(req.body);
    const { title, description, suggestedDate, organizer } = validatedData;

    logger.info('Event planning requested', { title, userId: req.userId });

    const result = await CommunityAgentService.planEvent(title, description, suggestedDate, organizer);

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Community Agent AI'
      }
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

// GET /api/ai/event/upcoming - Get upcoming events
router.get('/api/ai/event/upcoming', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await CommunityAgentService.getUpcomingEvents();

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Community Agent AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/event/analytics - Get event analytics
router.get('/api/ai/event/analytics', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await CommunityAgentService.getEventAnalytics();

    res.json({
      success: true,
      ...result,
      metadata: {
        timestamp: new Date().toISOString(),
        processedBy: 'Community Agent AI'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI CONVERSATION
// ============================================

// POST /api/ai/converse - Natural language conversation with AI
router.post('/api/ai/converse', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const lowerMessage = message.toLowerCase();
    let response: any;
    let agent = 'Society Manager AI';

    // Route to appropriate AI based on message content
    if (lowerMessage.includes('visitor') || lowerMessage.includes('guest') || lowerMessage.includes('entry')) {
      agent = 'Visitor Agent AI';
      if (lowerMessage.includes('pre-approve') || lowerMessage.includes('preapprove') || lowerMessage.includes('register')) {
        const result = await VisitorAgentService.getVisitorSummary(context?.flatNumber);
        response = { type: 'visitor', ...result };
      } else {
        const result = await VisitorAgentService.getVisitorSummary(context?.flatNumber);
        response = { type: 'visitor', ...result };
      }
    } else if (lowerMessage.includes('complaint') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      agent = 'Complaint Agent AI';
      const stats = await ComplaintAgentService.getComplaintStats();
      response = { type: 'complaint', ...stats };
    } else if (lowerMessage.includes('event') || lowerMessage.includes('party') || lowerMessage.includes('celebration')) {
      agent = 'Community Agent AI';
      const result = await CommunityAgentService.getUpcomingEvents();
      response = { type: 'event', ...result };
    } else if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || lowerMessage.includes('maintenance')) {
      agent = 'Society Manager AI';
      const result = await SocietyManagerService.handleBillingQuery(context?.flatNumber);
      response = { type: 'billing', ...result };
    } else {
      const result = await SocietyManagerService.handleQuery(context?.flatNumber, message);
      response = result;
    }

    logger.info('AI conversation', { message: message.substring(0, 50), agent });

    res.json({
      success: true,
      response,
      agent,
      metadata: {
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;