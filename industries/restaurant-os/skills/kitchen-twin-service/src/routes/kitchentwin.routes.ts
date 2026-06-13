import { Router, Request, Response, NextFunction } from 'express';
import { kitchenTwinController } from '../controllers/kitchen-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.createKitchenTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:kitchenId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.getKitchenTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:kitchenId/stations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.updateStation(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:kitchenId/stations/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.assignOrderToStation(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:kitchenId/stations/bump', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.bumpOrderFromStation(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:kitchenId/stations/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.getStationPerformance(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:kitchenId/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.getKitchenAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:kitchenId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await kitchenTwinController.deleteKitchenTwin(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
