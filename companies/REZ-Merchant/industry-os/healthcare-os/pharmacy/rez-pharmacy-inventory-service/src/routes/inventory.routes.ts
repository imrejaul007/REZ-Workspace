import { Router, Request, Response } from 'express';
import { BatchModel } from '../models/Batch';
import { SupplierModel } from '../models/Supplier';
import { CreateBatchSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/batches', async (req: Request, res: Response) => {
  try {
    const batches = await BatchModel.find({ status: 'active' }).sort({ expiryDate: 1 });
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/batches/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const batches = await BatchModel.findExpiring(days);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/batches', async (req: Request, res: Response) => {
  try {
    const data = await CreateBatchSchema.parseAsync(req.body);
    data.manufactureDate = new Date(data.manufactureDate);
    data.expiryDate = new Date(data.expiryDate);
    const batch = new BatchModel(data);
    await batch.save();
    res.status(201).json({ success: true, data: batch, message: 'Batch added' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/batches/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const batch = await BatchModel.findByIdAndUpdate(req.params.id, { $set: { quantity } }, { new: true });
    if (!batch) { res.status(404).json({ success: false, error: 'Batch not found' }); return; }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/suppliers', async (_req: Request, res: Response) => {
  try {
    const suppliers = await SupplierModel.find({ status: 'active' });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
