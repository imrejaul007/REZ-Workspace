/**
 * REZ Nearby - Search Route
 */

import { Router } from 'express';

export const searchRouter = Router();

searchRouter.get('/', (req, res) => {
  res.json({ success: true, data: { places: [], total: 0 } });
});
