/**
 * Analytics & Intelligence domain router.
 */
import { Router } from 'express';
import analyticsRoutes from '../routes/analytics';
import intelligenceRoutes from '../routes/intelligence';
import roiRoutes from '../routes/roi';
import demandSignalsRoutes from '../routes/demandSignals';
import exportsRoutes from '../routes/exports';
import featureFlagRoutes from '../routes/featureFlags';

const router = Router();

router.use('/analytics', analyticsRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/roi', roiRoutes);
router.use('/demand-signals', demandSignalsRoutes);
router.use('/exports', exportsRoutes);
router.use('/feature-flags', featureFlagRoutes);

export default router;
