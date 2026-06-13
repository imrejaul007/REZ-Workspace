/**
 * Analytics Routes
 */

import { Router } from 'express';

export const analyticsRoutes = Router();

analyticsRoutes.get('/overview', (req, res) => {
  res.json({
    patients: { today: 45, week: 320, month: 1250 },
    revenue: { today: 245000, week: 1850000, month: 7200000 },
    avgWaitTime: '18 min',
    bedOccupancy: '84%'
  });
});
