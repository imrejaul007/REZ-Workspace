/**
 * MyRisa Family Service Routes
 */

import { Router, Request, Response } from 'express';
import { shabIntegrationService } from '../services/shabIntegrationService.js';

const router = Router();

/**
 * GET /family/summary/:userId
 * Get family health summary
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const summary = await shabIntegrationService.getFamilyHealthSummary(req.params.userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get family summary' });
  }
});

/**
 * POST /family/member
 * Add family member
 */
router.post('/member', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const connection = await shabIntegrationService.addFamilyMember(userId, data);
    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add family member' });
  }
});

/**
 * GET /family/members/:userId
 * Get family connections
 */
router.get('/members/:userId', async (req: Request, res: Response) => {
  try {
    const members = await shabIntegrationService.getFamilyConnections(req.params.userId);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get family members' });
  }
});

/**
 * PUT /family/member/:connectionId/accept
 * Accept family connection
 */
router.put('/member/:connectionId/accept', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const success = await shabIntegrationService.acceptConnection(userId, req.params.connectionId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept connection' });
  }
});

/**
 * DELETE /family/member/:connectionId
 * Revoke family connection
 */
router.delete('/member/:connectionId', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const success = await shabIntegrationService.revokeConnection(userId, req.params.connectionId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to revoke connection' });
  }
});

/**
 * POST /family/share
 * Share health data with family
 */
router.post('/share', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const record = await shabIntegrationService.shareHealthData(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to share health data' });
  }
});

/**
 * GET /family/shared/:userId
 * Get shared health from family
 */
router.get('/shared/:userId', async (req: Request, res: Response) => {
  try {
    const records = await shabIntegrationService.getSharedHealth(req.params.userId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get shared health' });
  }
});

/**
 * POST /family/care-task
 * Create care task
 */
router.post('/care-task', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const task = await shabIntegrationService.createCareTask(userId, data);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create care task' });
  }
});

/**
 * GET /family/care-tasks/:userId
 * Get care tasks
 */
router.get('/care-tasks/:userId', async (req: Request, res: Response) => {
  try {
    const tasks = await shabIntegrationService.getCareTasks(req.params.userId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get care tasks' });
  }
});

/**
 * PUT /family/care-task/:taskId/complete
 * Complete care task
 */
router.put('/care-task/:taskId/complete', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const success = await shabIntegrationService.completeCareTask(userId, req.params.taskId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to complete care task' });
  }
});

/**
 * GET /family/elder/:userId/:elderId
 * Get elder care summary
 */
router.get('/elder/:userId/:elderId', async (req: Request, res: Response) => {
  try {
    const summary = await shabIntegrationService.getElderCareSummary(
      req.params.userId,
      req.params.elderId
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get elder care summary' });
  }
});

/**
 * GET /family/child/:userId/:childId
 * Get child health summary
 */
router.get('/child/:userId/:childId', async (req: Request, res: Response) => {
  try {
    const summary = await shabIntegrationService.getChildHealthSummary(
      req.params.userId,
      req.params.childId
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get child health summary' });
  }
});

export default router;