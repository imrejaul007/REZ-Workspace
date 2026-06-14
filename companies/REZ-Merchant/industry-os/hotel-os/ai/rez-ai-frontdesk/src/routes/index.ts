/**
 * Route exports for AI Front Desk Service
 */

import { Router } from 'express';
import guestRoutes from './guestRoutes';
import serviceRequestRoutes from './serviceRequestRoutes';
import bookingRoutes from './bookingRoutes';
import conciergeRoutes from './conciergeRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// Mount routes
router.use('/guests', guestRoutes);
router.use('/requests', serviceRequestRoutes);
router.use('/bookings', bookingRoutes);
router.use('/concierge', conciergeRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;