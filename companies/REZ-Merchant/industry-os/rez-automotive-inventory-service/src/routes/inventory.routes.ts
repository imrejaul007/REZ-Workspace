import { Router, Request, Response } from 'express';
import { PartModel } from '../models/Part';
import { SupplierModel } from '../models/Supplier';
import { CreatePartSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/parts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [parts, total] = await Promise.all([
      PartModel.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      PartModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: parts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/parts/low-stock', async (_req: Request, res: Response) => {
  try {
    const parts = await PartModel.findLowStock();
    res.json({ success: true, data: parts });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/parts/:id', async (req: Request, res: Response) => {
  try {
    const part = await PartModel.findById(req.params.id);
    if (!part) { res.status(404).json({ success: false, error: 'Part not found' }); return; }
    res.json({ success: true, data: part });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/parts', async (req: Request, res: Response) => {
  try {
    const data = await CreatePartSchema.parseAsync(req.body);
    const part = new PartModel(data);
    await part.save();
    res.status(201).json({ success: true, data: part, message: 'Part added' });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/parts/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity, adjustment } = req.body;
    const part = await PartModel.findById(req.params.id);
    if (!part) { res.status(404).json({ success: false, error: 'Part not found' }); return; }

    if (typeof quantity === 'number') part.quantity = quantity;
    else if (typeof adjustment === 'number') part.quantity = Math.max(0, part.quantity + adjustment);
    await part.save();
    res.json({ success: true, data: part, message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await SupplierModel.find({ status: 'active' }).sort({ rating: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = new SupplierModel(req.body);
    await supplier.save();
    res.status(201).json({ success: true, data: supplier, message: 'Supplier added' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
