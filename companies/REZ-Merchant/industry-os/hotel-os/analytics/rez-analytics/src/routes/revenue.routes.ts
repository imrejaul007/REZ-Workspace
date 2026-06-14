/**
 * Revenue Routes
 */

import { Router, Request, Response } from 'express';
import { revenueService } from '../services/revenue.service';

const router = Router();

// GET /api/revenue/:hotelId - Get revenue data
router.get('/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const data = await revenueService.getRevenueData(
      hotelId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get revenue data' },
    });
  }
});

// GET /api/revenue/:hotelId/trend - Get revenue trend
router.get('/:hotelId/trend', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { days = '30' } = req.query;

    const trend = await revenueService.getRevenueTrend(hotelId, parseInt(days as string));

    res.json({
      success: true,
      data: { trend },
    });
  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get revenue trend' },
    });
  }
});

// GET /api/revenue/:hotelId/breakdown - Get revenue breakdown
router.get('/:hotelId/breakdown', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const breakdown = await revenueService.getRevenueBreakdown(
      hotelId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: { breakdown },
    });
  } catch (error) {
    console.error('Get revenue breakdown error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get revenue breakdown' },
    });
  }
});

export default router;
