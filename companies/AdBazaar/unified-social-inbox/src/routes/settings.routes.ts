import { Router, Response } from 'express';
import { SettingsService } from '../services';
import { AuthenticatedRequest } from '../types';
import { authenticate, extractAccountId, asyncHandler } from '../middleware';
import { createModuleLogger } from 'utils/logger.js';
import { UpdateSettingsSchema } from '../utils/validators';

const logger = createModuleLogger('SettingsRoutes');

export function createSettingsRouter(settingsService: SettingsService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);
  router.use(extractAccountId);

  /**
   * GET /api/settings
   * Get inbox settings
   */
  router.get(
    '/',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const settings = await settingsService.getOrCreateSettings(accountId);

      res.json({ success: true, data: settings });
    })
  );

  /**
   * PATCH /api/settings
   * Update inbox settings
   */
  router.patch(
    '/',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const validated = UpdateSettingsSchema.parse(req.body);

      const settings = await settingsService.updateSettings(accountId, validated);

      res.json({ success: true, data: settings });
    })
  );

  /**
   * POST /api/settings/rules
   * Add assignment rule
   */
  router.post(
    '/rules',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const { keyword, assignee, priority } = req.body;

      if (!keyword || !assignee) {
        res.status(400).json({
          success: false,
          error: 'Keyword and assignee are required',
        });
        return;
      }

      const rule = {
        id: `rule-${Date.now()}`,
        keyword,
        assignee,
        priority: priority || 'medium',
      };

      const settings = await settingsService.addAssignmentRule(accountId, rule);

      res.json({ success: true, data: settings });
    })
  );

  /**
   * DELETE /api/settings/rules/:ruleId
   * Remove assignment rule
   */
  router.delete(
    '/rules/:ruleId',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const { ruleId } = req.params;

      const settings = await settingsService.removeAssignmentRule(accountId, ruleId);

      if (!settings) {
        res.status(404).json({ success: false, error: 'Settings or rule not found' });
        return;
      }

      res.json({ success: true, data: settings });
    })
  );

  /**
   * POST /api/settings/reset
   * Reset settings to defaults
   */
  router.post(
    '/reset',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const settings = await settingsService.resetSettings(accountId);

      res.json({ success: true, data: settings });
    })
  );

  /**
   * GET /api/settings/sla/:conversationId
   * Get SLA status for conversation
   */
  router.get(
    '/sla/:conversationId',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const { conversationId } = req.params;

      const settings = await settingsService.getSettings(accountId);
      if (!settings) {
        res.status(404).json({ success: false, error: 'Settings not found' });
        return;
      }

      // This would need to fetch the conversation's createdAt
      // For now, return a placeholder
      const slaStatus = settingsService.getSLAStatus(settings, new Date());

      res.json({ success: true, data: slaStatus });
    })
  );

  return router;
}
