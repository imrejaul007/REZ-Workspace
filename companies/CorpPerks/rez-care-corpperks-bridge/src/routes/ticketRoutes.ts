import { Router, Response } from 'express';
import { employeeSupportService, ticketWorkflowService } from '../services/index.js';
import { asyncHandler, validateRequest } from '../middleware/errorHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { createTicketSchema, updateTicketSchema, addCommentSchema } from '../types/index.js';

const router = Router();

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post(
  '/tickets',
  authenticate,
  validateRequest(createTicketSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await employeeSupportService.createTicket(req.body);

    // Route and auto-assign
    await ticketWorkflowService.routeTicket(ticket.ticketId);
    await ticketWorkflowService.autoAssignTicket(ticket.ticketId);

    res.status(201).json({ success: true, data: ticket });
  })
);

/**
 * GET /api/support/tickets
 * Get tickets with filters
 */
router.get(
  '/tickets',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, employeeId, status, category, priority, assignedTo, page, limit } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const result = await employeeSupportService.getTickets({
      companyId: companyId as string,
      employeeId: employeeId as string,
      status: status as string,
      category: category as string,
      priority: priority as string,
      assignedTo: assignedTo as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.tickets,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/support/tickets/:id
 * Get ticket by ID
 */
router.get(
  '/tickets/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await employeeSupportService.getTicket(req.params.id);

    res.json({ success: true, data: ticket });
  })
);

/**
 * PATCH /api/support/tickets/:id
 * Update ticket
 */
router.patch(
  '/tickets/:id',
  authenticate,
  validateRequest(updateTicketSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await employeeSupportService.updateTicket(req.params.id, req.body);

    // Check for escalations
    await ticketWorkflowService.processEscalations(req.params.id);

    res.json({ success: true, data: ticket });
  })
);

/**
 * POST /api/support/tickets/:id/comments
 * Add comment to ticket
 */
router.post(
  '/tickets/:id/comments',
  authenticate,
  validateRequest(addCommentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await employeeSupportService.addComment(req.params.id, req.body);

    res.json({ success: true, data: ticket });
  })
);

/**
 * GET /api/support/tickets/employee/:id
 * Get employee tickets
 */
router.get(
  '/tickets/employee/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const result = await employeeSupportService.getEmployeeTickets(
      req.params.id,
      companyId,
      { page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined }
    );

    res.json({ success: true, data: result.tickets });
  })
);

/**
 * POST /api/support/tickets/:id/rate
 * Rate ticket satisfaction
 */
router.post(
  '/tickets/:id/rate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      return;
    }

    const ticket = await employeeSupportService.rateTicket(req.params.id, rating);

    res.json({ success: true, data: ticket });
  })
);

/**
 * GET /api/support/tickets/:id/sla
 * Get SLA status
 */
router.get(
  '/tickets/:id/sla',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const slaStatus = await employeeSupportService.getSLAStatus(req.params.id);

    res.json({ success: true, data: slaStatus });
  })
);

export default router;
