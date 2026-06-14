/**
 * Analytics Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { propertyService } from '../services/property.service';

const router = Router();

// GET /api/analytics/overview - Chain-wide overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const overview = await propertyService.getChainOverview(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get overview' },
    });
  }
});

// GET /api/analytics/revenue - Revenue analytics
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hotelIds } = req.query;
    const revenue = await propertyService.getRevenueAnalytics(
      startDate as string,
      endDate as string,
      hotelIds as string
    );

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get revenue analytics' },
    });
  }
});

// GET /api/analytics/occupancy - Occupancy analytics
router.get('/occupancy', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hotelIds } = req.query;
    const occupancy = await propertyService.getOccupancyAnalytics(
      startDate as string,
      endDate as string,
      hotelIds as string
    );

    res.json({
      success: true,
      data: occupancy,
    });
  } catch (error) {
    console.error('Get occupancy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get occupancy analytics' },
    });
  }
});

// GET /api/analytics/bookings - Booking analytics
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hotelIds } = req.query;
    const bookings = await propertyService.getBookingAnalytics(
      startDate as string,
      endDate as string,
      hotelIds as string
    );

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get booking analytics' },
    });
  }
});

// GET /api/analytics/guests - Guest analytics
router.get('/guests', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hotelIds } = req.query;
    const guests = await propertyService.getGuestAnalytics(
      startDate as string,
      endDate as string,
      hotelIds as string
    );

    res.json({
      success: true,
      data: guests,
    });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get guest analytics' },
    });
  }
});

// GET /api/analytics/staff - Staff performance
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const { hotelIds } = req.query;
    const staff = await propertyService.getStaffPerformance(hotelIds as string);

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get staff analytics' },
    });
  }
});

export default router;
