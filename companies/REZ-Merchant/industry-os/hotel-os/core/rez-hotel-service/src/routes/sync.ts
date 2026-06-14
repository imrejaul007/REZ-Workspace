import { Router } from 'express';
import { Hotel } from '../db';

const router = Router();

// Sync hotels from Makcorps
router.post('/hotels', async (req, res) => {
  try {
    // Sync logic here
    res.json({ synced: true, count: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

export { router as syncRoutes };
