import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { gstInvoiceService } from '../services/GstInvoiceService';

const router = Router();

const generateInvoiceSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  customerDetails: z.object({
    name: z.string().min(1, 'Customer name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(1, 'Pincode is required'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.string().max(0)),
    gstin: z.string().optional(),
  }),
  invoiceDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  paymentMode: z.string().optional(),
  paymentReference: z.string().optional(),
});

const getInvoicesQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});

const cancelInvoiceSchema = z.object({
  reason: z.string().optional(),
});

const gstReportQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  restaurantGstin: z.string().optional(),
});

async function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = generateInvoiceSchema.parse(req.body);
    const invoice = await gstInvoiceService.generateInvoice({
      ...validatedData,
      invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : undefined,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    });
    res.status(201).json({ success: true, data: invoice });
  })
);

router.get(
  '/:invoiceId',
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await gstInvoiceService.getInvoice(req.params.invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  })
);

router.get(
  '/number/:invoiceNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await gstInvoiceService.getInvoiceByNumber(req.params.invoiceNumber);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  })
);

router.get(
  '/bill/:billId',
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await gstInvoiceService.getInvoiceByBillId(req.params.billId);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  })
);

router.get(
  '/gstin/:gstin',
  asyncHandler(async (req: Request, res: Response) => {
    const query = getInvoicesQuerySchema.parse(req.query);
    const result = await gstInvoiceService.getInvoicesByGstin(req.params.gstin, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      skip: query.skip,
    });
    res.json({ success: true, data: result });
  })
);

router.post(
  '/:invoiceId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = cancelInvoiceSchema.parse(req.body);
    const invoice = await gstInvoiceService.cancelInvoice(
      req.params.invoiceId,
      req.headers['x-user-id'] as string || 'system',
      validatedData.reason
    );
    res.json({ success: true, data: invoice });
  })
);

router.get(
  '/reports/gst',
  asyncHandler(async (req: Request, res: Response) => {
    const query = gstReportQuerySchema.parse(req.query);
    const report = await gstInvoiceService.generateGstReport(
      new Date(query.startDate),
      new Date(query.endDate),
      query.restaurantGstin
    );
    res.json({ success: true, data: report });
  })
);

export default router;
