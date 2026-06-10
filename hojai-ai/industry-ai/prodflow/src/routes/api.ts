/**
 * PRODFLOW - API Routes Index
 * Main router combining all API endpoints
 */

import { Router } from 'express';
import aiBrainRouter from './api/aiBrain';

const router = Router();

router.use('/ai', aiBrainRouter);

router.get('/', (req, res) => {
  res.json({
    service: 'PRODFLOW',
    version: '1.0.0',
    description: 'Manufacturing AI Operating System',
    endpoints: {
      aiBrain: '/api/ai/brain',
      health: '/health'
    }
  });
});

export default router;
