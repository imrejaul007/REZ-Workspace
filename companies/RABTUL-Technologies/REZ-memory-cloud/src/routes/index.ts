/**
 * REZ Memory Cloud - Routes Index
 */

import { Router } from 'express';
import memoryRoutes from './memory.routes.js';
import profileRoutes from './profile.routes.js';
import graphRoutes from './graph.routes.js';
import extractRoutes from './extract.routes.js';

const router = Router();

// Memory routes
router.use('/memory', memoryRoutes);

// Profile routes
router.use('/profile', profileRoutes);

// Graph routes
router.use('/graph', graphRoutes);

// Extract routes
router.use('/extract', extractRoutes);

export default router;
