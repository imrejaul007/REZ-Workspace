import { Router } from 'express';
import eventsRouter from './events.js';
import impactRouter from './impact.js';

const router = Router();

// Mount routes
router.use('/events', eventsRouter);

// Impact routes can be accessed via /api/impact or /api/events/:id/impact
router.use('/impact', impactRouter);

export default router;