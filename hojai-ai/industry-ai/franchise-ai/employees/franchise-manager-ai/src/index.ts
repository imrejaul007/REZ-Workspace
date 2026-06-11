/**
 * Franchise Manager AI Agent
 * Industry: Franchise
 * Role: Franchise oversight, support, training
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = 4070;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

app.use(cors());
app.use(express.json());

interface Franchisee { id: string; franchiseId: string; name: string; email: string; phone: string; status: 'active' | 'inactive'; trainingCompleted: boolean; }
interface Ticket { id: string; franchiseId: string; category: string; priority: string; description: string; status: 'open' | 'in-progress' | 'resolved'; createdAt: Date; }
interface Training { id: string; franchiseeId: string; module: string; status: 'not-started' | 'in-progress' | 'completed'; score?: number; completedAt?: Date; }

const franchisees = new Map<string, Franchisee>();
const tickets = new Map<string, Ticket>();
const trainings = new Map<string, Training>();

app.get('/health', (req: Request, res: Response) => { res.json({ status: 'healthy', agent: 'franchise-manager-ai', role: 'Franchise Management', version: '1.0.0' }); });

app.post('/api/tickets', (req: Request, res: Response) => {
  try {
    const { franchiseId, category, description, priority } = req.body;
    if (!franchiseId || !description) return res.status(400).json({ error: 'Required fields missing' });
    const ticket: Ticket = { id: uuidv4(), franchiseId, category: category || 'general', priority: priority || 'normal', description, status: 'open', createdAt: new Date() };
    tickets.set(ticket.id, ticket);
    res.status(201).json(ticket);
  } catch (error) { res.status(500).json({ error: 'Failed to create ticket' }); }
});

app.get('/api/tickets', (req: Request, res: Response) => {
  const { franchiseId, status } = req.query;
  let result = Array.from(tickets.values());
  if (franchiseId) result = result.filter(t => t.franchiseId === franchiseId);
  if (status) result = result.filter(t => t.status === status);
  res.json(result);
});

app.post('/api/training', (req: Request, res: Response) => {
  try {
    const { franchiseeId, module } = req.body;
    if (!franchiseeId || !module) return res.status(400).json({ error: 'Required fields missing' });
    const training: Training = { id: uuidv4(), franchiseeId, module, status: 'not-started' };
    trainings.set(training.id, training);
    res.status(201).json(training);
  } catch (error) { res.status(500).json({ error: 'Failed to create training' }); }
});

app.get('/api/training', (req: Request, res: Response) => { res.json(Array.from(trainings.values())); });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => { logger.error('Error:', err); res.status(500).json({ error: 'Internal server error' }); });
app.listen(PORT, () => { logger.info(`Franchise Manager AI agent running on port ${PORT}`); });
export default app;
