import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { doohService } from '../services/doohService';
import { asyncHandler, ApiError } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

// ========== PUBLIC DOOH ENDPOINTS (no auth required) ==========

// Get screens - public
router.get('/screens', asyncHandler(async (req: Request, res: Response) => {
  const { airport, terminal } = req.query;
  const screens = await doohService.getScreens(airport as string, terminal as string);
  res.json({ success: true, data: screens, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Get screen by ID - public
router.get('/screens/:screenId', [param('screenId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const screen = await doohService.getScreenById(req.params.screenId);
  if (!screen) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: screen, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// ========== PROTECTED DOOH ENDPOINTS (auth required) ==========

// Get advertiser campaigns - requires authentication
router.get('/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  const campaigns = await doohService.getAdvertiserCampaigns(userId);
  res.json({ success: true, data: campaigns, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Create campaign - requires authentication
router.post('/campaigns',
  [body('name').notEmpty(), body('screens').isArray(), body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/), body('endDate').matches(/^\d{4}-\d{2}-\d{2}$/), body('totalBudget').isFloat({ min: 0 })],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    const { name, screens, startDate, endDate, totalBudget, targeting } = req.body;
    const campaign = await doohService.createCampaign(userId, name, screens, startDate, endDate, totalBudget, targeting);
    res.status(201).json({ success: true, data: campaign, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Get campaign by ID - requires authentication
router.get('/campaigns/:campaignId', [param('campaignId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  const campaign = await doohService.getCampaign(req.params.campaignId);
  if (!campaign) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: campaign, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Update campaign status - requires authentication
router.post('/campaigns/:campaignId/status',
  [param('campaignId').notEmpty(), body('status').isIn(['draft', 'active', 'paused', 'completed'])],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    const campaign = await doohService.updateCampaignStatus(req.params.campaignId, req.body.status);
    if (!campaign) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: campaign, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Get campaign analytics - requires authentication
router.get('/campaigns/:campaignId/analytics',
  [param('campaignId').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    const { startDate, endDate } = req.query;
    const analytics = await doohService.getAnalytics(req.params.campaignId, startDate as string, endDate as string);
    res.json({ success: true, data: analytics, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

export default router;
