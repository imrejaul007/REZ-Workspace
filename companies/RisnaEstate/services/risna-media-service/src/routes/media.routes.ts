import { Router, Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/mediaService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// Campaigns
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await mediaService.createCampaign(req.body);
    successResponse(res, campaign, 201);
  } catch (err) { next(err); }
});

router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId, type, status, page, limit } = req.query;
    const result = await mediaService.getCampaigns({
      brokerId: brokerId as string, type: type as string, status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    paginatedResponse(res, result.campaigns, (page as unknown as number) || 1, (limit as unknown as number) || 20, result.total);
  } catch (err) { next(err); }
});

router.get('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await mediaService.getCampaign(req.params.id);
    if (!campaign) return errorResponse(res, errors.notFound('Campaign'), 404);
    successResponse(res, campaign);
  } catch (err) { next(err); }
});

router.post('/campaigns/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await mediaService.activateCampaign(req.params.id);
    if (!campaign) return errorResponse(res, errors.notFound('Campaign'), 404);
    successResponse(res, campaign);
  } catch (err) { next(err); }
});

router.post('/campaigns/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await mediaService.pauseCampaign(req.params.id);
    if (!campaign) return errorResponse(res, errors.notFound('Campaign'), 404);
    successResponse(res, campaign);
  } catch (err) { next(err); }
});

// Influencers
router.post('/influencers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const influencer = await mediaService.registerInfluencer(req.body);
    successResponse(res, influencer, 201);
  } catch (err) { next(err); }
});

router.get('/influencers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier, platform, niche, minFollowers, page, limit } = req.query;
    const result = await mediaService.getInfluencers({
      tier: tier as string, platform: platform as string, niche: niche as string,
      minFollowers: minFollowers ? parseInt(minFollowers as string, 10) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    paginatedResponse(res, result.influencers, (page as unknown as number) || 1, (limit as unknown as number) || 20, result.total);
  } catch (err) { next(err); }
});

router.get('/influencers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const influencer = await mediaService.getInfluencer(req.params.id);
    if (!influencer) return errorResponse(res, errors.notFound('Influencer'), 404);
    successResponse(res, influencer);
  } catch (err) { next(err); }
});

// Property Ads
router.post('/ads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await mediaService.createPropertyAd(req.body);
    successResponse(res, ad, 201);
  } catch (err) { next(err); }
});

router.get('/ads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId, propertyId, type, status } = req.query;
    const result = await mediaService.getPropertyAds({
      brokerId: brokerId as string, propertyId: propertyId as string,
      type: type as string, status: status as string
    });
    successResponse(res, result);
  } catch (err) { next(err); }
});

router.get('/ads/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await mediaService.getPropertyAd(req.params.id);
    if (!ad) return errorResponse(res, errors.notFound('Property ad'), 404);
    successResponse(res, ad);
  } catch (err) { next(err); }
});

router.post('/ads/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await mediaService.pausePropertyAd(req.params.id);
    if (!ad) return errorResponse(res, errors.notFound('Property ad'), 404);
    successResponse(res, ad);
  } catch (err) { next(err); }
});

// Analytics
router.get('/analytics/property/:propertyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await mediaService.getPropertyAdAnalytics(req.params.propertyId);
    successResponse(res, analytics);
  } catch (err) { next(err); }
});

router.get('/analytics/roi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.query;
    if (!brokerId) return errorResponse(res, errors.badRequest('brokerId required'), 400);
    const analytics = await mediaService.getROIAnalytics(brokerId as string);
    successResponse(res, analytics);
  } catch (err) { next(err); }
});

export default router;
