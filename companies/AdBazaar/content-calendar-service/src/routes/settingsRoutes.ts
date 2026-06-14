import { Router, Response } from 'express';
import { settingsService, UpdateSettingsInput } from '../services/index.js';
import { authMiddleware, AuthenticatedRequest, validateBody, settingsUpdateSchema } from '../middleware/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const settings = await settingsService.getSettings(userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/', validateBody(settingsUpdateSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const input: UpdateSettingsInput = req.body;
    const settings = await settingsService.updateSettings(userId, input);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/blackout-dates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { date } = req.body;

    if (!date) {
      res.status(400).json({
        success: false,
        error: { message: 'date is required' },
      });
      return;
    }

    const settings = await settingsService.addBlackoutDate(userId, new Date(date));

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/blackout-dates/:date', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { date } = req.params;
    const settings = await settingsService.removeBlackoutDate(userId, new Date(date));

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/platform-colors/:platform', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { platform } = req.params;
    const { color } = req.body;

    if (!color) {
      res.status(400).json({
        success: false,
        error: { message: 'color is required' },
      });
      return;
    }

    const settings = await settingsService.updatePlatformColor(userId, platform, color);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const settings = await settingsService.resetToDefaults(userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;