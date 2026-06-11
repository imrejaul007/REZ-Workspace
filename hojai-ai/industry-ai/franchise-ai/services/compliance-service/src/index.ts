/**
 * Compliance Service
 * Industry: Franchise
 * Role: Compliance tracking, standards enforcement
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = 4071;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

app.use(cors());
app.use(express.json());

interface ComplianceCheck { id: string; franchiseId: string; standard: string; status: 'passed' | 'failed' | 'pending'; inspector: string; date: Date; notes: string; }
interface Violation { id: string; franchiseId: string; standard: string; description: string; severity: string; status: 'open' | 'resolved'; createdAt: Date; }

const checks = new Map<string, ComplianceCheck>();
const violations = new Map<string, Violation>();

app.get('/health', (req: Request, res: Response) => { res.json({ status: 'healthy', service: 'compliance-service', version: '1.0.0' }); });

app.post('/api/checks', (req: Request, res: Response) => {
  try {
    const { franchiseId, standard, status, inspector, notes } = req.body;
    if (!franchiseId || !standard) return res.status(400).json({ error: 'Required fields missing' });
    const check: ComplianceCheck = { id: uuidv4(), franchiseId, standard, status: status || 'pending', inspector: inspector || '', date: new Date(), notes: notes || '' };
    checks.set(check.id, check);
    res.status(201).json(check);
  } catch (error) { res.status(500).json({ error: 'Failed to create check' }); }
});

app.get('/api/checks', (req: Request, res: Response) => { res.json(Array.from(checks.values())); });

app.post('/api/violations', (req: Request, res: Response) => {
  try {
    const { franchiseId, standard, description, severity } = req.body;
    if (!franchiseId || !description) return res.status(400).json({ error: 'Required fields missing' });
    const violation: Violation = { id: uuidv4(), franchiseId, standard: standard || '', description, severity: severity || 'minor', status: 'open', createdAt: new Date() };
    violations.set(violation.id, violation);
    res.status(201).json(violation);
  } catch (error) { res.status(500).json({ error: 'Failed to create violation' }); }
});

app.get('/api/violations', (req: Request, res: Response) => { res.json(Array.from(violations.values())); });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => { logger.error('Error:', err); res.status(500).json({ error: 'Internal server error' }); });
app.listen(PORT, () => { logger.info(`Compliance Service running on port ${PORT}`); });
export default app;
