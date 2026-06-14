/**
 * REZ Copilot - Route Definitions
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiCoachingService } from '../services/aiService';
import { contextService } from '../services/contextService';
import { sessionService } from '../services/sessionService';
import { logger } from '../middleware/logger';

const router = Router();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  dealId: z.string().optional(),
  companyId: z.string().optional(),
});

const analyzeDealSchema = z.object({
  dealId: z.string(),
  includeResearch: z.boolean().optional(),
  focusAreas: z.array(z.enum(['risks', 'opportunities', 'competitive', 'engagement', 'next_steps'])).optional(),
});

const emailDraftSchema = z.object({
  dealId: z.string(),
  contactId: z.string(),
  template: z.string().optional(),
  objective: z.enum(['follow_up', 'introduction', 'proposal', 'meeting_request', 'check_in', 'custom']),
  tone: z.enum(['formal', 'casual', 'persuasive', 'collaborative']).optional(),
  keyPoints: z.array(z.string()).optional(),
});

const callPrepSchema = z.object({
  dealId: z.string(),
  contactId: z.string(),
  callObjective: z.string().optional(),
  duration: z.number().min(5).max(120).optional(),
});

// ==================== Chat Routes ====================

/**
 * POST /api/chat
 * Send a message to the copilot
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, dealId, companyId } = chatSchema.parse(req.body);

    // Create or use existing session
    let sessionId = req.headers['x-session-id'] as string;
    let session = sessionId ? sessionService.getSession(sessionId) : undefined;

    if (!session) {
      session = sessionService.createSession('user', dealId, companyId);
      sessionId = session.id;
    }

    // Process message
    const response = await sessionService.processMessage(sessionId, {
      message,
      dealId: dealId || session.dealId,
      companyId: companyId || session.companyId,
    });

    res.json({
      ...response,
      sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      logger.error(`Chat error: ${error}`);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

/**
 * GET /api/chat/sessions
 * Get user's chat sessions
 */
router.get('/chat/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sessions = sessionService.getUserSessions(userId);

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        dealId: s.dealId,
        companyId: s.companyId,
        messageCount: s.messages.length,
        lastMessage: s.messages[s.messages.length - 1],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        tags: s.tags,
      })),
    });
  } catch (error) {
    logger.error(`Get sessions error: ${error}`);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

/**
 * GET /api/chat/sessions/:sessionId
 * Get specific session with messages
 */
router.get('/chat/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = sessionService.getSession(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error) {
    logger.error(`Get session error: ${error}`);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete a chat session
 */
router.delete('/chat/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const deleted = sessionService.deleteSession(req.params.sessionId, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error(`Delete session error: ${error}`);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ==================== Deal Analysis Routes ====================

/**
 * POST /api/deals/analyze
 * Analyze a deal with full context
 */
router.post('/deals/analyze', async (req: Request, res: Response) => {
  try {
    const { dealId, includeResearch, focusAreas } = analyzeDealSchema.parse(req.body);

    // Get deal context
    const context = await contextService.getDealContext(dealId);
    if (!context) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    // Perform analysis
    const analysis = await aiCoachingService.analyzeDeal(context.deal, context.company);

    // Optionally do research
    let research: Awaited<ReturnType<typeof aiCoachingService.researchCompany>> | undefined;
    if (includeResearch) {
      research = await aiCoachingService.researchCompany(context.company);
    }

    res.json({
      analysis,
      research,
      meta: {
        analyzedAt: new Date(),
        dealId,
        companyId: context.deal.companyId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      logger.error(`Analyze deal error: ${error}`);
      res.status(500).json({ error: 'Failed to analyze deal' });
    }
  }
});

/**
 * GET /api/deals/:dealId/score
 * Get quick deal score
 */
router.get('/deals/:dealId/score', async (req: Request, res: Response) => {
  try {
    const context = await contextService.getDealContext(req.params.dealId);
    if (!context) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    const analysis = await aiCoachingService.analyzeDeal(context.deal, context.company);

    res.json({
      dealId: req.params.dealId,
      score: analysis.overallScore,
      momentum: analysis.momentum,
      healthStatus: analysis.healthStatus,
      topRisks: analysis.risks.slice(0, 3),
      topOpportunities: analysis.opportunities.slice(0, 3),
      updatedAt: analysis.generatedAt,
    });
  } catch (error) {
    logger.error(`Deal score error: ${error}`);
    res.status(500).json({ error: 'Failed to get deal score' });
  }
});

// ==================== Email Generation Routes ====================

/**
 * POST /api/email/generate
 * Generate an email draft
 */
router.post('/email/generate', async (req: Request, res: Response) => {
  try {
    const { dealId, contactId, template, objective, tone, keyPoints } = emailDraftSchema.parse(req.body);

    // Get deal context
    const context = await contextService.getDealContext(dealId);
    if (!context) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    // Find contact
    const contact = context.company.contacts.find((c) => c.contactId === contactId);
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    // Generate email
    const email = await aiCoachingService.generateEmailDraft(
      context.deal,
      contact,
      objective,
      tone,
      keyPoints
    );

    res.json({
      email,
      meta: {
        dealId,
        contactId,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      logger.error(`Email generation error: ${error}`);
      res.status(500).json({ error: 'Failed to generate email' });
    }
  }
});

/**
 * POST /api/email/templates
 * Get available email templates
 */
router.get('/email/templates', async (req: res) => {
  const templates = [
    {
      id: 'follow_up',
      name: 'Follow Up',
      description: 'Gentle follow-up after previous touchpoint',
      objective: 'follow_up',
      tone: ['collaborative', 'casual'],
    },
    {
      id: 'meeting_request',
      name: 'Meeting Request',
      description: 'Request a meeting or call',
      objective: 'meeting_request',
      tone: ['formal', 'persuasive'],
    },
    {
      id: 'introduction',
      name: 'Introduction',
      description: 'Initial outreach to a prospect',
      objective: 'introduction',
      tone: ['formal', 'persuasive'],
    },
    {
      id: 'proposal',
      name: 'Proposal',
      description: 'Send proposal or quote',
      objective: 'proposal',
      tone: ['formal', 'collaborative'],
    },
    {
      id: 'check_in',
      name: 'Check In',
      description: 'Regular status check-in',
      objective: 'check_in',
      tone: ['casual', 'collaborative'],
    },
  ];

  (res as Response).json({ templates });
});

// ==================== Call Preparation Routes ====================

/**
 * POST /api/call-prep/generate
 * Generate call preparation notes
 */
router.post('/call-prep/generate', async (req: Request, res: Response) => {
  try {
    const { dealId, contactId, callObjective, duration } = callPrepSchema.parse(req.body);

    // Get deal context
    const context = await contextService.getDealContext(dealId);
    if (!context) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    // Find contact
    const contact = context.company.contacts.find((c) => c.contactId === contactId);
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    // Generate call prep
    const callPrep = await aiCoachingService.generateCallPrep(
      context.deal,
      contact,
      callObjective,
      duration
    );

    res.json({
      callPrep,
      meta: {
        dealId,
        contactId,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      logger.error(`Call prep error: ${error}`);
      res.status(500).json({ error: 'Failed to generate call prep' });
    }
  }
});

// ==================== Research Routes ====================

/**
 * POST /api/research/company
 * Research a company
 */
router.post('/research/company', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      res.status(400).json({ error: 'companyId is required' });
      return;
    }

    const company = await contextService.getCompanyContext(companyId);
    const research = await aiCoachingService.researchCompany(company);

    res.json({
      research,
      meta: {
        companyId,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Research error: ${error}`);
    res.status(500).json({ error: 'Failed to research company' });
  }
});

// ==================== Talk Track Routes ====================

/**
 * GET /api/talk-tracks/:dealId
 * Get talk tracks for a deal
 */
router.get('/talk-tracks/:dealId', async (req: Request, res: Response) => {
  try {
    const context = await contextService.getDealContext(req.params.dealId);
    if (!context) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    const talkTracks = await aiCoachingService.generateTalkTracks(context.deal, context.company);

    res.json({
      talkTracks,
      meta: {
        dealId: req.params.dealId,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Talk tracks error: ${error}`);
    res.status(500).json({ error: 'Failed to get talk tracks' });
  }
});

// ==================== Health Routes ====================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Check context service connectivity
    await contextService.getDealContext('health-check');

    const stats = sessionService.getStats();

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      modelStatus: 'connected', // Would check actual LLM connectivity
      responseTime: Date.now() - startTime,
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      uptime: process.uptime(),
      error: 'Service connectivity issue',
      timestamp: new Date(),
    });
  }
});

export default router;
