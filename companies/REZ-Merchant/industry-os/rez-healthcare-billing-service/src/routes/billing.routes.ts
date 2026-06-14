import { Router, Request, Response } from 'express';
import { InvoiceModel } from '../models/Invoice';
import { PaymentModel } from '../models/Payment';
import { CreateInvoiceSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const status = req.query.status as string;
    const query: Record<string, unknown> = {};
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const data = await CreateInvoiceSchema.parseAsync(req.body);
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + data.tax - data.discount;
    const invoice = new InvoiceModel({
      invoiceId: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      subtotal,
      total,
      dueDate: new Date(data.dueDate),
      amountPaid: 0,
      status: 'pending'
    });
    await invoice.save();
    res.status(201).json({ success: true, data: invoice, message: 'Invoice created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/payments', async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, method, reference } = req.body;
    const payment = new PaymentModel({
      paymentId: `PAY-${uuidv4().substring(0, 8).toUpperCase()}`,
      invoiceId,
      amount,
      method,
      reference,
      status: 'completed',
      processedAt: new Date()
    });
    await payment.save();

    const invoice = await InvoiceModel.findById(invoiceId);
    if (invoice) {
      invoice.amountPaid += amount;
      if (invoice.amountPaid >= invoice.total) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
      } else if (invoice.amountPaid > 0) {
        invoice.status = 'partial';
      }
      await invoice.save();
    }

    res.status(201).json({ success: true, data: payment, message: 'Payment recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const invoiceId = req.query.invoiceId as string;
    const query: Record<string, unknown> = { status: 'completed' };
    if (invoiceId) query.invoiceId = invoiceId;
    const payments = await PaymentModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
