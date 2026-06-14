/**
 * REE - Operations Center (Port 3000)
 *
 * Central incident management and service health monitoring
 * for the RTNM Digital ecosystem.
 *
 * Features:
 * - Incident lifecycle management (create, track, escalate, resolve)
 * - Service health monitoring and alerting
 * - On-call scheduling and rotations
 * - Runbook management and procedures
 * - Alert correlation and grouping
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4, v4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3000', 10);

// ============================================
// IN-MEMORY DATA STORES
// ============================================

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'closed';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  category: 'outage' | 'degradation' | 'performance' | 'security' | 'data' | 'other';
  affectedService: string;
  affectedComponents: string[];
  reportedBy: string;
  assignedTo?: string;
  team?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  impact: {
    usersAffected?: number;
    revenueImpact?: number;
    slaBreach?: boolean;
  };
  timeline: {
    timestamp: Date;
    action: string;
    actor: string;
    notes?: string;
  }[];
  relatedIncidents: string[];
  tags: string[];
  runbookId?: string;
  escalationLevel: number;
  notificationSent: boolean;
}

interface ServiceHealth {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'storage' | 'cdn' | 'gateway';
  status: 'healthy' | 'degraded' | 'down' | 'maintenance' | 'unknown';
  endpoint: string;
  port: number;
  lastCheck: Date;
  responseTime: number;
  uptimePercentage: number;
  incidents: string[];
  dependencies: string[];
  metadata: Record<string, any>;
}

interface OnCallSchedule {
  id: string;
  team: string;
  name: string;
  rotationType: 'daily' | 'weekly' | 'custom';
  currentOncall: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    startTime: Date;
    endTime: Date;
  };
  schedule: {
    userId: string;
    name: string;
    email: string;
    startTime: Date;
    endTime: Date;
  }[];
  escalationContacts: {
    level: number;
    userId: string;
    name: string;
    email: string;
  }[];
  handoffTime: Date;
  isActive: boolean;
}

interface Runbook {
  id: string;
  title: string;
  category: string;
  severity: string;
  steps: {
    order: number;
    instruction: string;
    command?: string;
    expectedResult?: string;
    timeout?: number;
    critical: boolean;
  }[];
  prerequisites: string[];
  variables: { name: string; description: string; defaultValue?: string }[];
  relatedIncidents: string[];
  lastUpdated: Date;
  version: string;
  tags: string[];
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
  actions: {
    type: 'notify' | 'incident' | 'webhook' | 'runbook';
    config: Record<string, any>;
  }[];
}

// In-memory stores
const incidents: Map<string, Incident> = new Map();
const services: Map<string, ServiceHealth> = new Map();
const oncallSchedules: Map<string, OnCallSchedule> = new Map();
const runbooks: Map<string, Runbook> = new Map();
const alertRules: Map<string, AlertRule> = new Map();

// Initialize sample data
initializeSampleData();

// ============================================
// HELPER FUNCTIONS
// ============================================

function initializeSampleData() {
  // Sample services
  const sampleServices: Omit<ServiceHealth, 'id'>[] = [
    {
      name: 'RABTUL Auth Service',
      type: 'api',
      status: 'healthy',
      endpoint: 'localhost',
      port: 4002,
      lastCheck: new Date(),
      responseTime: 45,
      uptimePercentage: 99.98,
      incidents: [],
      dependencies: ['hojai-event-bus', 'rez-redis'],
      metadata: { region: 'us-east-1', version: '2.1.0' }
    },
    {
      name: 'RABTUL Payment Service',
      type: 'api',
      status: 'healthy',
      endpoint: 'localhost',
      port: 4001,
      lastCheck: new Date(),
      responseTime: 120,
      uptimePercentage: 99.95,
      incidents: [],
      dependencies: ['razorpay-api', 'hojai-event-bus'],
      metadata: { region: 'us-east-1', version: '1.8.3' }
    },
    {
      name: 'HOJAI Gateway',
      type: 'gateway',
      status: 'healthy',
      endpoint: 'localhost',
      port: 4500,
      lastCheck: new Date(),
      responseTime: 32,
      uptimePercentage: 99.99,
      incidents: [],
      dependencies: ['hojai-memory', 'hojai-agents'],
      metadata: { region: 'us-east-1', version: '3.0.0' }
    },
    {
      name: 'REZ Wallet Service',
      type: 'api',
      status: 'degraded',
      endpoint: 'localhost',
      port: 4004,
      lastCheck: new Date(),
      responseTime: 850,
      uptimePercentage: 98.5,
      incidents: [],
      dependencies: ['rez-redis', 'hojai-event-bus'],
      metadata: { region: 'us-east-1', version: '1.5.2' }
    },
    {
      name: 'Unified Hub',
      type: 'gateway',
      status: 'healthy',
      endpoint: 'localhost',
      port: 4600,
      lastCheck: new Date(),
      responseTime: 28,
      uptimePercentage: 99.97,
      incidents: [],
      dependencies: ['rabtul-auth', 'hojai-gateway'],
      metadata: { region: 'us-east-1', version: '2.0.0' }
    }
  ];

  sampleServices.forEach((svc, idx) => {
    const id = `svc-${String(idx + 1).padStart(3, '0')}`;
    services.set(id, { ...svc, id });
  });

  // Sample on-call schedule
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sampleSchedule: OnCallSchedule = {
    id: 'oncall-primary',
    team: 'platform-engineering',
    name: 'Primary On-Call Rotation',
    rotationType: 'weekly',
    currentOncall: {
      userId: 'user-001',
      name: 'Alice Chen',
      email: 'alice@rtnm.digital',
      phone: '+1-555-0101',
      startTime: now,
      endTime: nextWeek
    },
    schedule: [
      {
        userId: 'user-001',
        name: 'Alice Chen',
        email: 'alice@rtnm.digital',
        startTime: now,
        endTime: nextWeek
      },
      {
        userId: 'user-002',
        name: 'Bob Martinez',
        email: 'bob@rtnm.digital',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    ],
    escalationContacts: [
      { level: 1, userId: 'user-001', name: 'Alice Chen', email: 'alice@rtnm.digital' },
      { level: 2, userId: 'user-003', name: 'Carol Smith', email: 'carol@rtnm.digital' },
      { level: 3, userId: 'user-004', name: 'David Lee', email: 'david@rtnm.digital' }
    ],
    handoffTime: nextWeek,
    isActive: true
  };
  oncallSchedules.set('oncall-primary', sampleSchedule);

  // Sample runbook
  const authRunbook: Runbook = {
    id: 'runbook-auth-service',
    title: 'Auth Service Degradation Response',
    category: 'authentication',
    severity: 'high',
    steps: [
      {
        order: 1,
        instruction: 'Check service health metrics',
        command: 'curl -s http://localhost:4002/health',
        expectedResult: '{"status":"healthy"}',
        timeout: 10,
        critical: true
      },
      {
        order: 2,
        instruction: 'Check Redis connectivity',
        command: 'redis-cli ping',
        expectedResult: 'PONG',
        timeout: 5,
        critical: true
      },
      {
        order: 3,
        instruction: 'Review recent error logs',
        command: 'tail -100 /var/log/auth-service/errors.log',
        expectedResult: 'Error patterns identified',
        timeout: 15,
        critical: false
      },
      {
        order: 4,
        instruction: 'Check database connection pool',
        command: 'curl -s http://localhost:4002/metrics | grep db_pool',
        expectedResult: 'pool_size, active_connections',
        timeout: 10,
        critical: true
      },
      {
        order: 5,
        instruction: 'Restart service if needed',
        command: 'pm2 restart auth-service',
        expectedResult: 'Service restarted successfully',
        timeout: 30,
        critical: true
      }
    ],
    prerequisites: ['SSH access to prod-server-01', 'PM2 CLI installed', 'Redis CLI available'],
    variables: [
      { name: 'SERVICE_PORT', description: 'Port for the service', defaultValue: '4002' },
      { name: 'LOG_PATH', description: 'Path to error logs', defaultValue: '/var/log/auth-service' }
    ],
    relatedIncidents: [],
    lastUpdated: new Date(),
    version: '2.1.0',
    tags: ['auth', 'degradation', 'quick-fix'],
    verifiedBy: 'Alice Chen',
    verifiedAt: new Date()
  };
  runbooks.set('runbook-auth-service', authRunbook);

  // Sample alert rules
  const alertRule: AlertRule = {
    id: 'alert-high-error-rate',
    name: 'High Error Rate Alert',
    description: 'Trigger when error rate exceeds 5% for 5 minutes',
    condition: {
      metric: 'error_rate',
      operator: '>',
      threshold: 5,
      duration: 300
    },
    severity: 'high',
    enabled: true,
    cooldownMinutes: 15,
    actions: [
      { type: 'notify', config: { channel: '#ops-alerts', message: 'High error rate detected' } },
      { type: 'incident', config: { autoCreate: true, severity: 'high' } }
    ]
  };
  alertRules.set('alert-high-error-rate', alertRule);
}

function calculateUptimePercentage(uptimeSeconds: number, totalSeconds: number): number {
  if (totalSeconds === 0) return 100;
  return Number(((uptimeSeconds / totalSeconds) * 100).toFixed(2));
}

function calculateIncidentMetrics() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let openIncidents = 0;
  let criticalIncidents = 0;
  let resolvedLast24h = 0;
  let resolvedLast7d = 0;
  let avgResolutionTime = 0;

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  incidents.forEach(incident => {
    if (['open', 'investigating', 'identified', 'monitoring'].includes(incident.status)) {
      openIncidents++;
    }
    if (incident.severity === 'critical') {
      criticalIncidents++;
    }
    if (incident.resolvedAt) {
      const resolutionTime = incident.resolvedAt.getTime() - incident.createdAt.getTime();
      totalResolutionTime += resolutionTime;
      resolvedCount++;

      if (incident.resolvedAt >= last24h) resolvedLast24h++;
      if (incident.resolvedAt >= last7d) resolvedLast7d++;
    }
  });

  if (resolvedCount > 0) {
    avgResolutionTime = totalResolutionTime / resolvedCount;
  }

  return {
    openIncidents,
    criticalIncidents,
    resolvedLast24h,
    resolvedLast7d,
    avgResolutionTimeMinutes: Math.round(avgResolutionTime / 60000)
  };
}

function getSeverityScore(severity: Incident['severity']): number {
  const scores: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1
  };
  return scores[severity] || 1;
}

// ============================================
// HEALTH ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const metrics = calculateIncidentMetrics();
  const serviceHealth = Array.from(services.values());
  const healthyServices = serviceHealth.filter(s => s.status === 'healthy').length;
  const totalServices = serviceHealth.length;

  res.json({
    status: 'healthy',
    service: 'ops-center',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    metrics: {
      openIncidents: metrics.openIncidents,
      criticalIncidents: metrics.criticalIncidents,
      resolvedLast24h: metrics.resolvedLast24h,
      avgResolutionTimeMinutes: metrics.avgResolutionTimeMinutes
    },
    services: {
      total: totalServices,
      healthy: healthyServices,
      degraded: serviceHealth.filter(s => s.status === 'degraded').length,
      down: serviceHealth.filter(s => s.status === 'down').length
    }
  });
});

// ============================================
// INCIDENT MANAGEMENT
// ============================================

// Create incident
app.post('/api/incidents', (req: Request, res: Response) => {
  const {
    title,
    description,
    severity = 'medium',
    priority = 'p3',
    category = 'other',
    affectedService,
    affectedComponents = [],
    reportedBy,
    assignedTo,
    team,
    tags = []
  } = req.body;

  if (!title || !affectedService || !reportedBy) {
    res.status(400).json({
      error: 'Missing required fields: title, affectedService, reportedBy'
    });
    return;
  }

  const id = `inc-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const incident: Incident = {
    id,
    title,
    description: description || '',
    severity,
    status: 'open',
    priority,
    category,
    affectedService,
    affectedComponents,
    reportedBy,
    assignedTo,
    team,
    createdAt: now,
    updatedAt: now,
    impact: {
      usersAffected: 0,
      revenueImpact: 0,
      slaBreach: false
    },
    timeline: [
      {
        timestamp: now,
        action: 'Incident created',
        actor: reportedBy,
        notes: description
      }
    ],
    relatedIncidents: [],
    tags,
    escalationLevel: 0,
    notificationSent: false
  };

  incidents.set(id, incident);

  // Auto-link to affected service
  services.forEach((svc, svcId) => {
    if (svc.name.toLowerCase().includes(affectedService.toLowerCase())) {
      svc.incidents.push(id);
    }
  });

  res.status(201).json({
    success: true,
    incident: {
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.createdAt
    }
  });
});

// List incidents
app.get('/api/incidents', (req: Request, res: Response) => {
  const { status, severity, priority, affectedService, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(incidents.values());

  if (status) {
    filtered = filtered.filter(i => i.status === status);
  }
  if (severity) {
    filtered = filtered.filter(i => i.severity === severity);
  }
  if (priority) {
    filtered = filtered.filter(i => i.priority === priority);
  }
  if (affectedService) {
    filtered = filtered.filter(i =>
      i.affectedService.toLowerCase().includes(String(affectedService).toLowerCase())
    );
  }

  // Sort by severity then by created date
  filtered.sort((a, b) => {
    const severityDiff = getSeverityScore(b.severity) - getSeverityScore(a.severity);
    if (severityDiff !== 0) return severityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const limitNum = parseInt(String(limit), 10);
  const offsetNum = parseInt(String(offset), 10);

  const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

  res.json({
    total: filtered.length,
    limit: limitNum,
    offset: offsetNum,
    incidents: paginated.map(i => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      priority: i.priority,
      affectedService: i.affectedService,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      assignedTo: i.assignedTo
    }))
  });
});

// Get single incident
app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  res.json({ incident });
});

// Update incident status
app.patch('/api/incidents/:id/status', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { status, actor = 'system' } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  const validStatuses = ['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
    return;
  }

  const now = new Date();
  incident.status = status;
  incident.updatedAt = now;

  // Track timeline
  incident.timeline.push({
    timestamp: now,
    action: `Status changed to ${status}`,
    actor
  });

  // Auto-set resolved/closed timestamps
  if (status === 'resolved') {
    incident.resolvedAt = now;
  } else if (status === 'closed') {
    incident.closedAt = now;
  }

  res.json({ success: true, incident });
});

// Update incident
app.patch('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const allowedUpdates = [
    'title', 'description', 'severity', 'priority', 'assignedTo',
    'team', 'tags', 'impact', 'runbookId'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (incident as any)[field] = req.body[field];
    }
  });

  incident.updatedAt = new Date();
  incident.timeline.push({
    timestamp: new Date(),
    action: 'Incident updated',
    actor: req.body.updatedBy || 'system'
  });

  res.json({ success: true, incident });
});

// Add timeline entry
app.post('/api/incidents/:id/timeline', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { action, actor, notes } = req.body;

  if (!action || !actor) {
    res.status(400).json({ error: 'Action and actor are required' });
    return;
  }

  incident.timeline.push({
    timestamp: new Date(),
    action,
    actor,
    notes
  });

  incident.updatedAt = new Date();

  res.json({ success: true, timeline: incident.timeline });
});

// Escalate incident
app.post('/api/incidents/:id/escalate', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { reason, escalatedTo, escalatedBy } = req.body;

  incident.escalationLevel++;
  incident.updatedAt = new Date();

  incident.timeline.push({
    timestamp: new Date(),
    action: `Escalated to level ${incident.escalationLevel}`,
    actor: escalatedBy || 'system',
    notes: reason || 'No reason provided'
  });

  // Auto-assign based on escalation level
  if (escalatedTo) {
    incident.assignedTo = escalatedTo;
  }

  res.json({
    success: true,
    escalationLevel: incident.escalationLevel,
    message: `Incident escalated to level ${incident.escalationLevel}`
  });
});

// Link incidents
app.post('/api/incidents/:id/related', (req: Request, res: Response) => {
  const incident = incidents.get(req.params.id);
  const { relatedIncidentId } = req.body;

  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  if (!relatedIncidentId) {
    res.status(400).json({ error: 'relatedIncidentId is required' });
    return;
  }

  const relatedIncident = incidents.get(relatedIncidentId);
  if (!relatedIncident) {
    res.status(404).json({ error: 'Related incident not found' });
    return;
  }

  if (!incident.relatedIncidents.includes(relatedIncidentId)) {
    incident.relatedIncidents.push(relatedIncidentId);
  }

  if (!relatedIncident.relatedIncidents.includes(incident.id)) {
    relatedIncident.relatedIncidents.push(incident.id);
  }

  res.json({ success: true });
});

// ============================================
// SERVICE HEALTH MONITORING
// ============================================

// List services
app.get('/api/services', (req: Request, res: Response) => {
  const { status, type, limit = '50' } = req.query;

  let filtered = Array.from(services.values());

  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  if (type) {
    filtered = filtered.filter(s => s.type === type);
  }

  const limitNum = parseInt(String(limit), 10);
  filtered = filtered.slice(0, limitNum);

  res.json({
    total: services.size,
    services: filtered
  });
});

// Get single service
app.get('/api/services/:id', (req: Request, res: Response) => {
  const service = services.get(req.params.id);

  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  res.json({ service });
});

// Register new service
app.post('/api/services', (req: Request, res: Response) => {
  const { name, type, endpoint, port, dependencies = [], metadata = {} } = req.body;

  if (!name || !type) {
    res.status(400).json({ error: 'Name and type are required' });
    return;
  }

  const id = `svc-${uuidv4().slice(0, 8)}`;

  const service: ServiceHealth = {
    id,
    name,
    type,
    status: 'unknown',
    endpoint: endpoint || 'localhost',
    port: port || 0,
    lastCheck: new Date(),
    responseTime: 0,
    uptimePercentage: 100,
    incidents: [],
    dependencies,
    metadata
  };

  services.set(id, service);

  res.status(201).json({ success: true, service });
});

// Update service health
app.patch('/api/services/:id/health', (req: Request, res: Response) => {
  const service = services.get(req.params.id);

  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const { status, responseTime, metadata } = req.body;

  if (status) {
    const validStatuses = ['healthy', 'degraded', 'down', 'maintenance', 'unknown'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    service.status = status;
  }

  if (responseTime !== undefined) {
    service.responseTime = responseTime;
  }

  service.lastCheck = new Date();

  if (metadata) {
    service.metadata = { ...service.metadata, ...metadata };
  }

  res.json({ success: true, service });
});

// Service dependencies
app.get('/api/services/:id/dependencies', (req: Request, res: Response) => {
  const service = services.get(req.params.id);

  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const dependencyList = service.dependencies.map(depId => {
    const dep = services.get(depId);
    return dep || { id: depId, name: depId, status: 'unknown' };
  });

  res.json({ dependencies: dependencyList });
});

// ============================================
// ON-CALL SCHEDULING
// ============================================

// List schedules
app.get('/api/oncall', (req: Request, res: Response) => {
  const { team, isActive } = req.query;

  let filtered = Array.from(oncallSchedules.values());

  if (team) {
    filtered = filtered.filter(s => s.team === team);
  }
  if (isActive !== undefined) {
    filtered = filtered.filter(s => s.isActive === (isActive === 'true'));
  }

  res.json({ schedules: filtered });
});

// Get current on-call
app.get('/api/oncall/current', (req: Request, res: Response) => {
  const { team } = req.query;

  let schedules = Array.from(oncallSchedules.values());

  if (team) {
    schedules = schedules.filter(s => s.team === team);
  }

  const now = new Date();
  const currentOncalls = schedules
    .filter(s => s.isActive && s.currentOncall)
    .map(s => ({
      ...s.currentOncall,
      scheduleId: s.id,
      team: s.team,
      scheduleName: s.name
    }));

  res.json({ currentOncalls });
});

// Create on-call schedule
app.post('/api/oncall', (req: Request, res: Response) => {
  const {
    team,
    name,
    rotationType = 'weekly',
    schedule,
    escalationContacts = [],
    handoffTime
  } = req.body;

  if (!team || !name || !schedule || schedule.length === 0) {
    res.status(400).json({ error: 'Team, name, and schedule are required' });
    return;
  }

  const id = `oncall-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const oncallSchedule: OnCallSchedule = {
    id,
    team,
    name,
    rotationType,
    currentOncall: schedule[0],
    schedule,
    escalationContacts,
    handoffTime: handoffTime ? new Date(handoffTime) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    isActive: true
  };

  oncallSchedules.set(id, oncallSchedule);

  res.status(201).json({ success: true, schedule: oncallSchedule });
});

// Get single schedule
app.get('/api/oncall/:id', (req: Request, res: Response) => {
  const schedule = oncallSchedules.get(req.params.id);

  if (!schedule) {
    res.status(404).json({ error: 'Schedule not found' });
    return;
  }

  res.json({ schedule });
});

// Update on-call schedule
app.patch('/api/oncall/:id', (req: Request, res: Response) => {
  const schedule = oncallSchedules.get(req.params.id);

  if (!schedule) {
    res.status(404).json({ error: 'Schedule not found' });
    return;
  }

  const allowedUpdates = ['name', 'rotationType', 'currentOncall', 'schedule', 'escalationContacts', 'isActive'];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (schedule as any)[field] = req.body[field];
    }
  });

  res.json({ success: true, schedule });
});

// Handoff on-call
app.post('/api/oncall/:id/handoff', (req: Request, res: Response) => {
  const schedule = oncallSchedules.get(req.params.id);

  if (!schedule) {
    res.status(404).json({ error: 'Schedule not found' });
    return;
  }

  const { toUserId } = req.body;

  if (!toUserId) {
    res.status(400).json({ error: 'toUserId is required' });
    return;
  }

  const nextOncall = schedule.schedule.find(s => s.userId === toUserId);

  if (!nextOncall) {
    res.status(404).json({ error: 'User not found in schedule' });
    return;
  }

  const now = new Date();
  schedule.currentOncall = {
    ...nextOncall,
    startTime: now,
    endTime: nextOncall.endTime
  };

  res.json({
    success: true,
    message: `Handoff completed to ${nextOncall.name}`,
    currentOncall: schedule.currentOncall
  });
});

// ============================================
// RUNBOOK MANAGEMENT
// ============================================

// List runbooks
app.get('/api/runbooks', (req: Request, res: Response) => {
  const { category, severity, tags } = req.query;

  let filtered = Array.from(runbooks.values());

  if (category) {
    filtered = filtered.filter(r => r.category === category);
  }
  if (severity) {
    filtered = filtered.filter(r => r.severity === severity);
  }
  if (tags) {
    const tagList = String(tags).split(',').map(t => t.trim().toLowerCase());
    filtered = filtered.filter(r =>
      r.tags.some(t => tagList.includes(t.toLowerCase()))
    );
  }

  res.json({
    total: filtered.length,
    runbooks: filtered
  });
});

// Get single runbook
app.get('/api/runbooks/:id', (req: Request, res: Response) => {
  const runbook = runbooks.get(req.params.id);

  if (!runbook) {
    res.status(404).json({ error: 'Runbook not found' });
    return;
  }

  res.json({ runbook });
});

// Create runbook
app.post('/api/runbooks', (req: Request, res: Response) => {
  const { title, category, severity, steps, prerequisites = [], variables = [], tags = [] } = req.body;

  if (!title || !category || !steps || steps.length === 0) {
    res.status(400).json({ error: 'Title, category, and steps are required' });
    return;
  }

  const id = `runbook-${uuidv4().slice(0, 8)}`;

  const runbook: Runbook = {
    id,
    title,
    category,
    severity: severity || 'medium',
    steps,
    prerequisites,
    variables,
    relatedIncidents: [],
    lastUpdated: new Date(),
    version: '1.0.0',
    tags
  };

  runbooks.set(id, runbook);

  res.status(201).json({ success: true, runbook });
});

// Execute runbook step
app.post('/api/runbooks/:id/execute', (req: Request, res: Response) => {
  const runbook = runbooks.get(req.params.id);

  if (!runbook) {
    res.status(404).json({ error: 'Runbook not found' });
    return;
  }

  const { stepIndex, variables = {} } = req.body;

  if (stepIndex === undefined || stepIndex < 0 || stepIndex >= runbook.steps.length) {
    res.status(400).json({ error: 'Invalid step index' });
    return;
  }

  const step = runbook.steps[stepIndex];

  // In a real implementation, this would execute the command
  // For now, we return the step details
  const execution = {
    stepIndex,
    instruction: step.instruction,
    command: step.command || null,
    variables: { ...runbook.variables.reduce((acc, v) => ({ ...acc, [v.name]: v.defaultValue }), {}), ...variables },
    timeout: step.timeout || 30,
    executedAt: new Date()
  };

  res.json({
    success: true,
    execution,
    nextStep: stepIndex < runbook.steps.length - 1 ? stepIndex + 1 : null
  });
});

// ============================================
// ALERT RULES
// ============================================

// List alert rules
app.get('/api/alerts/rules', (req: Request, res: Response) => {
  const { enabled, severity } = req.query;

  let filtered = Array.from(alertRules.values());

  if (enabled !== undefined) {
    filtered = filtered.filter(r => r.enabled === (enabled === 'true'));
  }
  if (severity) {
    filtered = filtered.filter(r => r.severity === severity);
  }

  res.json({ rules: filtered });
});

// Create alert rule
app.post('/api/alerts/rules', (req: Request, res: Response) => {
  const { name, description, condition, severity, cooldownMinutes = 15, actions } = req.body;

  if (!name || !condition || !actions) {
    res.status(400).json({ error: 'Name, condition, and actions are required' });
    return;
  }

  const id = `alert-${uuidv4().slice(0, 8)}`;

  const rule: AlertRule = {
    id,
    name,
    description: description || '',
    condition,
    severity: severity || 'medium',
    enabled: true,
    cooldownMinutes,
    actions
  };

  alertRules.set(id, rule);

  res.status(201).json({ success: true, rule });
});

// Update alert rule
app.patch('/api/alerts/rules/:id', (req: Request, res: Response) => {
  const rule = alertRules.get(req.params.id);

  if (!rule) {
    res.status(404).json({ error: 'Alert rule not found' });
    return;
  }

  const allowedUpdates = ['name', 'description', 'condition', 'severity', 'enabled', 'cooldownMinutes', 'actions'];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (rule as any)[field] = req.body[field];
    }
  });

  res.json({ success: true, rule });
});

// ============================================
// DASHBOARD METRICS
// ============================================

app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const incidentMetrics = calculateIncidentMetrics();
  const serviceHealth = Array.from(services.values());

  // Severity breakdown
  const severityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  incidents.forEach(incident => {
    if (['open', 'investigating', 'identified', 'monitoring'].includes(incident.status)) {
      severityBreakdown[incident.severity]++;
    }
  });

  // Service health summary
  const serviceHealthSummary = {
    healthy: serviceHealth.filter(s => s.status === 'healthy').length,
    degraded: serviceHealth.filter(s => s.status === 'degraded').length,
    down: serviceHealth.filter(s => s.status === 'down').length,
    maintenance: serviceHealth.filter(s => s.status === 'maintenance').length,
    unknown: serviceHealth.filter(s => s.status === 'unknown').length
  };

  // Response time stats
  const responseTimes = serviceHealth.map(s => s.responseTime).filter(t => t > 0);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  res.json({
    timestamp: new Date().toISOString(),
    incidents: {
      open: incidentMetrics.openIncidents,
      critical: incidentMetrics.criticalIncidents,
      resolvedLast24h: incidentMetrics.resolvedLast24h,
      resolvedLast7d: incidentMetrics.resolvedLast7d,
      avgResolutionTimeMinutes: incidentMetrics.avgResolutionTimeMinutes,
      severityBreakdown
    },
    services: {
      total: services.size,
      ...serviceHealthSummary,
      avgResponseTimeMs: Math.round(avgResponseTime)
    },
    oncall: {
      activeSchedules: Array.from(oncallSchedules.values()).filter(s => s.isActive).length
    },
    alerts: {
      totalRules: alertRules.size,
      enabledRules: Array.from(alertRules.values()).filter(r => r.enabled).length
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Ops Center Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[ops-center] Operations Center running on port ${PORT}`);
  console.log(`[ops-center] Health check: http://localhost:${PORT}/health`);
  console.log(`[ops-center] Incidents: ${incidents.size}`);
  console.log(`[ops-center] Services: ${services.size}`);
});

export default app;