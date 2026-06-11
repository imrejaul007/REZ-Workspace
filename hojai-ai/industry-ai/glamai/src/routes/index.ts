/**
 * GLAMAI - Routes Index
 * Salon AI Operating System
 *
 * Export all routes and mount them on the Express app.
 */

import { Router } from 'express';
import customersRouter from './customers';
import servicesRouter from './routes/services';
import appointmentsRouter from './appointments';
import stylistsRouter from './stylists';
import aiRouter from './ai';
import analyticsRouter from './analytics';

const router = Router();

// Mount routes
router.use('/api/customers', customersRouter);
router.use('/api/services', servicesRouter);
router.use('/api/appointments', appointmentsRouter);
router.use('/api/stylists', stylistsRouter);
router.use('/api/ai', aiRouter);
router.use('/api/analytics', analyticsRouter);

// Health check is in main index.ts

export default router;