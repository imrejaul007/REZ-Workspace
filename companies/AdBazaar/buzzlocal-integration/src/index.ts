/**
 * BuzzLocal Integration - Main Entry Point
 *
 * Hyperlocal community targeting for AdBazaar.
 *
 * Port: 4545
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { BuzzLocalService } from './services/buzzlocalService';

const app = express();
const PORT = parseInt(process.env.PORT || '4545', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

const service = new BuzzLocalService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'buzzlocal-integration', version: '1.0.0' });
});

app.get('/api/communities', async (req: Request, res: Response) => {
  try {
    const { city, area } = req.query;
    const communities = await service.getCommunities({ city: city as string, area: area as string });
    res.json({
      success: true,
      data: {
        count: communities.length,
        communities: communities.map(c => ({
          id: c.communityId,
          name: c.name,
          type: c.type,
          city: c.address?.city || c.city,
          screens: c.screens?.filter((s: { active: boolean }) => s.active).length || 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/screens/inventory', async (req: Request, res: Response) => {
  try {
    const { city, screenType } = req.query;
    const inventory = await service.getScreenInventory({
      city: city as string,
      screenType: screenType as string,
    });
    res.json({
      success: true,
      data: {
        locations: inventory.length,
        totalScreens: inventory.reduce((sum, loc) => sum + loc.screens.length, 0),
        inventory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/hyperlocal', async (req: Request, res: Response) => {
  try {
    const { city, demographic } = req.query;
    if (!city) {
      res.status(400).json({ success: false, error: 'CITY_REQUIRED' });
      return;
    }
    const audience = await service.getHyperlocalAudience({
      city: city as string,
      demographic: demographic as string,
    });
    res.json({ success: true, data: audience });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[BuzzLocal Integration] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[BuzzLocal Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[BuzzLocal Integration] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();
