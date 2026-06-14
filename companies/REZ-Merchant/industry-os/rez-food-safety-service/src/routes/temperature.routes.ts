/**
 * Temperature Log Routes
 */

import { Router, Request, Response } from 'express';
import { TemperatureLog } from '../models';

const router = Router();

// Record temperature
router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, restaurantId, foodItemId, foodName, zone, temperature, recordedBy, notes } = req.body;

    // Determine status based on temperature
    let status = 'normal';
    if (zone === 'chiller' && (temperature > 8 || temperature < 0)) status = 'critical';
    if (zone === 'freezer' && temperature > -18) status = 'critical';
    if (zone === 'hot-hold' && temperature < 60) status = 'critical';

    const log = new TemperatureLog({
      merchantId,
      restaurantId,
      foodItemId,
      foodName,
      zone,
      temperature,
      status,
      recordedBy,
      notes,
    });
    await log.save();

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record temperature' });
  }
});

// Get temperature logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, zone, startDate, endDate, status } = req.query;
    const query: Record<string, unknown> = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (zone) query.zone = zone;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.recordedAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const logs = await TemperatureLog.find(query).sort({ recordedAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// Get alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.query;
    const alerts = await TemperatureLog.find({
      restaurantId,
      status: { $in: ['warning', 'critical'] },
    }).sort({ recordedAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

// Get temperature chart data
router.get('/chart/:itemId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const logs = await TemperatureLog.find({
      foodItemId: req.params.itemId,
      recordedAt: {
        $gte: startDate ? new Date(startDate as string) : sevenDaysAgo,
        $lte: endDate ? new Date(endDate as string) : new Date(),
      },
    }).sort({ recordedAt: 1 });

    const chartData = logs.map(log => ({
      timestamp: log.recordedAt,
      temperature: log.temperature,
      status: log.status,
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch chart data' });
  }
});

export { router as temperatureRoutes };
