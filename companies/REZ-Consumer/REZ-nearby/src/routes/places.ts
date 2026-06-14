/**
 * REZ Nearby - Places Route
 */

import { Router } from 'express';

export const placesRouter = Router();

placesRouter.get('/nearby', (req, res) => {
  res.json({ success: true, data: { places: [], total: 0 } });
});

placesRouter.get('/:id', (req, res) => {
  res.json({ success: true, data: null });
});
