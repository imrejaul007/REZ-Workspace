/**
 * Support & Admin domain router: disputes, fraud, moderation, audit, prive.
 */
import { Router } from 'express';
import supportRoutes from '../routes/support';
import disputesRoutes from '../routes/disputes';
import auditRoutes from '../routes/audit';
import fraudRoutes from '../routes/fraud';
import moderationRoutes from '../routes/moderation';
import liabilityRoutes from '../routes/liability';
import serviceRoutes from '../routes/services';
import videoRoutes from '../routes/videos';
import patchTestsRoutes from '../routes/patchTests';
import priveModuleRoutes from '../routes/priveModule';

const router = Router();

router.use('/support', supportRoutes);
router.use('/disputes', disputesRoutes);
router.use('/audit', auditRoutes);
router.use('/fraud', fraudRoutes);
router.use('/moderation', moderationRoutes);
router.use('/liability', liabilityRoutes);
router.use('/settlements', liabilityRoutes); // alias: merchant app calls /settlements/:id/dispute
router.use('/services', serviceRoutes);
router.use('/videos', videoRoutes);
router.use('/patch-tests', patchTestsRoutes);
router.use('/prive', priveModuleRoutes);

export default router;
