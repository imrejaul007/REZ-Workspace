import { Router } from 'express';
import {
  createOrUpdateProfile,
  getProfile,
  syncMerchantData,
  getInsights,
  getRecommendations,
  getCompetitors,
  getHealthScore,
  captureEvent,
  getTrends,
} from '../controllers';

const router = Router();

/**
 * @route POST /merchant/profile
 * @desc Create or update merchant profile
 */
router.post('/profile', createOrUpdateProfile);

/**
 * @route GET /merchant/:id/profile
 * @desc Get merchant profile
 */
router.get('/:id/profile', getProfile);

/**
 * @route POST /merchant/:id/sync
 * @desc Sync merchant data from external services
 */
router.post('/:id/sync', syncMerchantData);

/**
 * @route GET /merchant/:id/insights
 * @desc Get comprehensive merchant insights
 */
router.get('/:id/insights', getInsights);

/**
 * @route GET /merchant/:id/recommendations
 * @desc Get personalized merchant recommendations
 */
router.get('/:id/recommendations', getRecommendations);

/**
 * @route GET /merchant/:id/competitors
 * @desc Get competitor analysis for merchant
 */
router.get('/:id/competitors', getCompetitors);

/**
 * @route GET /merchant/:id/health-score
 * @desc Get merchant health score
 */
router.get('/:id/health-score', getHealthScore);

/**
 * @route POST /merchant/:id/event
 * @desc Capture merchant behavior event
 */
router.post('/:id/event', captureEvent);

/**
 * @route GET /merchant/:id/trends
 * @desc Get merchant trends
 * @query period - daily, weekly, monthly, quarterly, yearly
 * @query startDate - Start date for trends
 * @query endDate - End date for trends
 * @query metrics - Comma-separated list of metrics to include
 */
router.get('/:id/trends', getTrends);

export default router;
