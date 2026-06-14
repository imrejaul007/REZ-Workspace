// ============================================================================
// SUTAR Agent Network - Main Entry Point
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// Types
export type AgentStatus = 'available' | 'busy' | 'offline';
export type AgentCapability = 'reasoning' | 'execution' | 'analysis' | 'creation' | 'communication' | 'coordination';

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: AgentCapability[];
  skills: string[];
  status: AgentStatus;
  rating: number;
  completedTasks: number;
  successRate: number;
  hourlyRate?: number;
  metadata: Record<string, unknown>;
  registeredAt: string;
  lastActive: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

const agents = new Map<string, Agent>();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4155;
const START_TIME = Date.now();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests' } });
app.use('/api/', limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => console.log(JSON.stringify({ timestamp: new Date().toISOString(), method: req.method, path: req.path, status: res.statusCode, duration: Date.now() - start })));
  next();
});

const apiResponse = <T>(success: boolean, data?: T, error?: string, requestId?: string): ApiResponse<T> => ({ success, data, error, timestamp: new Date().toISOString(), requestId });

// Health
app.get('/health', (_req: Request, res: Response) => res.json(apiResponse(true, { status: 'healthy', service: 'sutar-agent-network', version: '1.0.0', uptime: Math.floor((Date.now() - START_TIME) / 1000) })));
app.get('/health/ready', (_req: Request, res: Response) => res.json(apiResponse(true, { ready: true })));
app.get('/health/live', (_req: Request, res: Response) => res.json(apiResponse(true, { alive: true })));

// Agent Registry
app.post('/api/v1/agents', (req: Request, res: Response) => {
  try {
    const { name, type, description, capabilities, skills, hourlyRate } = req.body;
    if (!name || !type || !capabilities) {
      res.status(400).json(apiResponse(false, undefined, 'Missing required fields'));
      return;
    }
    const agent: Agent = {
      id: `agent-${uuidv4()}`,
      name, type, description: description || '',
      capabilities,
      skills: skills || [],
      status: 'available',
      rating: 5.0,
      completedTasks: 0,
      successRate: 100,
      hourlyRate,
      metadata: {},
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    agents.set(agent.id, agent);
    console.log(`[AGENT] Registered: ${agent.id} - ${agent.name}`);
    res.status(201).json(apiResponse(true, agent, undefined, (req as any).requestId));
  } catch (error) {
    res.status(500).json(apiResponse(false, undefined, String(error), (req as any).requestId));
  }
});

app.get('/api/v1/agents', (req: Request, res: Response) => {
  const { status, capability, type, limit = 50, offset = 0 } = req.query;
  let result = Array.from(agents.values());
  if (status) result = result.filter(a => a.status === status);
  if (capability) result = result.filter(a => a.capabilities.includes(capability as AgentCapability));
  if (type) result = result.filter(a => a.type === type);
  result.sort((a, b) => b.rating - a.rating);
  const total = result.length;
  result = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json(apiResponse(true, { agents: result, total, limit: Number(limit), offset: Number(offset) }));
});

app.get('/api/v1/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) { res.status(404).json(apiResponse(false, undefined, 'Agent not found')); return; }
  res.json(apiResponse(true, agent));
});

app.put('/api/v1/agents/:id/status', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) { res.status(404).json(apiResponse(false, undefined, 'Agent not found')); return; }
  const { status } = req.body;
  if (!['available', 'busy', 'offline'].includes(status)) {
    res.status(400).json(apiResponse(false, undefined, 'Invalid status'));
    return;
  }
  agent.status = status;
  agent.lastActive = new Date().toISOString();
  agents.set(agent.id, agent);
  res.json(apiResponse(true, agent));
});

app.post('/api/v1/agents/match', (req: Request, res: Response) => {
  const { capabilities, skills, limit = 5 } = req.body;
  let matches = Array.from(agents.values())
    .filter(a => a.status === 'available')
    .filter(a => capabilities?.every((c: AgentCapability) => a.capabilities.includes(c)))
    .map(a => ({ ...a, matchScore: calculateMatchScore(a, capabilities, skills) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
  res.json(apiResponse(true, { matches }));
});

function calculateMatchScore(agent: Agent, capabilities: string[], skills: string[]): number {
  let score = 0;
  capabilities?.forEach((c: string) => { if (agent.capabilities.includes(c as AgentCapability)) score += 30; });
  skills?.forEach((s: string) => { if (agent.skills.includes(s)) score += 20; });
  score += agent.rating * 2;
  score += (agent.successRate / 100) * 10;
  return Math.min(100, score);
}

app.use((_req: Request, res: Response) => res.status(404).json(apiResponse(false, undefined, 'Not found')));
app.use((err: Error, _req: Request, res: Response) => res.status(500).json(apiResponse(false, undefined, err.message)));

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

app.listen(PORT, () => console.log(`\nSUTAR AGENT NETWORK running on port ${PORT}\n`));

export default app;
