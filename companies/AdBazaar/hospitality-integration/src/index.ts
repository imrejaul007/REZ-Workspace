/**
 * Hospitality Integration Service - Main Entry Point
 *
 * Airzy + StayOwn + Restaurant inventory for AdBazaar.
 *
 * Port: 4535
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { HospitalityService } from './services/hospitalityService';

const app = express();
const PORT = parseInt(process.env.PORT || '4535', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospitality-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

const hospitalityService = new HospitalityService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hospitality-integration', version: '1.0.0' });
});

app.get('/api/guests/active', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const guests = await hospitalityService.getActiveGuests(city as string);
    res.json({
      success: true,
      data: {
        count: guests.length,
        guests: guests.map(g => ({
          guestId: g.guestId,
          propertyName: g.propertyName,
          city: g.city,
          checkOut: g.checkOut,
          loyaltyTier: g.loyaltyTier,
        })),
      },
    });
  } catch (error) {
    logger.error('Active guests error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/guests/loyalty/:tier', async (req: Request, res: Response) => {
  try {
    const guests = await hospitalityService.getGuestsByTier(req.params.tier);
    res.json({
      success: true,
      data: {
        count: guests.length,
        guests: guests.map(g => ({
          guestId: g.guestId,
          propertyName: g.propertyName,
          city: g.city,
          loyaltyTier: g.loyaltyTier,
        })),
      },
    });
  } catch (error) {
    logger.error('Loyalty guests error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/travelers/incoming', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const travelers = await hospitalityService.getIncomingTravelers(city as string || '');
    res.json({
      success: true,
      data: {
        count: travelers.length,
        travelers: travelers.map(t => ({
          travelerId: t.travelerId,
          name: t.passengerName,
          arrivalCity: t.arrivalCity,
          departureCity: t.departureCity,
          arrivalTime: t.arrivalTime,
          class: t.class,
          loyaltyTier: t.loyaltyTier,
        })),
      },
    });
  } catch (error) {
    logger.error('Incoming travelers error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/lounge', async (_req, res) => {
  try {
    const visitors = await hospitalityService.getLoungeVisitors();
    res.json({
      success: true,
      data: {
        count: visitors.length,
        visitors: visitors.map(v => ({
          travelerId: v.travelerId,
          name: v.passengerName,
          arrivalCity: v.arrivalCity,
          loyaltyTier: v.loyaltyTier,
        })),
      },
    });
  } catch (error) {
    logger.error('Lounge visitors error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const inventory = await hospitalityService.getInventory(city as string);
    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Inventory error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Hospitality Integration] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[Hospitality Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[Hospitality Integration] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();
