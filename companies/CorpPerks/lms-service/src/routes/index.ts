import { Router } from 'express';
import courseRoutes from './courses/courseRoutes.js';
import enrollmentRoutes from './enrollments/enrollmentRoutes.js';
import certificateRoutes from './certificates/certificateRoutes.js';

const router = Router();

// Course routes
router.use('/courses', courseRoutes);

// Enrollment routes
router.use('/enrollments', enrollmentRoutes);

// Certificate routes
router.use('/certificates', certificateRoutes);

export { router as courseRoutes, router as enrollmentRoutes, router as certificateRoutes };
export default router;
