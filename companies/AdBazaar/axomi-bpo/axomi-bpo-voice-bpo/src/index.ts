/**
 * ADBAZAR BPO - Voice BPO Service
 * RABTUL Technologies - axomi-bpo-voice-bpo
 * Port: 4970
 *
 * Features:
 * - Campaign management (inbound, outbound, blended)
 * - Agent management and routing
 * - Call handling with IVR flows
 * - Real-time call statistics
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

import type {
  Campaign,
  Agent,
  Call,
  IvrFlow,
  Queue,
  CreateCallDto,
  UpdateCallDto,
  CreateAgentDto,
  CreateCampaignDto,
  CallStatus,
  AgentStatus,
  CallStatistics,
  CampaignReport,
  PhoneNumber,
  IvrStep,
} from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4970', 10);

// ============================================
// IN-MEMORY STORES
// ============================================

const campaigns = new Map<string, Campaign>();
const agents = new Map<string, Agent>();
const calls = new Map<string, Call>();
const ivrFlows = new Map<string, IvrFlow>();
const queues = new Map<string, Queue>();
const phoneNumbers = new Map<string, PhoneNumber>();

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
    service: 'voice-bpo',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// CAMPAIGNS
// ============================================

/**
 * POST /campaigns
 * Create new campaign
 */
app.post('/campaigns', (req: Request, res: Response) => {
  try {
    const dto: CreateCampaignDto = req.body;

    if (!dto.name || !dto.type || !dto.startDate) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, type, and startDate are required' },
      });
      return;
    }

    const campaign: Campaign = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description || '',
      type: dto.type,
      status: 'draft',
      priority: dto.priority || 'normal',
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      phoneNumbers: dto.phoneNumbers || [],
      targetContacts: 0,
      contactedContacts: 0,
      answeredCalls: 0,
      missedCalls: 0,
      avgDuration: 0,
      conversionRate: 0,
      scripts: dto.scripts || [],
      ivrFlow: dto.ivrFlow,
      isActive: false,
      createdBy: (req.headers['x-user-id'] as string) || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    campaigns.set(campaign.id, campaign);

    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Create campaign error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create campaign' } });
  }
});

/**
 * GET /campaigns
 * List all campaigns
 */
app.get('/campaigns', (req: Request, res: Response) => {
  const { status, type } = req.query;

  let list = Array.from(campaigns.values());

  if (status) list = list.filter(c => c.status === status);
  if (type) list = list.filter(c => c.type === type);

  // Sort by created date descending
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: { campaigns: list, total: list.length } });
});

/**
 * GET /campaigns/:id
 * Get campaign by ID
 */
app.get('/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  res.json({ success: true, data: campaign });
});

/**
 * PATCH /campaigns/:id
 * Update campaign
 */
app.patch('/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  const { name, description, status, priority, endDate, phoneNumbers, scripts, ivrFlow, isActive } = req.body;

  if (name !== undefined) campaign.name = name;
  if (description !== undefined) campaign.description = description;
  if (status !== undefined) campaign.status = status;
  if (priority !== undefined) campaign.priority = priority;
  if (endDate !== undefined) campaign.endDate = new Date(endDate);
  if (phoneNumbers !== undefined) campaign.phoneNumbers = phoneNumbers;
  if (scripts !== undefined) campaign.scripts = scripts;
  if (ivrFlow !== undefined) campaign.ivrFlow = ivrFlow;
  if (isActive !== undefined) campaign.isActive = isActive;
  campaign.updatedAt = new Date();

  res.json({ success: true, data: campaign });
});

/**
 * POST /campaigns/:id/start
 * Start campaign
 */
app.post('/campaigns/:id/start', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Campaign must be draft or paused' } });
    return;
  }

  campaign.status = 'active';
  campaign.isActive = true;
  campaign.updatedAt = new Date();

  res.json({ success: true, data: campaign });
});

/**
 * POST /campaigns/:id/pause
 * Pause campaign
 */
app.post('/campaigns/:id/pause', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  if (campaign.status !== 'active') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Campaign must be active' } });
    return;
  }

  campaign.status = 'paused';
  campaign.updatedAt = new Date();

  res.json({ success: true, data: campaign });
});

/**
 * POST /campaigns/:id/stop
 * Stop/complete campaign
 */
app.post('/campaigns/:id/stop', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  campaign.status = 'completed';
  campaign.isActive = false;
  campaign.updatedAt = new Date();

  res.json({ success: true, data: campaign });
});

/**
 * GET /campaigns/:id/report
 * Get campaign report
 */
app.get('/campaigns/:id/report', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    return;
  }

  const campaignCalls = Array.from(calls.values()).filter(c => c.campaignId === campaign.id);

  // Calculate agent performance
  const agentStats = new Map<string, { agentId: string; agentName: string; totalCalls: number; talkTime: number; avgHandleTime: number }>();

  for (const call of campaignCalls) {
    if (call.agentId) {
      const agent = agents.get(call.agentId);
      const stats = agentStats.get(call.agentId) || {
        agentId: call.agentId,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown',
        totalCalls: 0,
        talkTime: 0,
        avgHandleTime: 0,
      };
      stats.totalCalls++;
      stats.talkTime += call.talkTime;
      agentStats.set(call.agentId, stats);
    }
  }

  // Calculate hourly breakdown
  const hourlyBreakdown: Record<number, number> = {};
  for (const call of campaignCalls) {
    const hour = call.startedAt.getHours();
    hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + 1;
  }

  const report: CampaignReport = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    period: { start: campaign.startDate, end: campaign.endDate || new Date() },
    statistics: {
      totalContacts: campaign.targetContacts,
      attempted: campaign.contactedContacts,
      answered: campaign.answeredCalls,
      completed: campaignCalls.filter(c => c.status === 'completed').length,
      conversionRate: campaign.conversionRate,
    },
    agentPerformance: Array.from(agentStats.values()).map(s => ({
      ...s,
      satisfaction: 0, // Would come from surveys
    })),
    hourlyBreakdown,
  };

  res.json({ success: true, data: report });
});

// ============================================
// AGENTS
// ============================================

/**
 * POST /agents
 * Create new agent
 */
app.post('/agents', (req: Request, res: Response) => {
  try {
    const dto: CreateAgentDto = req.body;

    if (!dto.employeeId || !dto.firstName || !dto.lastName || !dto.email || !dto.phone) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'employeeId, firstName, lastName, email, and phone are required' },
      });
      return;
    }

    const agent: Agent = {
      id: uuidv4(),
      employeeId: dto.employeeId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      status: 'offline',
      skills: dto.skills || [],
      campaigns: dto.campaigns || [],
      totalCalls: 0,
      totalTalkTime: 0,
      avgHandleTime: 0,
      avgSatisfaction: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    agents.set(agent.id, agent);

    res.json({ success: true, data: agent });
  } catch (error) {
    logger.error('Create agent error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create agent' } });
  }
});

/**
 * GET /agents
 * List all agents
 */
app.get('/agents', (req: Request, res: Response) => {
  const { status, campaignId } = req.query;

  let list = Array.from(agents.values());

  if (status) list = list.filter(a => a.status === status);
  if (campaignId) list = list.filter(a => a.campaigns.includes(campaignId as string));

  res.json({ success: true, data: { agents: list, total: list.length } });
});

/**
 * GET /agents/:id
 * Get agent by ID
 */
app.get('/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  res.json({ success: true, data: agent });
});

/**
 * PATCH /agents/:id
 * Update agent
 */
app.patch('/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  const { firstName, lastName, email, phone, status, skills, campaigns } = req.body;

  if (firstName !== undefined) agent.firstName = firstName;
  if (lastName !== undefined) agent.lastName = lastName;
  if (email !== undefined) agent.email = email;
  if (phone !== undefined) agent.phone = phone;
  if (status !== undefined) agent.status = status as AgentStatus;
  if (skills !== undefined) agent.skills = skills;
  if (campaigns !== undefined) agent.campaigns = campaigns;
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * POST /agents/:id/login
 * Agent login
 */
app.post('/agents/:id/login', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  agent.status = 'available';
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * POST /agents/:id/logout
 * Agent logout
 */
app.post('/agents/:id/logout', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  agent.status = 'offline';
  agent.currentCallId = undefined;
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * POST /agents/:id/break
 * Start break
 */
app.post('/agents/:id/break', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  if (agent.status === 'on_call') {
    res.status(400).json({ success: false, error: { code: 'ON_CALL', message: 'Agent is on a call' } });
    return;
  }

  agent.status = 'break';
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * POST /agents/:id/available
 * Set agent available
 */
app.post('/agents/:id/available', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  agent.status = 'available';
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * GET /agents/:id/stats
 * Get agent statistics
 */
app.get('/agents/:id/stats', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }

  const agentCalls = Array.from(calls.values()).filter(c => c.agentId === agent.id);

  res.json({
    success: true,
    data: {
      totalCalls: agent.totalCalls,
      avgHandleTime: agent.avgHandleTime,
      avgSatisfaction: agent.avgSatisfaction,
      status: agent.status,
      todayCalls: agentCalls.filter(c => {
        const today = new Date();
        return c.startedAt.toDateString() === today.toDateString();
      }).length,
    },
  });
});

// ============================================
// CALLS
// ============================================

/**
 * POST /calls
 * Initiate new call
 */
app.post('/calls', (req: Request, res: Response) => {
  try {
    const dto: CreateCallDto = req.body;

    if (!dto.direction || !dto.from || !dto.to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'direction, from, and to are required' },
      });
      return;
    }

    const call: Call = {
      id: uuidv4(),
      callSid: `CA${uuidv4().replace(/-/g, '').slice(0, 32)}`,
      direction: dto.direction,
      from: dto.from,
      to: dto.to,
      status: 'pending',
      priority: dto.priority || 'normal',
      campaignId: dto.campaignId,
      agentId: dto.agentId,
      queueId: dto.queueId,
      duration: 0,
      waitTime: 0,
      talkTime: 0,
      holdTime: 0,
      transferHistory: [],
      notes: [],
      tags: [],
      metadata: dto.metadata || {},
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    calls.set(call.id, call);

    // Update campaign stats
    if (call.campaignId) {
      const campaign = campaigns.get(call.campaignId);
      if (campaign) {
        campaign.contactedContacts++;
        campaign.updatedAt = new Date();
      }
    }

    res.json({ success: true, data: call });
  } catch (error) {
    logger.error('Create call error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create call' } });
  }
});

/**
 * GET /calls
 * List all calls
 */
app.get('/calls', (req: Request, res: Response) => {
  const { status, direction, agentId, campaignId, startDate, endDate, limit = 100 } = req.query;

  let list = Array.from(calls.values());

  if (status) list = list.filter(c => c.status === status);
  if (direction) list = list.filter(c => c.direction === direction);
  if (agentId) list = list.filter(c => c.agentId === agentId);
  if (campaignId) list = list.filter(c => c.campaignId === campaignId);
  if (startDate) list = list.filter(c => c.startedAt >= new Date(startDate as string));
  if (endDate) list = list.filter(c => c.startedAt <= new Date(endDate as string));

  // Sort by started date descending
  list.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  // Limit results
  list = list.slice(0, Number(limit));

  res.json({ success: true, data: { calls: list, total: calls.size } });
});

/**
 * GET /calls/:id
 * Get call by ID
 */
app.get('/calls/:id', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  res.json({ success: true, data: call });
});

/**
 * PATCH /calls/:id
 * Update call
 */
app.patch('/calls/:id', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  const dto: UpdateCallDto = req.body;

  if (dto.status) {
    const prevStatus = call.status;
    call.status = dto.status;

    // Update timestamps based on status
    if (dto.status === 'ringing' && !call.ringingAt) {
      call.ringingAt = new Date();
    }
    if (dto.status === 'in_progress' && !call.answeredAt) {
      call.answeredAt = new Date();
      // If assigned to agent, update agent
      if (call.agentId) {
        const agent = agents.get(call.agentId);
        if (agent) {
          agent.status = 'on_call';
          agent.currentCallId = call.id;
          agent.updatedAt = new Date();
        }
      }
    }
    if (['completed', 'missed', 'failed'].includes(dto.status) && !call.endedAt) {
      call.endedAt = new Date();
      call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
      if (call.agentId) {
        const agent = agents.get(call.agentId);
        if (agent) {
          agent.status = 'after_call_work';
          agent.currentCallId = undefined;
          agent.totalCalls++;
          agent.totalTalkTime += call.talkTime;
          agent.avgHandleTime = Math.round(agent.totalTalkTime / agent.totalCalls);
          agent.updatedAt = new Date();
        }
      }
    }
  }

  if (dto.agentId !== undefined) call.agentId = dto.agentId;
  if (dto.notes) {
    call.notes.push({
      id: uuidv4(),
      agentId: dto.agentId || 'system',
      content: dto.notes,
      createdAt: new Date(),
    });
  }
  if (dto.tags) call.tags = dto.tags;
  if (dto.metadata) call.metadata = { ...call.metadata, ...dto.metadata };
  call.updatedAt = new Date();

  res.json({ success: true, data: call });
});

/**
 * POST /calls/:id/answer
 * Answer incoming call
 */
app.post('/calls/:id/answer', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  if (call.status !== 'ringing') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Call must be ringing' } });
    return;
  }

  const { agentId } = req.body;

  call.status = 'in_progress';
  call.answeredAt = new Date();
  if (agentId) call.agentId = agentId;
  call.updatedAt = new Date();

  // Update agent
  if (call.agentId) {
    const agent = agents.get(call.agentId);
    if (agent) {
      agent.status = 'on_call';
      agent.currentCallId = call.id;
      agent.updatedAt = new Date();
    }
  }

  res.json({ success: true, data: call });
});

/**
 * POST /calls/:id/hangup
 * End call
 */
app.post('/calls/:id/hangup', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  if (!['in_progress', 'ringing'].includes(call.status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Call is not active' } });
    return;
  }

  call.status = 'completed';
  call.endedAt = new Date();
  call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
  call.updatedAt = new Date();

  // Update agent
  if (call.agentId) {
    const agent = agents.get(call.agentId);
    if (agent) {
      agent.status = 'after_call_work';
      agent.currentCallId = undefined;
      agent.totalCalls++;
      agent.totalTalkTime += call.talkTime;
      agent.avgHandleTime = Math.round(agent.totalTalkTime / agent.totalCalls);
      agent.updatedAt = new Date();
    }
  }

  // Update campaign
  if (call.campaignId) {
    const campaign = campaigns.get(call.campaignId);
    if (campaign) {
      campaign.answeredCalls++;
      if (campaign.contactedContacts > 0) {
        campaign.conversionRate = Math.round((campaign.answeredCalls / campaign.contactedContacts) * 100);
      }
      campaign.updatedAt = new Date();
    }
  }

  res.json({ success: true, data: call });
});

/**
 * POST /calls/:id/transfer
 * Transfer call
 */
app.post('/calls/:id/transfer', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  const { toAgentId, toQueue, reason } = req.body;

  if (!toAgentId && !toQueue) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'toAgentId or toQueue is required' } });
    return;
  }

  // Record transfer
  call.transferHistory.push({
    fromAgentId: call.agentId || 'system',
    toAgentId: toAgentId || 'queue',
    toQueue,
    timestamp: new Date(),
    reason: reason || 'Transfer requested',
  });

  // Update status
  if (toQueue) {
    call.queueId = toQueue;
    call.status = 'transferred';
  } else if (toAgentId) {
    const prevAgentId = call.agentId;
    call.agentId = toAgentId;
    call.status = 'transferred';

    // Update agents
    if (prevAgentId) {
      const prevAgent = agents.get(prevAgentId);
      if (prevAgent) {
        prevAgent.status = 'available';
        prevAgent.currentCallId = undefined;
        prevAgent.updatedAt = new Date();
      }
    }
    const newAgent = agents.get(toAgentId);
    if (newAgent) {
      newAgent.status = 'on_call';
      newAgent.currentCallId = call.id;
      newAgent.updatedAt = new Date();
    }
  }

  call.updatedAt = new Date();

  res.json({ success: true, data: call });
});

/**
 * POST /calls/:id/hold
 * Put call on hold
 */
app.post('/calls/:id/hold', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  // In a real implementation, would track hold start time
  res.json({ success: true, data: { callId: call.id, status: 'on_hold' } });
});

/**
 * POST /calls/:id/note
 * Add note to call
 */
app.post('/calls/:id/note', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);

  if (!call) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Call not found' } });
    return;
  }

  const { content, agentId } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } });
    return;
  }

  const note = {
    id: uuidv4(),
    agentId: agentId || call.agentId || 'system',
    content,
    createdAt: new Date(),
  };

  call.notes.push(note);
  call.updatedAt = new Date();

  res.json({ success: true, data: note });
});

// ============================================
// IVR FLOWS
// ============================================

/**
 * POST /ivr
 * Create IVR flow
 */
app.post('/ivr', (req: Request, res: Response) => {
  try {
    const { name, steps } = req.body;

    if (!name || !steps) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and steps are required' } });
      return;
    }

    const ivrFlow: IvrFlow = {
      id: uuidv4(),
      name,
      steps: steps.map((s: Partial<IvrStep>, i: number) => ({
        id: s.id || uuidv4(),
        prompt: s.prompt || '',
        actions: s.actions || [],
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ivrFlows.set(ivrFlow.id, ivrFlow);

    res.json({ success: true, data: ivrFlow });
  } catch (error) {
    logger.error('Create IVR error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create IVR flow' } });
  }
});

/**
 * GET /ivr
 * List IVR flows
 */
app.get('/ivr', (req: Request, res: Response) => {
  const list = Array.from(ivrFlows.values());
  res.json({ success: true, data: { flows: list, total: list.length } });
});

/**
 * GET /ivr/:id
 * Get IVR flow
 */
app.get('/ivr/:id', (req: Request, res: Response) => {
  const flow = ivrFlows.get(req.params.id);

  if (!flow) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'IVR flow not found' } });
    return;
  }

  res.json({ success: true, data: flow });
});

/**
 * POST /ivr/:id/execute
 * Execute IVR flow for a call
 */
app.post('/ivr/:id/execute', (req: Request, res: Response) => {
  const flow = ivrFlows.get(req.params.id);

  if (!flow) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'IVR flow not found' } });
    return;
  }

  const { callId, dtmf } = req.body;

  // Find matching action based on DTMF
  let nextStep = flow.steps[0];
  let action: string | undefined;
  let destination: string | undefined;

  for (const step of flow.steps) {
    for (const a of step.actions) {
      if (dtmf && a.dtmf === dtmf) {
        nextStep = step;
        action = a.action;
        destination = a.destination;
        break;
      }
    }
  }

  // Update call with IVR path
  if (callId) {
    const call = calls.get(callId);
    if (call) {
      call.ivrPath = flow.id;
      call.ivrResponse = { ...call.ivrResponse, [flow.id]: { dtmf, action, destination } };
      call.updatedAt = new Date();
    }
  }

  res.json({
    success: true,
    data: {
      flowId: flow.id,
      flowName: flow.name,
      currentStep: nextStep,
      action,
      destination,
    },
  });
});

// ============================================
// QUEUES
// ============================================

/**
 * POST /queues
 * Create queue
 */
app.post('/queues', (req: Request, res: Response) => {
  try {
    const { name, description, priority, maxWaitTime, agents: agentIds, strategies } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
      return;
    }

    const queue: Queue = {
      id: uuidv4(),
      name,
      description: description || '',
      priority: priority || 0,
      maxWaitTime: maxWaitTime || 300,
      agents: agentIds || [],
      strategies: strategies || ['round_robin'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queues.set(queue.id, queue);

    res.json({ success: true, data: queue });
  } catch (error) {
    logger.error('Create queue error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create queue' } });
  }
});

/**
 * GET /queues
 * List queues
 */
app.get('/queues', (req: Request, res: Response) => {
  const list = Array.from(queues.values());
  res.json({ success: true, data: { queues: list, total: list.length } });
});

/**
 * GET /queues/:id
 * Get queue by ID
 */
app.get('/queues/:id', (req: Request, res: Response) => {
  const queue = queues.get(req.params.id);

  if (!queue) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue not found' } });
    return;
  }

  // Get queued calls
  const queuedCalls = Array.from(calls.values()).filter(c => c.queueId === queue.id && c.status === 'pending');

  res.json({ success: true, data: { ...queue, queuedCalls: queuedCalls.length } });
});

/**
 * POST /queues/:id/add-agent
 * Add agent to queue
 */
app.post('/queues/:id/add-agent', (req: Request, res: Response) => {
  const queue = queues.get(req.params.id);

  if (!queue) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue not found' } });
    return;
  }

  const { agentId } = req.body;

  if (!agentId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'agentId is required' } });
    return;
  }

  if (!queue.agents.includes(agentId)) {
    queue.agents.push(agentId);
    queue.updatedAt = new Date();
  }

  res.json({ success: true, data: queue });
});

/**
 * POST /queues/:id/remove-agent
 * Remove agent from queue
 */
app.post('/queues/:id/remove-agent', (req: Request, res: Response) => {
  const queue = queues.get(req.params.id);

  if (!queue) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue not found' } });
    return;
  }

  const { agentId } = req.body;

  queue.agents = queue.agents.filter(id => id !== agentId);
  queue.updatedAt = new Date();

  res.json({ success: true, data: queue });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get overall statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayCalls = Array.from(calls.values()).filter(c => c.startedAt >= today);

  const stats: CallStatistics = {
    totalCalls: calls.size,
    answeredCalls: todayCalls.filter(c => ['in_progress', 'completed'].includes(c.status)).length,
    missedCalls: todayCalls.filter(c => c.status === 'missed').length,
    avgWaitTime: todayCalls.length > 0
      ? Math.round(todayCalls.reduce((sum, c) => sum + c.waitTime, 0) / todayCalls.length)
      : 0,
    avgTalkTime: todayCalls.length > 0
      ? Math.round(todayCalls.reduce((sum, c) => sum + c.talkTime, 0) / todayCalls.length)
      : 0,
    avgHandleTime: Array.from(agents.values()).reduce((sum, a) => sum + a.avgHandleTime, 0) / Math.max(agents.size, 1),
    avgSatisfaction: Array.from(agents.values()).reduce((sum, a) => sum + a.avgSatisfaction, 0) / Math.max(agents.size, 1),
    conversionRate: campaigns.size > 0
      ? Math.round(Array.from(campaigns.values()).reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.size)
      : 0,
    peakHour: 0,
    callsByStatus: {
      pending: 0,
      ringing: 0,
      in_progress: 0,
      completed: 0,
      missed: 0,
      failed: 0,
      transferred: 0,
      voicemail: 0,
    },
    callsByHour: {},
  };

  // Count by status
  for (const call of todayCalls) {
    stats.callsByStatus[call.status] = (stats.callsByStatus[call.status] || 0) + 1;

    // Hourly breakdown
    const hour = call.startedAt.getHours();
    stats.callsByHour[hour] = (stats.callsByHour[hour] || 0) + 1;
  }

  // Find peak hour
  let maxCalls = 0;
  for (const [hour, count] of Object.entries(stats.callsByHour)) {
    if (count > maxCalls) {
      maxCalls = count;
      stats.peakHour = parseInt(hour);
    }
  }

  res.json({
    success: true,
    data: {
      ...stats,
      agents: {
        total: agents.size,
        available: Array.from(agents.values()).filter(a => a.status === 'available').length,
        onCall: Array.from(agents.values()).filter(a => a.status === 'on_call').length,
        onBreak: Array.from(agents.values()).filter(a => a.status === 'break').length,
      },
      campaigns: {
        total: campaigns.size,
        active: Array.from(campaigns.values()).filter(c => c.status === 'active').length,
      },
      queues: {
        total: queues.size,
        active: Array.from(queues.values()).filter(q => q.isActive).length,
      },
    },
  });
});

// ============================================
// PHONE NUMBERS
// ============================================

/**
 * POST /phone-numbers
 * Add phone number
 */
app.post('/phone-numbers', (req: Request, res: Response) => {
  try {
    const { number, country, type } = req.body;

    if (!number) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'number is required' } });
      return;
    }

    const phoneNumber: PhoneNumber = {
      id: uuidv4(),
      number,
      country: country || 'BD',
      type: type || 'local',
      isActive: true,
    };

    phoneNumbers.set(phoneNumber.id, phoneNumber);

    res.json({ success: true, data: phoneNumber });
  } catch (error) {
    logger.error('Add phone number error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to add phone number' } });
  }
});

/**
 * GET /phone-numbers
 * List phone numbers
 */
app.get('/phone-numbers', (req: Request, res: Response) => {
  const list = Array.from(phoneNumbers.values());
  res.json({ success: true, data: { numbers: list, total: list.length } });
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
║                    ADBAZAR Voice BPO Service                    ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  • Campaign Management (inbound, outbound, blended)          ║
║  • Agent Management & Routing                                ║
║  • Call Handling & IVR Flows                                 ║
║  • Real-time Statistics                                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  POST /campaigns    - Create campaign                        ║
║  GET  /campaigns    - List campaigns                         ║
║  POST /agents       - Create agent                          ║
║  GET  /agents       - List agents                           ║
║  POST /calls        - Initiate call                          ║
║  GET  /calls        - List calls                            ║
║  POST /ivr          - Create IVR flow                        ║
║  POST /queues       - Create queue                           ║
║  GET  /stats        - Get statistics                        ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
