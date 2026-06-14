/**
 * Occupancy Routes
 */

import { Router, Request, Response } from 'express';
import { occupancyService } from '../services/occupancy.service';

const router = Router();

// GET /api/occupancy/:hotelId - Get occupancy data
router.get('/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const data = await occupancyService.getOccupancyData(
      hotelId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get occupancy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get occupancy data' },
    });
  }
});

// GET /api/occupancy/:hotelId/trend - Get occupancy trend
router.get('/:hotelId/trend', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { days = '30' } = req.query;

    const trend = await occupancyService.getOccupancyTrend(hotelId, parseInt(days as string));

    res.json({
      success: true,
      data: { trend },
    });
  } catch (error) {
    console.error('Get occupancy trend error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get occupancy trend' },
    });
  });
});

// GET /api/occupancy/:hotelId/forecast - Get occupancy forecast
router.get('/:hotelId/forecast', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { days = '14' } = req.query;

    const forecast = await occupancyService.getOccupancyForecast(hotelId, parseInt(days as string));

    res.json({
      success: true,
      data: { forecast },
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get forecast' },
    });
  }
});

export default router;
