import { Router, Request, Response, NextFunction } from 'express';
import { gstFilingService } from '../services/gstFilingService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/gstr1', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.user!.merchantId;
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      req.query.period = `${year}-${month}`;
    }

    const gstr1 = await gstFilingService.generateGSTR1(merchantId, period as string);

    res.json({
      success: true,
      data: gstr1
    });
  } catch (error) {
    next(error);
  }
});

router.get('/gstr3b', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.user!.merchantId;
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      req.query.period = `${year}-${month}`;
    }

    const gstr3b = await gstFilingService.generateGSTR3B(merchantId, period as string);

    res.json({
      success: true,
      data: gstr3b
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.user!.merchantId;
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      req.query.period = `${year}-${month}`;
    }

    const status = await gstFilingService.getFilingStatus(merchantId, period as string);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

router.post('/calculate-liability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.user!.merchantId;
    const { period } = req.body;

    if (!period || typeof period !== 'string') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      req.body.period = `${year}-${month}`;
    }

    const liability = await gstFilingService.calculateLiability(merchantId, period);

    res.json({
      success: true,
      data: liability
    });
  } catch (error) {
    next(error);
  }
});

export default router;
