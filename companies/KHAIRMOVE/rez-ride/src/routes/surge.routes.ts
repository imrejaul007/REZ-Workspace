import { Router, Request, Response } from 'express';
import { SurgeService } from '../services/surge.service';

const router = Router();
const surgeService = new SurgeService(null as any, null as any);

/**
 * @route GET /api/surge/:lat/:lng
 * @desc Get surge multiplier for location
 */
router.get('/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const surge = await surgeService.getSurgeMultiplier(
      parseFloat(req.params.lat),
      parseFloat(req.params.lng)
    );
    res.json({ success: true, surge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/surge/zones
 * @desc Get all active surge zones
 */
router.get('/zones/all', async (req: Request, res: Response) => {
  try {
    const zones = await surgeService.getActiveSurgeZones();
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/surge/history/:zoneId
 * @desc Get surge history for zone
 */
router.get('/history/:zoneId', async (req: Request, res: Response) => {
  try {
    const { hours = 24 } = req.query;
    const history = await surgeService.getSurgeHistory(
      req.params.zoneId,
      parseInt(hours as string)
    );
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/surge/config
 * @desc Get surge configuration
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({ success: true, config: surgeService.getConfig() });
});

export default router;
