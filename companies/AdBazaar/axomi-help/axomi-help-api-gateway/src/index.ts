/**
 * ADBAZAR Help Desk API Gateway
 * Port: 4972
 *
 * Routes to:
 * - Brand Registry (4973)
 * - Escalation Service (4974)
 * - Knowledge Base (4975)
 * - QR Verification
 * - ReZ Care Integration
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4972', 10);

// ============================================
// IN-MEMORY STORES (Gateway-level aggregation)
// ============================================

const tickets = new Map<string, any>();
const brands = new Map<string, any>();
const escalations = new Map<string, any>();
const articles = new Map<string, any>();

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;

  const start = Date.now();
  res.on('finish', () => {
    logger.info(`[${requestId}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });

  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'help-desk-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    upstream: {
      'brand-registry': 'http://localhost:4973',
      'escalation': 'http://localhost:4974',
      'knowledge-base': 'http://localhost:4975',
    },
  });
});

// ============================================
// TICKETS (Core Help Desk)
// ============================================

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  brandId?: string;
  customerId: string;
  assignedTo?: string;
  tags: string[];
  attachments: string[];
  comments: TicketComment[];
  history: TicketHistory[];
  sla: {
    firstResponse?: Date;
    resolution?: Date;
    breached: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface TicketComment {
  id: string;
  authorId: string;
  authorType: 'customer' | 'agent' | 'system';
  content: string;
  attachments?: string[];
  createdAt: Date;
}

interface TicketHistory {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  actorId: string;
  createdAt: Date;
}

/**
 * POST /tickets
 * Create new ticket
 */
app.post('/tickets', (req: Request, res: Response) => {
  try {
    const { subject, description, priority, category, brandId, customerId, tags } = req.body;

    if (!subject || !description || !customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'subject, description, and customerId are required' } });
      return;
    }

    const ticket: Ticket = {
      id: uuidv4(),
      ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
      subject,
      description,
      status: 'open',
      priority: priority || 'normal',
      category: category || 'general',
      brandId,
      customerId,
      tags: tags || [],
      attachments: [],
      comments: [],
      history: [],
      sla: { breached: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add creation to history
    ticket.history.push({
      id: uuidv4(),
      action: 'created',
      newValue: 'open',
      actorId: customerId,
      createdAt: new Date(),
    });

    tickets.set(ticket.id, ticket);

    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error('Create ticket error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create ticket' } });
  }
});

/**
 * GET /tickets
 * List tickets
 */
app.get('/tickets', (req: Request, res: Response) => {
  const { status, priority, category, brandId, customerId, assignedTo, limit = 50 } = req.query;

  let list = Array.from(tickets.values());

  if (status) list = list.filter(t => t.status === status);
  if (priority) list = list.filter(t => t.priority === priority);
  if (category) list = list.filter(t => t.category === category);
  if (brandId) list = list.filter(t => t.brandId === brandId);
  if (customerId) list = list.filter(t => t.customerId === customerId);
  if (assignedTo) list = list.filter(t => t.assignedTo === assignedTo);

  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  list = list.slice(0, Number(limit));

  res.json({ success: true, data: { tickets: list, total: tickets.size } });
});

/**
 * GET /tickets/:id
 * Get ticket by ID
 */
app.get('/tickets/:id', (req: Request, res: Response) => {
  const ticket = tickets.get(req.params.id);

  if (!ticket) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return;
  }

  res.json({ success: true, data: ticket });
});

/**
 * PATCH /tickets/:id
 * Update ticket
 */
app.patch('/tickets/:id', (req: Request, res: Response) => {
  const ticket = tickets.get(req.params.id);

  if (!ticket) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return;
  }

  const { subject, description, status, priority, category, assignedTo, tags } = req.body;
  const actorId = req.headers['x-user-id'] as string || 'system';

  // Track changes
  if (status && status !== ticket.status) {
    ticket.history.push({
      id: uuidv4(),
      action: 'status_changed',
      field: 'status',
      oldValue: ticket.status,
      newValue: status,
      actorId,
      createdAt: new Date(),
    });
    ticket.status = status;

    if (status === 'resolved') {
      ticket.sla.resolution = new Date();
    }
  }

  if (subject !== undefined) ticket.subject = subject;
  if (description !== undefined) ticket.description = description;
  if (priority !== undefined) ticket.priority = priority;
  if (category !== undefined) ticket.category = category;
  if (assignedTo !== undefined) {
    ticket.history.push({
      id: uuidv4(),
      action: 'assigned',
      field: 'assignedTo',
      oldValue: ticket.assignedTo,
      newValue: assignedTo,
      actorId,
      createdAt: new Date(),
    });
    ticket.assignedTo = assignedTo;
  }
  if (tags !== undefined) ticket.tags = tags;
  ticket.updatedAt = new Date();

  res.json({ success: true, data: ticket });
});

/**
 * POST /tickets/:id/comments
 * Add comment to ticket
 */
app.post('/tickets/:id/comments', (req: Request, res: Response) => {
  const ticket = tickets.get(req.params.id);

  if (!ticket) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return;
  }

  const { content, authorId, authorType, attachments } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } });
    return;
  }

  const comment: TicketComment = {
    id: uuidv4(),
    authorId: authorId || req.headers['x-user-id'] as string || 'system',
    authorType: authorType || 'agent',
    content,
    attachments: attachments || [],
    createdAt: new Date(),
  };

  ticket.comments.push(comment);
  ticket.updatedAt = new Date();

  res.json({ success: true, data: comment });
});

/**
 * POST /tickets/:id/escalate
 * Escalate ticket
 */
app.post('/tickets/:id/escalate', (req: Request, res: Response) => {
  const ticket = tickets.get(req.params.id);

  if (!ticket) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return;
  }

  const { reason, level, targetTeam } = req.body;

  const escalation = {
    id: uuidv4(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    reason: reason || 'Manual escalation',
    level: level || 1,
    targetTeam,
    status: 'pending',
    escalatedBy: req.headers['x-user-id'] as string || 'system',
    escalatedAt: new Date(),
  };

  escalations.set(escalation.id, escalation);

  ticket.history.push({
    id: uuidv4(),
    action: 'escalated',
    newValue: `Level ${level}`,
    actorId: req.headers['x-user-id'] as string || 'system',
    createdAt: new Date(),
  });
  ticket.updatedAt = new Date();

  res.json({ success: true, data: escalation });
});

/**
 * POST /tickets/:id/assign
 * Assign ticket to agent
 */
app.post('/tickets/:id/assign', (req: Request, res: Response) => {
  const ticket = tickets.get(req.params.id);

  if (!ticket) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return;
  }

  const { agentId } = req.body;

  if (!agentId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'agentId is required' } });
    return;
  }

  ticket.assignedTo = agentId;
  ticket.status = 'in_progress';
  ticket.history.push({
    id: uuidv4(),
    action: 'assigned',
    field: 'assignedTo',
    oldValue: ticket.assignedTo,
    newValue: agentId,
    actorId: req.headers['x-user-id'] as string || 'system',
    createdAt: new Date(),
  });
  ticket.updatedAt = new Date();

  res.json({ success: true, data: ticket });
});

// ============================================
// QR VERIFICATION
// ============================================

/**
 * POST /verify/qr
 * Verify QR code
 */
app.post('/verify/qr', (req: Request, res: Response) => {
  const { qrCode, brandId } = req.body;

  if (!qrCode) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'qrCode is required' } });
    return;
  }

  // Mock verification result
  const brand = brands.get(brandId);
  const verificationResult = {
    valid: true,
    qrCode,
    brandId: brand?.id,
    brandName: brand?.name || 'Unknown Brand',
    productId: qrCode.substring(0, 8),
    verifiedAt: new Date().toISOString(),
    message: 'Product verified as authentic',
  };

  res.json({ success: true, data: verificationResult });
});

/**
 * GET /verify/qr/:code
 * Get QR code details
 */
app.get('/verify/qr/:code', (req: Request, res: Response) => {
  const { code } = req.params;

  res.json({
    success: true,
    data: {
      qrCode: code,
      productId: code.substring(0, 8),
      brandId: 'default',
      verifiedAt: new Date().toISOString(),
    },
  });
});

// ============================================
// BRAND ROUTES (Proxy)
// ============================================

/**
 * GET /brands
 * List brands
 */
app.get('/brands', (req: Request, res: Response) => {
  const list = Array.from(brands.values());
  res.json({ success: true, data: { brands: list, total: list.length } });
});

/**
 * POST /brands
 * Create brand
 */
app.post('/brands', (req: Request, res: Response) => {
  const { name, description, logo, website, supportEmail, supportPhone } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    return;
  }

  const brand = {
    id: uuidv4(),
    name,
    description: description || '',
    logo: logo || '',
    website: website || '',
    supportEmail: supportEmail || '',
    supportPhone: supportPhone || '',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  brands.set(brand.id, brand);

  res.json({ success: true, data: brand });
});

/**
 * GET /brands/:id
 * Get brand by ID
 */
app.get('/brands/:id', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  res.json({ success: true, data: brand });
});

// ============================================
// KNOWLEDGE BASE ROUTES (Proxy)
// ============================================

/**
 * GET /knowledge/articles
 * List knowledge articles
 */
app.get('/knowledge/articles', (req: Request, res: Response) => {
  const { category, status } = req.query;

  let list = Array.from(articles.values());

  if (category) list = list.filter(a => a.category === category);
  if (status) list = list.filter(a => a.status === status);

  res.json({ success: true, data: { articles: list, total: list.length } });
});

/**
 * POST /knowledge/articles
 * Create knowledge article
 */
app.post('/knowledge/articles', (req: Request, res: Response) => {
  const { title, content, category, tags, authorId } = req.body;

  if (!title || !content) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title and content are required' } });
    return;
  }

  const article = {
    id: uuidv4(),
    title,
    content,
    category: category || 'general',
    tags: tags || [],
    authorId: authorId || req.headers['x-user-id'] as string || 'system',
    status: 'draft',
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
  };

  articles.set(article.id, article);

  res.json({ success: true, data: article });
});

/**
 * GET /knowledge/articles/:id
 * Get article by ID
 */
app.get('/knowledge/articles/:id', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  article.views++;
  res.json({ success: true, data: article });
});

/**
 * GET /knowledge/search
 * Search knowledge base
 */
app.get('/knowledge/search', (req: Request, res: Response) => {
  const { q, category } = req.query;

  if (!q) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'q (query) is required' } });
    return;
  }

  const query = (q as string).toLowerCase();
  let results = Array.from(articles.values()).filter(a =>
    a.title.toLowerCase().includes(query) ||
    a.content.toLowerCase().includes(query) ||
    a.tags.some((t: string) => t.toLowerCase().includes(query))
  );

  if (category) results = results.filter(a => a.category === category);

  res.json({ success: true, data: { articles: results, total: results.length, query: q } });
});

// ============================================
// ESCALATION ROUTES (Proxy)
// ============================================

/**
 * GET /escalations
 * List escalations
 */
app.get('/escalations', (req: Request, res: Response) => {
  const { status, level, ticketId } = req.query;

  let list = Array.from(escalations.values());

  if (status) list = list.filter(e => e.status === status);
  if (level) list = list.filter(e => e.level === level);
  if (ticketId) list = list.filter(e => e.ticketId === ticketId);

  res.json({ success: true, data: { escalations: list, total: list.length } });
});

/**
 * POST /escalations
 * Create escalation
 */
app.post('/escalations', (req: Request, res: Response) => {
  const { ticketId, reason, level, targetTeam } = req.body;

  if (!ticketId || !reason) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ticketId and reason are required' } });
    return;
  }

  const escalation = {
    id: uuidv4(),
    ticketId,
    reason,
    level: level || 1,
    targetTeam: targetTeam || 'support',
    status: 'pending',
    escalatedBy: req.headers['x-user-id'] as string || 'system',
    escalatedAt: new Date(),
    resolvedAt: null,
  };

  escalations.set(escalation.id, escalation);

  res.json({ success: true, data: escalation });
});

/**
 * POST /escalations/:id/resolve
 * Resolve escalation
 */
app.post('/escalations/:id/resolve', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  escalation.status = 'resolved';
  escalation.resolvedAt = new Date();
  escalation.resolvedBy = req.headers['x-user-id'] as string || 'system';

  res.json({ success: true, data: escalation });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get help desk statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayTickets = Array.from(tickets.values()).filter(t => t.createdAt >= today);

  res.json({
    success: true,
    data: {
      tickets: {
        total: tickets.size,
        open: Array.from(tickets.values()).filter(t => t.status === 'open').length,
        inProgress: Array.from(tickets.values()).filter(t => t.status === 'in_progress').length,
        resolved: Array.from(tickets.values()).filter(t => t.status === 'resolved').length,
        closed: Array.from(tickets.values()).filter(t => t.status === 'closed').length,
        today: todayTickets.length,
      },
      brands: {
        total: brands.size,
      },
      escalations: {
        total: escalations.size,
        pending: Array.from(escalations.values()).filter(e => e.status === 'pending').length,
        resolved: Array.from(escalations.values()).filter(e => e.status === 'resolved').length,
      },
      knowledgeBase: {
        articles: articles.size,
        totalViews: Array.from(articles.values()).reduce((sum, a) => sum + (a.views || 0), 0),
      },
    },
  });
});

/**
 * GET /stats/tickets/by-status
 * Tickets by status
 */
app.get('/stats/tickets/by-status', (req: Request, res: Response) => {
  const byStatus: Record<string, number> = {};

  for (const ticket of tickets.values()) {
    byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
  }

  res.json({ success: true, data: byStatus });
});

/**
 * GET /stats/tickets/by-priority
 * Tickets by priority
 */
app.get('/stats/tickets/by-priority', (req: Request, res: Response) => {
  const byPriority: Record<string, number> = {};

  for (const ticket of tickets.values()) {
    byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
  }

  res.json({ success: true, data: byPriority });
});

/**
 * GET /stats/tickets/by-category
 * Tickets by category
 */
app.get('/stats/tickets/by-category', (req: Request, res: Response) => {
  const byCategory: Record<string, number> = {};

  for (const ticket of tickets.values()) {
    byCategory[ticket.category] = (byCategory[ticket.category] || 0) + 1;
  }

  res.json({ success: true, data: byCategory });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                   ADBAZAR Help Desk API Gateway                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Routes to:                                                  ║
║  • Brand Registry (port 4973)                                ║
║  • Escalation Service (port 4974)                           ║
║  • Knowledge Base (port 4975)                                ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  POST /tickets           - Create ticket                     ║
║  GET  /tickets           - List tickets                      ║
║  POST /verify/qr         - Verify QR code                    ║
║  GET  /brands            - List brands                       ║
║  GET  /knowledge/articles - List KB articles                 ║
║  GET  /escalations       - List escalations                  ║
║  GET  /stats             - Statistics                        ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;