import { Router } from 'express';
import publishRoutes from './publishRoutes.js';
import accountRoutes from './accountRoutes.js';
import webhookRoutes from './webhookRoutes.js';

const router = Router();

// Mount routes
router.use('/publish', publishRoutes);
router.use('/accounts', accountRoutes);
router.use('/webhooks', webhookRoutes);

// Health and metrics are handled in the main index.ts
// These are mounted at the root level

export default router;