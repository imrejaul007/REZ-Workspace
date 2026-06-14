/**
 * Campaigns & Marketing domain router.
 */
import { Router } from 'express';
import broadcastsRoutes from '../routes/broadcasts';
import campaignRulesRoutes from '../routes/campaignRules';
import campaignROIRoutes from '../routes/campaignROI';
import campaignRecommendationsRoutes from '../routes/campaignRecommendations';
import campaignsRoutes from '../routes/campaigns';
import campaignSimulatorRoutes from '../routes/campaignSimulator';
import adsRoutes from '../routes/ads';
import attributionRoutes from '../routes/attribution';
import growthRoutes from '../routes/growth';
import socialMediaRoutes from '../routes/socialMedia';
import customerInsightsRoutes from '../routes/customerInsights';

const router = Router();

router.use('/broadcasts', broadcastsRoutes);
router.use('/campaign-rules', campaignRulesRoutes);
router.use('/campaign-roi', campaignROIRoutes);
router.use('/campaign-recommendations', campaignRecommendationsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/campaign-simulator', campaignSimulatorRoutes);
router.use('/ads', adsRoutes);
router.use('/attribution', attributionRoutes);
router.use('/growth', growthRoutes);
router.use('/social-media', socialMediaRoutes);
router.use('/customer-insights', customerInsightsRoutes);

export default router;
