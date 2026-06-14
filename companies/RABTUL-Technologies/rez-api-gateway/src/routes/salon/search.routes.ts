/**
 * Salon Search Routes
 *
 * Routes for salon search functionality.
 */

import { Router } from 'express';
import { searchSalons } from './controllers/search.controller';

const router = Router();

/**
 * Search salons with filters
 * GET /salons/search
 */
router.get('/', searchSalons);

export default router;
