/**
 * Routes Index
 */

import { Router } from 'express';
import brandRoutes from './brand.routes';
import campaignRoutes from './campaign.routes';
import proposalRoutes from './proposal.routes';
import contractRoutes from './contract.routes';
import dashboardRoutes from './dashboard.routes';
import applicationRoutes from './application.routes';

const router = Router();

// Brand routes
router.use('/brands', brandRoutes);

// Campaign routes
router.use('/campaigns', campaignRoutes);

// Proposal routes
router.use('/proposals', proposalRoutes);

// Contract routes
router.use('/contracts', contractRoutes);

// Dashboard routes
router.use('/', dashboardRoutes);

// Application routes
router.use('/applications', applicationRoutes);

export default router;