import { Router, Request, Response, NextFunction } from 'express';
import { inventoryTwinController } from '../controllers/inventorytwin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.createInventoryTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.getInventoryTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:inventoryId/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.addItem(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:inventoryId/stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.adjustStock(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:inventoryId/waste', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.logWaste(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:inventoryId/purchase-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.createPurchaseOrder(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:inventoryId/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.getAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryTwinController.deleteInventoryTwin(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;