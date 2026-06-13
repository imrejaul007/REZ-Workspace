import { Router, Request, Response, NextFunction } from 'express';
import { loyaltyTwinController } from '../controllers/loyalty-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { await loyaltyTwinController.createLoyaltyTwin(req, res); } catch (error) { next(error); }
});

router.post('/earn', async (req: Request, res: Response, next: NextFunction) => {
  try { await loyaltyTwinController.earnPoints(req, res); } catch (error) { next(error); }
});

router.post('/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try { await loyaltyTwinController.redeemPoints(req, res); } catch (error) { next(error); }
});

router.get('/status/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try { await loyaltyTwinController.getLoyaltyStatus(req, res); } catch (error) { next(error); }
});

router.delete('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try { await loyaltyTwinController.deleteLoyaltyTwin(req, res); } catch (error) { next(error); }
});

export default router;