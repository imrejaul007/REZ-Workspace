import { Router, Response } from 'express';
import { whatsappSupportService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/support/whatsapp
 * Start WhatsApp support session
 */
router.post(
  '/whatsapp',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { employeeId, employeeName, phoneNumber } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const session = await whatsappSupportService.startSession(
      employeeId,
      employeeName,
      companyId,
      phoneNumber
    );

    res.status(201).json({ success: true, data: session });
  })
);

/**
 * GET /api/support/whatsapp/session
 * Get employee WhatsApp session
 */
router.get(
  '/whatsapp/session',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { employeeId } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId || !employeeId) {
      res.status(400).json({ success: false, error: 'employeeId and companyId are required' });
      return;
    }

    const session = await whatsappSupportService.getEmployeeSession(employeeId as string, companyId);

    if (!session) {
      res.status(404).json({ success: false, error: 'No active session found' });
      return;
    }

    res.json({ success: true, data: session });
  })
);

/**
 * POST /api/support/whatsapp/:sessionId/messages
 * Send message in WhatsApp session
 */
router.post(
  '/whatsapp/:sessionId/messages',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Message content is required' });
      return;
    }

    const message = await whatsappSupportService.sendMessage(sessionId, content, 'inbound');

    res.status(201).json({ success: true, data: message });
  })
);

/**
 * GET /api/support/whatsapp/:sessionId/messages
 * Get session messages
 */
router.get(
  '/whatsapp/:sessionId/messages',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const { limit, before } = req.query;

    const messages = await whatsappSupportService.getSessionMessages(sessionId, {
      limit: limit ? parseInt(limit as string) : undefined,
      before: before ? new Date(before as string) : undefined,
    });

    res.json({ success: true, data: messages });
  })
);

/**
 * POST /api/support/whatsapp/:sessionId/close
 * Close WhatsApp session
 */
router.post(
  '/whatsapp/:sessionId/close',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const session = await whatsappSupportService.closeSession(sessionId);

    res.json({ success: true, data: session });
  })
);

/**
 * GET /api/support/whatsapp/analytics
 * Get WhatsApp analytics
 */
router.get(
  '/whatsapp/analytics',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const analytics = await whatsappSupportService.getSessionAnalytics(companyId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: analytics });
  })
);

/**
 * GET /api/support/whatsapp/templates
 * Get WhatsApp template messages
 */
router.get(
  '/whatsapp/templates',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const templates = await whatsappSupportService.getTemplateMessages();

    res.json({ success: true, data: templates });
  })
);

export default router;
