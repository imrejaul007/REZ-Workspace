/**
 * Reporting Service
 * Industry: Franchise
 * Role: Performance reporting, analytics
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = 4072;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

app.use(cors());
app.use(express.json());

interface Report { id: string; franchiseId?: string; type: string; period: string; title: string; data: Record<string, any>; generatedAt: Date; }

const reports = new Map<string, Report>();

app.get('/health', (req: Request, res: Response) => { res.json({ status: 'healthy', service: 'reporting-service', version: '1.0.0' }); });

app.post('/api/reports', (req: Request, res: Response) => {
  try {
    const { franchiseId, type, period, title, data } = req.body;
    if (!type || !title) return res.status(400).json({ error: 'Required fields missing' });
    const report: Report = { id: uuidv4(), franchiseId, type, period: period || '', title, data: data || {}, generatedAt: new Date() };
    reports.set(report.id, report);
    res.status(201).json(report);
  } catch (error) { res.status(500).json({ error: 'Failed to create report' }); }
});

app.get('/api/reports', (req: Request, res: Response) => { res.json(Array.from(reports.values())); });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => { logger.error('Error:', err); res.status(500).json({ error: 'Internal server error' }); });
app.listen(PORT, () => { logger.info(`Reporting Service running on port ${PORT}`); });
export default app;
