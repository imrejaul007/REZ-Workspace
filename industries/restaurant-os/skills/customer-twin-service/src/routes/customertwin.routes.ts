import { Router, Request, Response, NextFunction } from 'express';
import { customerTwinController } from '../controllers/customer-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.createCustomerTwin(req, res); } catch (error) { next(error); }
});

router.get('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.getCustomerTwin(req, res); } catch (error) { next(error); }
});

router.put('/:customerId/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.updatePreferences(req, res); } catch (error) { next(error); }
});

router.post('/:customerId/visits', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.recordVisit(req, res); } catch (error) { next(error); }
});

router.put('/:customerId/loyalty', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.updateLoyalty(req, res); } catch (error) { next(error); }
});

router.delete('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try { await customerTwinController.deleteCustomerTwin(req, res); } catch (error) { next(error); }
});

export default router;