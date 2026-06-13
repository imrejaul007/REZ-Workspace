import { Router, Request, Response, NextFunction } from 'express';
import { tableTwinController } from '../controllers/table-twin.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.createTableTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:tableId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.getTableTwin(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:tableId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.updateTableStatus(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:tableId/seat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.seatTable(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:tableId/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.clearTable(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:tableId/turntime', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.updateTurnTime(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.listTables(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/availability/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.getTableAvailability(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:tableId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableTwinController.deleteTableTwin(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
