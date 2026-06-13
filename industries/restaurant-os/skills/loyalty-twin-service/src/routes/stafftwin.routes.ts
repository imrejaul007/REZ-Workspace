import { Router, Request, Response, NextFunction } from 'express';
import { staffTwinController } from '../controllers/staff-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.createStaffTwin(req, res); } catch (error) { next(error); }
});

router.get('/:staffId', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.getStaffTwin(req, res); } catch (error) { next(error); }
});

router.post('/:staffId/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.checkIn(req, res); } catch (error) { next(error); }
});

router.post('/:staffId/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.checkOut(req, res); } catch (error) { next(error); }
});

router.put('/:staffId/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.updateSchedule(req, res); } catch (error) { next(error); }
});

router.delete('/:staffId', async (req: Request, res: Response, next: NextFunction) => {
  try { await staffTwinController.deleteStaffTwin(req, res); } catch (error) { next(error); }
});

export default router;