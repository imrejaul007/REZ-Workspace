/**
 * Commerce Graph Service - Main Entry Point
 *
 * Purchase intelligence for AdBazaar.
 *
 * Port: 4540
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { CommerceGraphService } from './services/commerceGraphService';

const app = express();
const PORT = parseInt(process.env.PORT || '4540', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce-graph';

app.use(helmet());
app.use(cors());
app.use(express.json());

const service = new CommerceGraphService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'commerce-graph', version: '1.0.0' });
});

app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await service.getUserProfile(req.params.userId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/categories/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = await service.getTopCategories(limit);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/category/:category', async (req: Request, res: Response) => {
  try {
    const userIds = await service.getUsersByCategory(req.params.category);
    res.json({ success: true, data: { count: userIds.length, userIds } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/lookalike/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const userIds = await service.getLookalikes(req.params.userId, limit);
    res.json({ success: true, data: { count: userIds.length, userIds } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/predict/:userId', async (req: Request, res: Response) => {
  try {
    const prediction = await service.predictUserMetrics(req.params.userId);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/cross-sell/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const opportunities = await service.getCrossSellOpportunities(req.params.userId, limit);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.post('/api/orders/attributed', async (req: Request, res: Response) => {
  try {
    const orders = await service.getAdAttributedOrders(req.body);
    res.json({
      success: true,
      data: {
        count: orders.length,
        totalValue: orders.reduce((sum, o) => sum + o.value, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Commerce Graph] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[Commerce Graph] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[Commerce Graph] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();
