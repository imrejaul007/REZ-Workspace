import { Router, Request, Response, NextFunction } from 'express';
import { orderTwinController } from '../controllers/order-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.createOrder(req, res); } catch (error) { next(error); }
});

router.get('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.getOrder(req, res); } catch (error) { next(error); }
});

router.put('/:orderId/status', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.updateOrderStatus(req, res); } catch (error) { next(error); }
});

router.post('/:orderId/items', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.addItems(req, res); } catch (error) { next(error); }
});

router.put('/:orderId/items/status', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.updateItemStatus(req, res); } catch (error) { next(error); }
});

router.post('/:orderId/payment', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.processPayment(req, res); } catch (error) { next(error); }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.listOrders(req, res); } catch (error) { next(error); }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.getAnalytics(req, res); } catch (error) { next(error); }
});

router.delete('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try { await orderTwinController.deleteOrder(req, res); } catch (error) { next(error); }
});

export default router;