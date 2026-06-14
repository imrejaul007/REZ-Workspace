import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { billingService } from '../services/BillingService';
import { BillStatus } from '../models/Bill';

const router = Router();

const createBillSchema = z.object({
  orderId: z.string().optional(),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  tableId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1, 'Item ID is required'),
      name: z.string().min(1, 'Item name is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price cannot be negative'),
      taxRate: z.number().optional(),
      discount: z.number().optional(),
      notes: z.string().optional(),
      assignedTo: z.array(z.string()).optional(),
      isShared: z.boolean().optional(),
    })
  ).min(1, 'At least one item is required'),
  offersApplied: z.array(
    z.object({
      offerId: z.string(),
      offerName: z.string(),
      discountType: z.enum(['PERCENTAGE', 'FIXED']),
      discountValue: z.number().min(0),
    })
  ).optional(),
  createdBy: z.string().min(1, 'Created by is required'),
});

const addItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  taxRate: z.number().optional(),
  discount: z.number().optional(),
  notes: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
  isShared: z.boolean().optional(),
});

const applyDiscountSchema = z.object({
  discountType: z.enum(['BILL_LEVEL', 'ITEM_LEVEL']),
  itemId: z.string().optional(),
  discountType2: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(0, 'Discount value cannot be negative'),
  discountName: z.string().optional(),
});

const applyTipSchema = z.object({
  tipAmount: z.number().min(0, 'Tip amount cannot be negative'),
  tipType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
});

const getBillsQuerySchema = z.object({
  status: z.enum(Object.values(BillStatus)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});

const dailyReportQuerySchema = z.object({
  date: z.string().datetime().optional(),
});

async function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createBillSchema.parse(req.body);
    const bill = await billingService.createBill(validatedData);
    res.status(201).json({ success: true, data: bill });
  })
);

router.get(
  '/:billId',
  asyncHandler(async (req: Request, res: Response) => {
    const bill = await billingService.getBill(req.params.billId);
    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill not found' });
      return;
    }
    res.json({ success: true, data: bill });
  })
);

router.get(
  '/order/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const bill = await billingService.getBillByOrderId(req.params.orderId);
    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill not found' });
      return;
    }
    res.json({ success: true, data: bill });
  })
);

router.post(
  '/:billId/items',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = addItemSchema.parse(req.body);
    const bill = await billingService.addItemToBill(
      req.params.billId,
      validatedData,
      req.headers['x-user-id'] as string || 'system'
    );
    res.status(201).json({ success: true, data: bill });
  })
);

router.delete(
  '/:billId/items/:itemId',
  asyncHandler(async (req: Request, res: Response) => {
    const bill = await billingService.removeItemFromBill(
      req.params.billId,
      req.params.itemId,
      req.headers['x-user-id'] as string || 'system'
    );
    res.json({ success: true, data: bill });
  })
);

router.post(
  '/:billId/discount',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = applyDiscountSchema.parse(req.body);
    const bill = await billingService.applyDiscount({
      billId: req.params.billId,
      ...validatedData,
    });
    res.json({ success: true, data: bill });
  })
);

router.post(
  '/:billId/tip',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = applyTipSchema.parse(req.body);
    const bill = await billingService.applyTip({
      billId: req.params.billId,
      ...validatedData,
    });
    res.json({ success: true, data: bill });
  })
);

router.post(
  '/:billId/close',
  asyncHandler(async (req: Request, res: Response) => {
    const bill = await billingService.closeBill(
      req.params.billId,
      req.headers['x-user-id'] as string || 'system'
    );
    res.json({ success: true, data: bill });
  })
);

router.post(
  '/:billId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const bill = await billingService.cancelBill(
      req.params.billId,
      req.headers['x-user-id'] as string || 'system',
      reason
    );
    res.json({ success: true, data: bill });
  })
);

router.get(
  '/restaurant/:restaurantId/bills',
  asyncHandler(async (req: Request, res: Response) => {
    const query = getBillsQuerySchema.parse(req.query);
    const result = await billingService.getBillsByRestaurant(req.params.restaurantId, {
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      skip: query.skip,
    });
    res.json({ success: true, data: result });
  })
);

router.get(
  '/restaurant/:restaurantId/daily-report',
  asyncHandler(async (req: Request, res: Response) => {
    const query = dailyReportQuerySchema.parse(req.query);
    const date = query.date ? new Date(query.date) : new Date();
    const report = await billingService.getDailyReport(req.params.restaurantId, date);
    res.json({ success: true, data: report });
  })
);

export default router;
