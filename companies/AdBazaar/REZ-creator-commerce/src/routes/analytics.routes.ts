import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService, creatorService } from '../services';
import { logger } from '../services/logger.service';

const router = Router();

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================
// ANALYTICS ROUTES (Nested under creators)
// ============================================

/**
 * GET /api/creators/:creatorId/analytics
 * Get analytics for a creator
 */
router.get('/creators/:creatorId/analytics', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const summary = await analyticsService.getCreatorSummary(creatorId, days);
  if (!summary) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/daily
 * Get daily earnings breakdown
 */
router.get('/creators/:creatorId/analytics/daily', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const dailyEarnings = await analyticsService.getDailyEarnings(creatorId, days);

  res.json({
    success: true,
    data: dailyEarnings,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/top-products
 * Get top products for a creator
 */
router.get('/creators/:creatorId/analytics/top-products', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const topProducts = await analyticsService.getTopProducts(creatorId, limit);

  res.json({
    success: true,
    data: topProducts,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/trend
 * Get earnings trend
 */
router.get('/creators/:creatorId/analytics/trend', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const trend = await analyticsService.getEarningsTrend(creatorId, days);

  res.json({
    success: true,
    data: trend,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/conversion
 * Get conversion metrics
 */
router.get('/creators/:creatorId/analytics/conversion', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const conversion = await analyticsService.getConversionMetrics(creatorId, days);

  res.json({
    success: true,
    data: conversion,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/order-breakdown
 * Get order status breakdown
 */
router.get('/creators/:creatorId/analytics/order-breakdown', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const breakdown = await analyticsService.getOrderStatusBreakdown(creatorId);

  res.json({
    success: true,
    data: breakdown,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/analytics/recent-orders
 * Get recent orders for analytics
 */
router.get('/creators/:creatorId/analytics/recent-orders', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const recentOrders = await analyticsService.getRecentOrders(creatorId, limit);

  res.json({
    success: true,
    data: recentOrders,
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// PLATFORM ANALYTICS ROUTES
// ============================================

/**
 * GET /api/analytics/overview
 * Get platform-wide analytics
 */
router.get('/analytics/overview', asyncHandler(async (req: Request, res: Response) => {
  const platformAnalytics = await analyticsService.getPlatformAnalytics();

  res.json({
    success: true,
    data: platformAnalytics,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/analytics/record-view
 * Record a page view (for analytics tracking)
 */
router.post('/analytics/record-view', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId, productId } = req.body;

  if (!creatorId) {
    res.status(400).json({
      success: false,
      error: 'Creator ID is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  await analyticsService.recordPageView(creatorId, productId);

  res.json({
    success: true,
    message: 'Page view recorded',
    timestamp: new Date().toISOString(),
  });
}));

export default router;