import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { splitBillService } from '../services/SplitBillService';

const router = Router();

const splitByItemSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  assignments: z.array(
    z.object({
      itemId: z.string().min(1, 'Item ID is required'),
      personId: z.string().min(1, 'Person ID is required'),
      personName: z.string().min(1, 'Person name is required'),
    })
  ).min(1, 'At least one assignment is required'),
});

const splitByPersonSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  persons: z.array(
    z.object({
      personId: z.string().min(1, 'Person ID is required'),
      personName: z.string().min(1, 'Person name is required'),
      customAmount: z.number().min(0).optional(),
    })
  ).min(1, 'At least one person is required'),
});

const equalSplitSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  numberOfPeople: z.number().min(1, 'At least one person required'),
  includeTips: z.boolean().optional(),
});

async function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/by-item',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = splitByItemSchema.parse(req.body);
    const result = await splitBillService.splitByItem(validatedData);
    res.status(201).json({ success: true, data: result });
  })
);

router.post(
  '/by-person',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = splitByPersonSchema.parse(req.body);
    const result = await splitBillService.splitByPerson(validatedData);
    res.status(201).json({ success: true, data: result });
  })
);

router.post(
  '/equal',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = equalSplitSchema.parse(req.body);
    const result = await splitBillService.equalSplit(validatedData);
    res.status(201).json({ success: true, data: result });
  })
);

router.get(
  '/:billId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await splitBillService.getSplitDetails(req.params.billId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Bill not found' });
      return;
    }
    res.json({ success: true, data: result });
  })
);

router.delete(
  '/:billId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await splitBillService.removeSplit(req.params.billId);
    res.json({ success: true, data: result });
  })
);

router.get(
  '/:billId/share/:personId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await splitBillService.calculateShare(req.params.billId, req.params.personId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Share not found' });
      return;
    }
    res.json({ success: true, data: result });
  })
);

export default router;
