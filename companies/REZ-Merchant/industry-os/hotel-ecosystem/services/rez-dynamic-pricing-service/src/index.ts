import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateRate,
  recordPrice,
  getPricingHistory,
  getSeasonalTrends,
  ROOM_TYPES,
  type RoomType,
} from './services/pricing.service.js';

const app = express();
const PORT = 4040;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-dynamic-pricing-service',
    timestamp: new Date().toISOString(),
  });
});

// Get available room types
app.get('/api/room-types', (_req: Request, res: Response) => {
  const types = Object.entries(ROOM_TYPES).map(([key, value]) => ({
    code: key,
    name: value.name,
    basePrice: value.basePrice,
  }));
  res.json({ roomTypes: types });
});

// Calculate rate for a room
app.post('/api/pricing/calculate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomType, checkInDate, checkOutDate, occupancy, hotelId } = req.body;

    if (!roomType || !checkInDate || !checkOutDate || occupancy === undefined || !hotelId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = calculateRate(
      roomType as RoomType,
      checkInDate,
      checkOutDate,
      occupancy,
      hotelId
    );

    // Record the pricing for history
    recordPrice(
      uuidv4(),
      hotelId,
      roomType as RoomType,
      checkInDate,
      occupancy,
      result.finalPrice
    );

    res.json({ pricing: result });
  } catch (error) {
    next(error);
  }
});

// Get pricing history for a hotel
app.get('/api/pricing/history/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const history = getPricingHistory(hotelId);
  res.json({ history });
});

// Get seasonal trends
app.get('/api/pricing/trends/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const months = parseInt(req.query.months as string) || 3;
  const trends = getSeasonalTrends(hotelId, months);
  res.json({ trends });
});

// Bulk pricing calculation
app.post('/api/pricing/bulk', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      res.status(400).json({ error: 'requests must be an array' });
      return;
    }

    const results = requests.map((r: {
      roomType: RoomType;
      checkInDate: string;
      checkOutDate: string;
      occupancy: number;
      hotelId: string;
    }) => calculateRate(r.roomType, r.checkInDate, r.checkOutDate, r.occupancy, r.hotelId));

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`ReZ Dynamic Pricing Service running on port ${PORT}`);
});

export default app;
