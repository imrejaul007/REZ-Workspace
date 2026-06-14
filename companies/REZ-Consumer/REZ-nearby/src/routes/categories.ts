/**
 * REZ Nearby - Categories Route
 */

import { Router } from 'express';

export const categoriesRouter = Router();

categoriesRouter.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});
