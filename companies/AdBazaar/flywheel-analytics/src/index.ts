/**
 * Flywheel Analytics - Main Entry Point
 *
 * Ecosystem loop tracking for AdBazaar.
 *
 * Port: 4550
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { FlywheelService } from './services/flywheelService';

const app = express();
const PORT = parseInt(process.env.PORT || '4550', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flywheel-analytics';

app.use(helmet());
app.use(cors());
app.use(express.json());

const service = new FlywheelService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'flywheel-analytics', version: '1.0.0' });
});

app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const event = await service.recordEvent(req.body);
    res.status(201).json({ success: true, data: { eventId: event.eventId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.post('/api/cycles', async (req: Request, res: Response) => {
  try {
    const cycle = await service.recordCycle(req.body);
    res.status(201).json({ success: true, data: { cycleId: cycle.cycleId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const metrics = await service.getMetrics(period);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const health = await service.getFlywheelHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/funnel', async (_req, res) => {
  try {
    const funnel = await service.getFunnel();
    res.json({ success: true, data: funnel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Flywheel Analytics] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[Flywheel Analytics] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[Flywheel Analytics] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();
