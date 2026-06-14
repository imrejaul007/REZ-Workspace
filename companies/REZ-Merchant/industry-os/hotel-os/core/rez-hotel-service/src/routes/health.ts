import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'rez-hotel-service' });
});

export { router as healthRoutes };
