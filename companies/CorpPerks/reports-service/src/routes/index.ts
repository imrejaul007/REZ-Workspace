import { Router } from 'express';
import templateRoutes from './templates/templateRoutes.js';
import analyticsRoutes from './analytics/analyticsRoutes.js';
import attendanceReportRoutes from './analytics/attendanceReportRoutes.js';
import performanceReportRoutes from './analytics/performanceReportRoutes.js';
import financialReportRoutes from './analytics/financialReportRoutes.js';

const router = Router();

// Template routes
router.use('/templates', templateRoutes);

// Report routes
router.use('/', analyticsRoutes);

// Pre-configured analytics routes
router.use('/analytics', attendanceReportRoutes);
router.use('/analytics', performanceReportRoutes);
router.use('/analytics', financialReportRoutes);

export { router as templateRoutes, router as analyticsRoutes };
export default router;
