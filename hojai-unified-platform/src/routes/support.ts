import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  AuthenticatedRequest,
  requireAuth,
  requireRole,
  successResponse
} from '../middleware/auth.js';
import { handleError } from '../utils/errors.js';

// ============================================================================
// TYPES
// ============================================================================

interface SupportTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  assignedAgentId?: string;
  assignedAgentName?: string;
  team?: string;

  conversationId?: string;

  messages: TicketMessage[];

  resolution?: string;
  resolvedAt?: Date;

  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

interface TicketMessage {
  id: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  senderName: string;
  content: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  createdAt: Date;
}

type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
type TicketCategory =
  | 'billing'
  | 'technical'
  | 'account'
  | 'shipping'
  | 'returns'
  | 'general'
  | 'feedback'
  | 'sales'
  | 'partnership'
  | 'other';

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const tickets = new Map<string, SupportTicket>();
let ticketCounter = 1000;

function generateTicketNumber(): string {
  ticketCounter++;
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `TKT-${year}${month}-${ticketCounter}`;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateTicketSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['billing', 'technical', 'account', 'shipping', 'returns', 'general', 'feedback', 'sales', 'partnership', 'other']),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).default('normal'),
  conversationId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'pending', 'in_progress', 'resolved', 'closed', 'escalated']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).optional(),
  category: z.enum(['billing', 'technical', 'account', 'shipping', 'returns', 'general', 'feedback', 'sales', 'partnership', 'other']).optional(),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  team: z.string().optional()
});

const AddTicketMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string()
  })).optional()
});

const ResolveTicketSchema = z.object({
  resolution: z.string().min(10).max(2000)
});

// ============================================================================
// ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// TICKET CRUD
// ============================================================================

// Create ticket
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const validated = CreateTicketSchema.parse(req.body);

    const ticket: SupportTicket = {
      id: uuidv4(),
      ticketNumber: generateTicketNumber(),
      tenantId,
      customerId: validated.customerId,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      subject: validated.subject,
      description: validated.description,
      category: validated.category,
      priority: validated.priority,
      status: 'open',
      conversationId: validated.conversationId,
      messages: [{
        id: uuidv4(),
        senderId: validated.customerId,
        senderType: 'customer',
        senderName: validated.customerName,
        content: validated.description,
        createdAt: new Date()
      }],
      metadata: validated.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tickets.set(ticket.id, ticket);

    // Emit event for notifications
    // TODO: Emit to event bus

    successResponse(res, ticket, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// List tickets
router.get('/tickets', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      status,
      priority,
      category,
      assignedAgentId,
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    let filtered = Array.from(tickets.values()).filter(
      t => t.tenantId === authReq.tenant.tenantId
    );

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    if (assignedAgentId) {
      filtered = filtered.filter(t => t.assignedAgentId === assignedAgentId);
    }
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(searchLower) ||
        t.ticketNumber.toLowerCase().includes(searchLower) ||
        t.customerName.toLowerCase().includes(searchLower) ||
        t.customerEmail.toLowerCase().includes(searchLower)
      );
    }

    // Sort by priority and created date
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = filtered.length;
    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    successResponse(res, {
      tickets: paginated,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Get single ticket
router.get('/tickets/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// Get ticket by ticket number
router.get('/tickets/number/:ticketNumber', async (req: Request, res: Response) => {
  try {
    const ticket = Array.from(tickets.values()).find(
      t => t.ticketNumber === req.params.ticketNumber
    );

    if (!ticket) {
      return handleError(res, 'Ticket not found', 404);
    }

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// Update ticket
router.patch('/tickets/:id', requireAuth, requireRole('agent', 'admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    const validated = UpdateTicketSchema.parse(req.body);

    if (validated.status) ticket.status = validated.status;
    if (validated.priority) ticket.priority = validated.priority;
    if (validated.category) ticket.category = validated.category;
    if (validated.assignedAgentId) ticket.assignedAgentId = validated.assignedAgentId;
    if (validated.assignedAgentName) ticket.assignedAgentName = validated.assignedAgentName;
    if (validated.team) ticket.team = validated.team;
    ticket.updatedAt = new Date();

    // Add system message for status change
    if (validated.status && validated.status !== ticket.status) {
      ticket.messages.push({
        id: uuidv4(),
        senderId: 'system',
        senderType: 'system',
        senderName: 'System',
        content: `Ticket status changed to ${validated.status}`,
        createdAt: new Date()
      });
    }

    successResponse(res, ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Assign ticket to agent
router.post('/tickets/:id/assign', requireAuth, requireRole('agent', 'admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    const { agentId, agentName, team } = req.body;
    if (!agentId || !agentName) {
      return handleError(res, 'agentId and agentName are required', 400);
    }

    ticket.assignedAgentId = agentId;
    ticket.assignedAgentName = agentName;
    if (team) ticket.team = team;
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    ticket.updatedAt = new Date();

    // Add system message
    ticket.messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderType: 'system',
      senderName: 'System',
      content: `Ticket assigned to ${agentName}`,
      createdAt: new Date()
    });

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// Escalate ticket
router.post('/tickets/:id/escalate', requireAuth, requireRole('agent', 'admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    const { reason, escalationLevel } = req.body;

    ticket.status = 'escalated';
    ticket.priority = ticket.priority === 'high' ? 'urgent' : ticket.priority === 'urgent' ? 'critical' : 'high';
    ticket.updatedAt = new Date();

    // Add system message
    ticket.messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderType: 'system',
      senderName: 'System',
      content: `Ticket escalated${reason ? `: ${reason}` : ''}`,
      createdAt: new Date()
    });

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// TICKET MESSAGES
// ============================================================================

// Add message to ticket
router.post('/tickets/:id/messages', async (req: Request, res: Response) => {
  try {
    // Support both auth and public access with ticket token
    const authReq = req as AuthenticatedRequest;
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const ticket = tickets.get(req.params.id);
    if (!ticket) {
      return handleError(res, 'Ticket not found', 404);
    }

    const validated = AddTicketMessageSchema.parse(req.body);

    // Determine sender based on auth or public access
    let senderId: string;
    let senderType: 'customer' | 'agent' | 'system';
    let senderName: string;

    if (authReq.tenant && authReq.tenant.role !== 'customer') {
      // Agent or admin responding
      senderId = authReq.tenant.userId || 'agent';
      senderType = 'agent';
      senderName = authReq.tenant.userId || 'Agent';

      // Auto-update ticket status if it was pending
      if (ticket.status === 'pending') {
        ticket.status = 'in_progress';
      }
    } else {
      // Customer response
      senderId = authReq.tenant?.userId || ticket.customerId;
      senderType = 'customer';
      senderName = authReq.tenant?.userId ? 'Customer' : ticket.customerName;

      // Auto-set to pending if customer responds to resolved ticket
      if (ticket.status === 'resolved') {
        ticket.status = 'open';
      }
    }

    const message: TicketMessage = {
      id: uuidv4(),
      senderId,
      senderType,
      senderName,
      content: validated.content,
      attachments: validated.attachments,
      createdAt: new Date()
    };

    ticket.messages.push(message);
    ticket.updatedAt = new Date();

    successResponse(res, message, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Get ticket messages
router.get('/tickets/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    const { limit = '50', offset = '0' } = req.query;

    const messages = ticket.messages.slice(-Number(limit) - Number(offset), ticket.messages.length - Number(offset));
    messages.reverse();

    successResponse(res, {
      messages,
      total: ticket.messages.length
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// TICKET RESOLUTION
// ============================================================================

// Resolve ticket
router.post('/tickets/:id/resolve', requireAuth, requireRole('agent', 'admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    const validated = ResolveTicketSchema.parse(req.body);

    ticket.status = 'resolved';
    ticket.resolution = validated.resolution;
    ticket.resolvedAt = new Date();
    ticket.updatedAt = new Date();

    // Add system message
    ticket.messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderType: 'system',
      senderName: 'System',
      content: 'Ticket resolved',
      createdAt: new Date()
    });

    successResponse(res, ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Reopen ticket
router.post('/tickets/:id/reopen', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket) {
      return handleError(res, 'Ticket not found', 404);
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return handleError(res, 'Ticket can only be reopened if resolved or closed', 400);
    }

    ticket.status = 'open';
    ticket.resolution = undefined;
    ticket.resolvedAt = undefined;
    ticket.updatedAt = new Date();

    // Add system message
    ticket.messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderType: 'system',
      senderName: 'System',
      content: 'Ticket reopened by customer',
      createdAt: new Date()
    });

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// Close ticket
router.post('/tickets/:id/close', requireAuth, requireRole('agent', 'admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ticket = tickets.get(req.params.id);

    if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
      return handleError(res, 'Ticket not found', 404);
    }

    ticket.status = 'closed';
    ticket.updatedAt = new Date();

    // Add system message
    ticket.messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderType: 'system',
      senderName: 'System',
      content: 'Ticket closed',
      createdAt: new Date()
    });

    successResponse(res, ticket);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// TICKET STATISTICS
// ============================================================================

// Get ticket statistics
router.get('/tickets/stats/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantTickets = Array.from(tickets.values()).filter(
      t => t.tenantId === authReq.tenant.tenantId
    );

    const stats = {
      total: tenantTickets.length,
      open: tenantTickets.filter(t => t.status === 'open').length,
      pending: tenantTickets.filter(t => t.status === 'pending').length,
      inProgress: tenantTickets.filter(t => t.status === 'in_progress').length,
      resolved: tenantTickets.filter(t => t.status === 'resolved').length,
      closed: tenantTickets.filter(t => t.status === 'closed').length,
      escalated: tenantTickets.filter(t => t.status === 'escalated').length,

      byPriority: {
        critical: tenantTickets.filter(t => t.priority === 'critical').length,
        urgent: tenantTickets.filter(t => t.priority === 'urgent').length,
        high: tenantTickets.filter(t => t.priority === 'high').length,
        normal: tenantTickets.filter(t => t.priority === 'normal').length,
        low: tenantTickets.filter(t => t.priority === 'low').length
      },

      byCategory: {} as Record<string, number>,

      avgResponseTime: 0, // TODO: Calculate
      avgResolutionTime: 0, // TODO: Calculate
      csat: 0 // TODO: Calculate from surveys
    };

    // Category breakdown
    for (const ticket of tenantTickets) {
      stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;
    }

    // Calculate averages from resolved tickets
    const resolvedTickets = tenantTickets.filter(t => t.resolvedAt);
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
        return sum + (t.resolvedAt!.getTime() - t.createdAt.getTime());
      }, 0);
      stats.avgResolutionTime = totalResolutionTime / resolvedTickets.length / 1000 / 60; // in minutes
    }

    successResponse(res, stats);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk assign tickets
router.post('/tickets/bulk/assign', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ticketIds, agentId, agentName, team } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || !agentId || !agentName) {
      return handleError(res, 'ticketIds, agentId, and agentName are required', 400);
    }

    const results: Array<{ ticketId: string; success: boolean; error?: string }> = [];

    for (const ticketId of ticketIds) {
      const ticket = tickets.get(ticketId);
      if (!ticket || ticket.tenantId !== authReq.tenant.tenantId) {
        results.push({ ticketId, success: false, error: 'Ticket not found' });
        continue;
      }

      ticket.assignedAgentId = agentId;
      ticket.assignedAgentName = agentName;
      if (team) ticket.team = team;
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
      ticket.updatedAt = new Date();

      results.push({ ticketId, success: true });
    }

    successResponse(res, { results });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export default router;
