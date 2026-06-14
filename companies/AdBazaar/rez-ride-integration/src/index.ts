/**
 * ReZ Ride Integration Service - Main Entry Point
 *
 * Mobility intelligence for AdBazaar - enables targeting based on
 * ride behavior, routes, locations, and mobility patterns.
 *
 * Port: 4530
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { MobilityService } from './services/mobilityService';

const app = express();
const PORT = parseInt(process.env.PORT || '4530', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-ride-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

const mobilityService = new MobilityService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rez-ride-integration', version: '1.0.0' });
});

app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await mobilityService.getProfile(req.params.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.post('/api/area/users', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm } = req.body;
    const users = await mobilityService.getUsersInArea(lat, lng, radiusKm);
    res.json({ success: true, data: { count: users.length, userIds: users } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/hot-zones', async (req: Request, res: Response) => {
  try {
    const zones = await mobilityService.getHotZones(req.query.city as string);
    res.json({ success: true, data: zones });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.post('/api/session', async (req: Request, res: Response) => {
  try {
    const session = await mobilityService.recordRideSession(req.body);
    res.json({ success: true, data: { sessionId: session.sessionId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/airport', async (_req, res) => {
  try {
    const users = await mobilityService.getAirportTravelers();
    res.json({ success: true, data: { count: users.length, userIds: users } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.post('/api/predict/route', async (req: Request, res: Response) => {
  try {
    const { userId, destination } = req.body;
    const prediction = await mobilityService.predictRoute(userId, destination);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[ReZ Ride Integration] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[ReZ Ride Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[ReZ Ride Integration] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();
