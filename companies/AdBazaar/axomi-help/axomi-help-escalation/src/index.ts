/**
 * ADBAZAR Escalation Service
 * Port: 4974
 *
 * Features:
 * - Multi-level ticket escalation
 * - Escalation rules engine
 * - SLA monitoring
 * - Auto-escalation
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Escalation {
  id: string;
  ticketId: string;
  ticketNumber: string;
  reason: string;
  level: number;
  targetTeam: string;
  targetAgent?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  previousLevel?: number;
  escalatedBy: string;
  escalatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  history: EscalationHistory[];
}

interface EscalationHistory {
  id: string;
  action: string;
  actorId: string;
  details?: string;
  createdAt: Date;
}

interface EscalationRule {
  id: string;
  name: string;
  description: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EscalationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

interface EscalationAction {
  type: 'assign' | 'notify' | 'escalate' | 'sla_breach';
  target?: string;
  template?: string;
  delay?: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  level: number;
  members: string[];
  manager?: string;
  email?: string;
  maxTickets: number;
  avgResponseTime: number;
  isActive: boolean;
  createdAt: Date;
}

interface SLAPolicy {
  id: string;
  name: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  firstResponseTime: number; // minutes
  resolutionTime: number; // minutes
  businessHours: boolean;
  isActive: boolean;
}

const app = express();
const PORT = parseInt(process.env.PORT || '4974', 10);

// In-memory stores
const escalations = new Map<string, Escalation>();
const escalationRules = new Map<string, EscalationRule>();
const teams = new Map<string, Team>();
const slaPolicies = new Map<string, SLAPolicy>();

// Initialize default teams
const defaultTeams: Team[] = [
  {
    id: 'tier1',
    name: 'Tier 1 Support',
    description: 'First line support',
    level: 1,
    members: [],
    maxTickets: 50,
    avgResponseTime: 30,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'tier2',
    name: 'Tier 2 Support',
    description: 'Technical support',
    level: 2,
    members: [],
    manager: undefined,
    maxTickets: 30,
    avgResponseTime: 60,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'tier3',
    name: 'Tier 3 Support',
    description: 'Senior technical support',
    level: 3,
    members: [],
    maxTickets: 15,
    avgResponseTime: 120,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'management',
    name: 'Management',
    description: 'Management escalation',
    level: 4,
    members: [],
    maxTickets: 10,
    avgResponseTime: 15,
    isActive: true,
    createdAt: new Date(),
  },
];

defaultTeams.forEach(team => teams.set(team.id, team));

// Initialize default SLA policies
const defaultSLAs: SLAPolicy[] = [
  { id: 'sla-low', name: 'Low Priority SLA', priority: 'low', firstResponseTime: 480, resolutionTime: 2880, businessHours: true, isActive: true },
  { id: 'sla-normal', name: 'Normal Priority SLA', priority: 'normal', firstResponseTime: 240, resolutionTime: 1440, businessHours: true, isActive: true },
  { id: 'sla-high', name: 'High Priority SLA', priority: 'high', firstResponseTime: 60, resolutionTime: 480, businessHours: false, isActive: true },
  { id: 'sla-urgent', name: 'Urgent Priority SLA', priority: 'urgent', firstResponseTime: 15, resolutionTime: 120, businessHours: false, isActive: true },
];

defaultSLAs.forEach(sla => slaPolicies.set(sla.id, sla));

// Initialize default escalation rules
const defaultRules: EscalationRule[] = [
  {
    id: 'rule-sla-breach',
    name: 'SLA Breach Escalation',
    description: 'Auto-escalate when SLA is about to breach',
    conditions: [{ field: 'slaBreaching', operator: 'equals', value: true }],
    actions: [{ type: 'escalate', target: 'next_level' }],
    isActive: true,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rule-no-response',
    name: 'No Response Escalation',
    description: 'Escalate if no agent assigned within time',
    conditions: [{ field: 'unassignedTime', operator: 'greater_than', value: 60 }],
    actions: [{ type: 'notify', template: 'unassigned_alert' }],
    isActive: true,
    priority: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

defaultRules.forEach(rule => escalationRules.set(rule.id, rule));

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'escalation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ESCALATIONS
// ============================================

/**
 * POST /escalations
 * Create escalation
 */
app.post('/escalations', (req: Request, res: Response) => {
  try {
    const { ticketId, ticketNumber, reason, level, targetTeam, targetAgent, priority } = req.body;

    if (!ticketId || !reason) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ticketId and reason are required' } });
      return;
    }

    // Check for existing escalation on same ticket
    const existingEscalation = Array.from(escalations.values()).find(
      e => e.ticketId === ticketId && (e.status === 'pending' || e.status === 'in_progress')
    );

    if (existingEscalation) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_ESCALATED', message: 'Ticket already has an active escalation' },
      });
      return;
    }

    const escalation: Escalation = {
      id: uuidv4(),
      ticketId,
      ticketNumber: ticketNumber || `ESC-${Date.now().toString(36).toUpperCase()}`,
      reason,
      level: level || 1,
      targetTeam: targetTeam || 'tier1',
      targetAgent,
      status: 'pending',
      priority: priority || 'normal',
      escalatedBy: req.headers['x-user-id'] as string || 'system',
      escalatedAt: new Date(),
      history: [
        {
          id: uuidv4(),
          action: 'escalation_created',
          actorId: req.headers['x-user-id'] as string || 'system',
          details: `Escalated to ${targetTeam || 'tier1'}`,
          createdAt: new Date(),
        },
      ],
    };

    escalations.set(escalation.id, escalation);

    res.json({ success: true, data: escalation });
  } catch (error) {
    logger.error('Create escalation error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create escalation' } });
  }
});

/**
 * GET /escalations
 * List escalations
 */
app.get('/escalations', (req: Request, res: Response) => {
  const { status, level, ticketId, priority, team } = req.query;

  let list = Array.from(escalations.values());

  if (status) list = list.filter(e => e.status === status);
  if (level) list = list.filter(e => e.level === Number(level));
  if (ticketId) list = list.filter(e => e.ticketId === ticketId);
  if (priority) list = list.filter(e => e.priority === priority);
  if (team) list = list.filter(e => e.targetTeam === team);

  list.sort((a, b) => b.escalatedAt.getTime() - a.escalatedAt.getTime());

  res.json({ success: true, data: { escalations: list, total: list.length } });
});

/**
 * GET /escalations/:id
 * Get escalation by ID
 */
app.get('/escalations/:id', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  res.json({ success: true, data: escalation });
});

/**
 * PATCH /escalations/:id
 * Update escalation
 */
app.patch('/escalations/:id', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  const { status, targetTeam, targetAgent, resolution } = req.body;
  const actorId = req.headers['x-user-id'] as string || 'system';

  if (status) {
    escalation.history.push({
      id: uuidv4(),
      action: `status_changed_to_${status}`,
      actorId,
      details: `Status changed to ${status}`,
      createdAt: new Date(),
    });
    escalation.status = status;

    if (status === 'resolved') {
      escalation.resolvedAt = new Date();
      escalation.resolvedBy = actorId;
      escalation.resolution = resolution;
    }
  }

  if (targetTeam) escalation.targetTeam = targetTeam;
  if (targetAgent !== undefined) escalation.targetAgent = targetAgent;

  res.json({ success: true, data: escalation });
});

/**
 * POST /escalations/:id/acknowledge
 * Acknowledge escalation
 */
app.post('/escalations/:id/acknowledge', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  const actorId = req.headers['x-user-id'] as string || 'system';

  escalation.status = 'in_progress';
  escalation.acknowledgedAt = new Date();
  escalation.history.push({
    id: uuidv4(),
    action: 'acknowledged',
    actorId,
    createdAt: new Date(),
  });

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

  const { resolution } = req.body;
  const actorId = req.headers['x-user-id'] as string || 'system';

  escalation.status = 'resolved';
  escalation.resolvedAt = new Date();
  escalation.resolvedBy = actorId;
  escalation.resolution = resolution || 'Resolved';
  escalation.history.push({
    id: uuidv4(),
    action: 'resolved',
    actorId,
    details: resolution,
    createdAt: new Date(),
  });

  res.json({ success: true, data: escalation });
});

/**
 * POST /escalations/:id/cancel
 * Cancel escalation
 */
app.post('/escalations/:id/cancel', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  const { reason } = req.body;
  const actorId = req.headers['x-user-id'] as string || 'system';

  escalation.status = 'cancelled';
  escalation.history.push({
    id: uuidv4(),
    action: 'cancelled',
    actorId,
    details: reason,
    createdAt: new Date(),
  });

  res.json({ success: true, data: escalation });
});

/**
 * POST /escalations/:id/reassign
 * Reassign escalation to different team/agent
 */
app.post('/escalations/:id/reassign', (req: Request, res: Response) => {
  const escalation = escalations.get(req.params.id);

  if (!escalation) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    return;
  }

  const { targetTeam, targetAgent, reason } = req.body;
  const actorId = req.headers['x-user-id'] as string || 'system';

  const previousTeam = escalation.targetTeam;
  const previousAgent = escalation.targetAgent;

  escalation.targetTeam = targetTeam || escalation.targetTeam;
  escalation.targetAgent = targetAgent;
  escalation.history.push({
    id: uuidv4(),
    action: 'reassigned',
    actorId,
    details: `Reassigned from ${previousTeam}${previousAgent ? `/${previousAgent}` : ''} to ${escalation.targetTeam}${targetAgent ? `/${targetAgent}` : ''}. Reason: ${reason || 'No reason provided'}`,
    createdAt: new Date(),
  });

  res.json({ success: true, data: escalation });
});

// ============================================
// TEAMS
// ============================================

/**
 * POST /teams
 * Create team
 */
app.post('/teams', (req: Request, res: Response) => {
  const { name, description, level, members, manager, maxTickets } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    return;
  }

  const team: Team = {
    id: uuidv4(),
    name,
    description: description || '',
    level: level || teams.size + 1,
    members: members || [],
    manager,
    maxTickets: maxTickets || 30,
    avgResponseTime: 60,
    isActive: true,
    createdAt: new Date(),
  };

  teams.set(team.id, team);

  res.json({ success: true, data: team });
});

/**
 * GET /teams
 * List teams
 */
app.get('/teams', (req: Request, res: Response) => {
  const { level, isActive } = req.query;

  let list = Array.from(teams.values());

  if (level) list = list.filter(t => t.level === Number(level));
  if (isActive !== undefined) list = list.filter(t => t.isActive === (isActive === 'true'));

  list.sort((a, b) => a.level - b.level);

  res.json({ success: true, data: { teams: list, total: list.length } });
});

/**
 * GET /teams/:id
 * Get team by ID
 */
app.get('/teams/:id', (req: Request, res: Response) => {
  const team = teams.get(req.params.id);

  if (!team) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
    return;
  }

  res.json({ success: true, data: team });
});

/**
 * PATCH /teams/:id
 * Update team
 */
app.patch('/teams/:id', (req: Request, res: Response) => {
  const team = teams.get(req.params.id);

  if (!team) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
    return;
  }

  const { name, description, members, manager, maxTickets, isActive } = req.body;

  if (name !== undefined) team.name = name;
  if (description !== undefined) team.description = description;
  if (members !== undefined) team.members = members;
  if (manager !== undefined) team.manager = manager;
  if (maxTickets !== undefined) team.maxTickets = maxTickets;
  if (isActive !== undefined) team.isActive = isActive;

  res.json({ success: true, data: team });
});

/**
 * POST /teams/:id/members
 * Add member to team
 */
app.post('/teams/:id/members', (req: Request, res: Response) => {
  const team = teams.get(req.params.id);

  if (!team) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
    return;
  }

  const { userId, role } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } });
    return;
  }

  if (!team.members.includes(userId)) {
    team.members.push(userId);
  }

  res.json({ success: true, data: team });
});

/**
 * DELETE /teams/:id/members/:userId
 * Remove member from team
 */
app.delete('/teams/:id/members/:userId', (req: Request, res: Response) => {
  const team = teams.get(req.params.id);

  if (!team) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
    return;
  }

  team.members = team.members.filter(m => m !== req.params.userId);

  res.json({ success: true, data: team });
});

// ============================================
// ESCALATION RULES
// ============================================

/**
 * POST /rules
 * Create escalation rule
 */
app.post('/rules', (req: Request, res: Response) => {
  const { name, description, conditions, actions, priority } = req.body;

  if (!name || !conditions || !actions) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name, conditions, and actions are required' } });
    return;
  }

  const rule: EscalationRule = {
    id: uuidv4(),
    name,
    description: description || '',
    conditions,
    actions,
    isActive: true,
    priority: priority || 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  escalationRules.set(rule.id, rule);

  res.json({ success: true, data: rule });
});

/**
 * GET /rules
 * List escalation rules
 */
app.get('/rules', (req: Request, res: Response) => {
  const { isActive } = req.query;

  let list = Array.from(escalationRules.values());

  if (isActive !== undefined) list = list.filter(r => r.isActive === (isActive === 'true'));

  list.sort((a, b) => a.priority - b.priority);

  res.json({ success: true, data: { rules: list, total: list.length } });
});

/**
 * PATCH /rules/:id
 * Update rule
 */
app.patch('/rules/:id', (req: Request, res: Response) => {
  const rule = escalationRules.get(req.params.id);

  if (!rule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule not found' } });
    return;
  }

  const { name, description, conditions, actions, isActive, priority } = req.body;

  if (name !== undefined) rule.name = name;
  if (description !== undefined) rule.description = description;
  if (conditions !== undefined) rule.conditions = conditions;
  if (actions !== undefined) rule.actions = actions;
  if (isActive !== undefined) rule.isActive = isActive;
  if (priority !== undefined) rule.priority = priority;
  rule.updatedAt = new Date();

  res.json({ success: true, data: rule });
});

/**
 * POST /rules/:id/enable
 * Enable rule
 */
app.post('/rules/:id/enable', (req: Request, res: Response) => {
  const rule = escalationRules.get(req.params.id);

  if (!rule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule not found' } });
    return;
  }

  rule.isActive = true;
  rule.updatedAt = new Date();

  res.json({ success: true, data: rule });
});

/**
 * POST /rules/:id/disable
 * Disable rule
 */
app.post('/rules/:id/disable', (req: Request, res: Response) => {
  const rule = escalationRules.get(req.params.id);

  if (!rule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule not found' } });
    return;
  }

  rule.isActive = false;
  rule.updatedAt = new Date();

  res.json({ success: true, data: rule });
});

/**
 * POST /evaluate
 * Evaluate ticket for escalation
 */
app.post('/evaluate', (req: Request, res: Response) => {
  const { ticketId, ticket } = req.body;

  if (!ticket) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ticket data is required' } });
    return;
  }

  const applicableRules: EscalationRule[] = [];

  for (const rule of escalationRules.values()) {
    if (!rule.isActive) continue;

    let matches = true;
    for (const condition of rule.conditions) {
      const value = (ticket as any)[condition.field];
      if (condition.operator === 'equals' && value !== condition.value) matches = false;
      if (condition.operator === 'not_equals' && value === condition.value) matches = false;
      if (condition.operator === 'greater_than' && value <= condition.value) matches = false;
      if (condition.operator === 'less_than' && value >= condition.value) matches = false;
      if (condition.operator === 'contains' && !String(value).includes(condition.value)) matches = false;
    }

    if (matches) {
      applicableRules.push(rule);
    }
  }

  res.json({
    success: true,
    data: {
      ticketId,
      shouldEscalate: applicableRules.length > 0,
      applicableRules: applicableRules.map(r => ({ id: r.id, name: r.name, actions: r.actions })),
    },
  });
});

// ============================================
// SLA POLICIES
// ============================================

/**
 * GET /sla
 * List SLA policies
 */
app.get('/sla', (req: Request, res: Response) => {
  const list = Array.from(slaPolicies.values());
  res.json({ success: true, data: { policies: list, total: list.length } });
});

/**
 * POST /sla
 * Create SLA policy
 */
app.post('/sla', (req: Request, res: Response) => {
  const { name, priority, firstResponseTime, resolutionTime, businessHours } = req.body;

  if (!name || !priority) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and priority are required' } });
    return;
  }

  const policy: SLAPolicy = {
    id: uuidv4(),
    name,
    priority,
    firstResponseTime: firstResponseTime || 240,
    resolutionTime: resolutionTime || 1440,
    businessHours: businessHours ?? true,
    isActive: true,
  };

  slaPolicies.set(policy.id, policy);

  res.json({ success: true, data: policy });
});

/**
 * POST /sla/check
 * Check SLA status for ticket
 */
app.post('/sla/check', (req: Request, res: Response) => {
  const { priority, createdAt, firstResponseAt } = req.body;

  const policy = Array.from(slaPolicies.values()).find(p => p.priority === priority);

  if (!policy) {
    res.json({
      success: true,
      data: {
        hasPolicy: false,
        message: 'No SLA policy found for this priority',
      },
    });
    return;
  }

  const now = new Date();
  const created = new Date(createdAt);
  const firstResponse = firstResponseAt ? new Date(firstResponseAt) : null;

  const timeSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  const firstResponseTimeElapsed = firstResponse
    ? Math.floor((now.getTime() - firstResponse.getTime()) / (1000 * 60))
    : timeSinceCreated;

  const firstResponseBreaching = !firstResponse && timeSinceCreated > policy.firstResponseTime;
  const resolutionBreaching = firstResponseTimeElapsed > policy.resolutionTime;

  res.json({
    success: true,
    data: {
      hasPolicy: true,
      policy: { name: policy.name, priority: policy.priority },
      firstResponse: {
        limit: policy.firstResponseTime,
        elapsed: firstResponseTimeElapsed,
        breaching: firstResponseBreaching,
        met: !!firstResponse,
      },
      resolution: {
        limit: policy.resolutionTime,
        elapsed: firstResponseTimeElapsed,
        breaching: resolutionBreaching,
      },
    },
  });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get escalation statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayEscalations = Array.from(escalations.values()).filter(e => e.escalatedAt >= today);

  res.json({
    success: true,
    data: {
      escalations: {
        total: escalations.size,
        pending: Array.from(escalations.values()).filter(e => e.status === 'pending').length,
        inProgress: Array.from(escalations.values()).filter(e => e.status === 'in_progress').length,
        resolved: Array.from(escalations.values()).filter(e => e.status === 'resolved').length,
        cancelled: Array.from(escalations.values()).filter(e => e.status === 'cancelled').length,
        today: todayEscalations.length,
      },
      teams: {
        total: teams.size,
        active: Array.from(teams.values()).filter(t => t.isActive).length,
      },
      rules: {
        total: escalationRules.size,
        active: Array.from(escalationRules.values()).filter(r => r.isActive).length,
      },
      sla: {
        policies: slaPolicies.size,
      },
      byLevel: {
        l1: Array.from(escalations.values()).filter(e => e.level === 1).length,
        l2: Array.from(escalations.values()).filter(e => e.level === 2).length,
        l3: Array.from(escalations.values()).filter(e => e.level === 3).length,
        l4: Array.from(escalations.values()).filter(e => e.level >= 4).length,
      },
    },
  });
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

// Startup
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                    ADBAZAR Escalation Service               ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  POST /escalations        - Create escalation                ║
║  GET  /escalations        - List escalations                 ║
║  POST /escalations/:id/acknowledge - Acknowledge             ║
║  POST /escalations/:id/resolve - Resolve                    ║
║  GET  /teams              - List teams                      ║
║  GET  /rules              - List escalation rules           ║
║  POST /evaluate           - Evaluate ticket for escalation  ║
║  GET  /sla                - List SLA policies               ║
║  GET  /stats              - Statistics                      ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;