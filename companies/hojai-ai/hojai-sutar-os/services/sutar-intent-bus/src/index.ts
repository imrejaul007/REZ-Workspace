// ============================================================================
// SUTAR Intent Bus - Main Entry Point
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4154;
const START_TIME = Date.now();

export type IntentCategory = 'browse' | 'search' | 'compare' | 'cart' | 'purchase' | 'support' | 'negotiation' | 'contract';
export type IntentStatus = 'captured' | 'processing' | 'routed' | 'completed' | 'failed';

export interface Intent {
  id: string;
  userId?: string;
  sessionId?: string;
  category: IntentCategory;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: Record<string, any>;
  status: IntentStatus;
  routedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

const intents = new Map<string, Intent>();
const intentPatterns = new Map<string, RegExp>();

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

const apiResponse = <T>(success: boolean, data?: T, error?: string, requestId?: string): ApiResponse<T> => ({ success, data, error, timestamp: new Date().toISOString(), requestId });

// Health
app.get('/health', (_req: Request, res: Response) => res.json(apiResponse(true, { status: 'healthy', service: 'sutar-intent-bus', version: '1.0.0', uptime: Math.floor((Date.now() - START_TIME) / 1000) })));
app.get('/health/ready', (_req: Request, res: Response) => res.json(apiResponse(true, { ready: true })));
app.get('/health/live', (_req: Request, res: Response) => res.json(apiResponse(true, { alive: true })));

// Intent Capture
app.post('/api/v1/intents', (req: Request, res: Response) => {
  try {
    const { userId, sessionId, category, intent, entities, context } = req.body;
    if (!intent) { res.status(400).json(apiResponse(false, undefined, 'intent required')); return; }

    const id = `intent-${uuidv4()}`;
    const intentObj: Intent = {
      id,
      userId, sessionId,
      category: category || 'browse',
      intent,
      confidence: calculateConfidence(intent),
      entities: entities || {},
      context: context || {},
      status: 'captured',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    intents.set(id, intentObj);
    console.log(`[INTENT] Captured: ${id} - ${intent}`);
    res.status(201).json(apiResponse(true, intentObj, undefined, (req as any).requestId));
  } catch (error) {
    res.status(500).json(apiResponse(false, undefined, String(error), (req as any).requestId));
  }
});

// Get Intents
app.get('/api/v1/intents', (req: Request, res: Response) => {
  const { userId, sessionId, category, status, limit = 50, offset = 0 } = req.query;
  let result = Array.from(intents.values());
  if (userId) result = result.filter(i => i.userId === userId);
  if (sessionId) result = result.filter(i => i.sessionId === sessionId);
  if (category) result = result.filter(i => i.category === category);
  if (status) result = result.filter(i => i.status === status);
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = result.length;
  result = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json(apiResponse(true, { intents: result, total, limit: Number(limit), offset: Number(offset) }));
});

app.get('/api/v1/intents/:id', (req: Request, res: Response) => {
  const intent = intents.get(req.params.id);
  if (!intent) { res.status(404).json(apiResponse(false, undefined, 'Intent not found')); return; }
  res.json(apiResponse(true, intent));
});

// Route Intent
app.post('/api/v1/intents/:id/route', (req: Request, res: Response) => {
  const intent = intents.get(req.params.id);
  if (!intent) { res.status(404).json(apiResponse(false, undefined, 'Intent not found')); return; }

  const { service } = req.body;
  intent.status = 'routed';
  intent.routedTo = service;
  intent.updatedAt = new Date().toISOString();
  intents.set(intent.id, intent);

  console.log(`[INTENT] Routed: ${intent.id} -> ${service}`);
  res.json(apiResponse(true, intent));
});

// Pattern Learning
app.post('/api/v1/patterns', (req: Request, res: Response) => {
  const { name, pattern } = req.body;
  if (!name || !pattern) { res.status(400).json(apiResponse(false, undefined, 'name and pattern required')); return; }
  try {
    intentPatterns.set(name, new RegExp(pattern, 'i'));
    res.status(201).json(apiResponse(true, { name, pattern }));
  } catch (e) {
    res.status(400).json(apiResponse(false, undefined, 'Invalid regex pattern'));
  }
});

app.get('/api/v1/patterns', (_req: Request, res: Response) => {
  const patterns = Array.from(intentPatterns.entries()).map(([name, _]) => name);
  res.json(apiResponse(true, { patterns }));
});

// Intent Analysis
app.get('/api/v1/analytics/intents', (req: Request, res: Response) => {
  const intentsArr = Array.from(intents.values());
  const byCategory = intentsArr.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byStatus = intentsArr.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  res.json(apiResponse(true, { total: intentsArr.length, byCategory, byStatus }));
});

function calculateConfidence(intent: string): number {
  const patterns = intent.toLowerCase().split(' ');
  if (patterns.length > 3) return 0.9;
  if (patterns.length > 1) return 0.7;
  return 0.5;
}

app.use((_req: Request, res: Response) => res.status(404).json(apiResponse(false, undefined, 'Not found')));
app.use((err: Error, _req: Request, res: Response) => res.status(500).json(apiResponse(false, undefined, err.message)));

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

app.listen(PORT, () => console.log(`\nSUTAR INTENT BUS running on port ${PORT}\n`));

export default app;
