// Ecosystem Routes
// Endpoints for ecosystem integration status and health

import { Router, Request, Response } from 'express';
import { ecosystemIntegration } from '../services/index.js';

const router = Router();

// GET /api/v1/ecosystem/services
// Get all connected services
router.get('/services', async (req: Request, res: Response) => {
  try {
    const services = ecosystemIntegration.getConnectedServices();

    res.json({
      success: true,
      data: services,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get services',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/health
// Get ecosystem health status
router.get('/health', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    ecosystemIntegration.setTenantId(tenantId);

    const health = await ecosystemIntegration.getEcosystemHealth();

    res.json({
      success: health.success,
      data: health.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting ecosystem health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ecosystem health',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/rabtul/profile/:employeeId
// Get employee profile from RABTUL
router.get('/rabtul/profile/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const profile = await ecosystemIntegration.getEmployeeProfile(employeeId);

    res.json({
      success: profile.success,
      data: profile.data,
      error: profile.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/intelligence/signals/:employeeId
// Get employee signals from REZ Intelligence
router.get('/intelligence/signals/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const signals = await ecosystemIntegration.getEmployeeSignals(employeeId);

    res.json({
      success: signals.success,
      data: signals.data,
      error: signals.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get signals',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/intelligence/predictions/:employeeId
// Get all predictions for employee
router.get('/intelligence/predictions/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const [attrition, productivity, burnout] = await Promise.all([
      ecosystemIntegration.getAttritionPrediction(employeeId),
      ecosystemIntegration.getProductivityPrediction(employeeId),
      ecosystemIntegration.getBurnoutPrediction(employeeId),
    ]);

    res.json({
      success: attrition.success && productivity.success && burnout.success,
      data: {
        attrition: attrition.data,
        productivity: productivity.data,
        burnout: burnout.data,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/media/karma/:employeeId
// Get karma score from REZ Media
router.get('/media/karma/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const karma = await ecosystemIntegration.getKarmaScore(employeeId);

    res.json({
      success: karma.success,
      data: karma.data,
      error: karma.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting karma:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get karma score',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/ecosystem/media/leaderboard
// Get gamification leaderboard
router.get('/media/leaderboard', async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const leaderboard = await ecosystemIntegration.getLeaderboard(department as string | undefined);

    res.json({
      success: leaderboard.success,
      data: leaderboard.data,
      error: leaderboard.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/ecosystem/actions/award-points
// Award points to employee via RABTUL Wallet
router.post('/actions/award-points', async (req: Request, res: Response) => {
  try {
    const { employeeId, points, reason } = req.body;

    if (!employeeId || !points) {
      res.status(400).json({
        success: false,
        error: 'employeeId and points are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await ecosystemIntegration.awardPoints(employeeId, points, reason || 'Workforce achievement');

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error awarding points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award points',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/ecosystem/actions/award-badge
// Award badge to employee via REZ Media Gamification
router.post('/actions/award-badge', async (req: Request, res: Response) => {
  try {
    const { employeeId, badgeId } = req.body;

    if (!employeeId || !badgeId) {
      res.status(400).json({
        success: false,
        error: 'employeeId and badgeId are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await ecosystemIntegration.awardBadge(employeeId, badgeId);

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award badge',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/ecosystem/actions/notify
// Send notification via RABTUL Notifications
router.post('/actions/notify', async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !type || !title || !message) {
      res.status(400).json({
        success: false,
        error: 'userId, type, title, and message are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await ecosystemIntegration.sendNotification({ userId, type, title, message, data });

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
