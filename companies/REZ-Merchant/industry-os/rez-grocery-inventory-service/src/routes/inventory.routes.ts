import { Router, Request, Response } from 'express';
import { InventoryModel } from '../models/Inventory';
import { SupplierModel } from '../models/Supplier';
import { CreateInventorySchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/items', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      InventoryModel.find(query).sort({ productName: 1 }).skip(skip).limit(limit),
      InventoryModel.countDocuments(query)
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/low-stock', async (_req: Request, res: Response) => {
  try {
    const items = await InventoryModel.findLowStock();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const items = await InventoryModel.findExpiring(days);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/items', async (req: Request, res: Response) => {
  try {
    const data = await CreateInventorySchema.parseAsync(req.body);
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    const item = new InventoryModel(data);
    await item.save();
    res.status(201).json({ success: true, data: item, message: 'Item added' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/items/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity, adjustment } = req.body;
    const item = await InventoryModel.findById(req.params.id);
    if (!item) { res.status(404).json({ success: false, error: 'Item not found' }); return; }

    if (typeof quantity === 'number') item.quantity = quantity;
    else if (typeof adjustment === 'number') item.quantity = Math.max(0, item.quantity + adjustment);
    await item.save();
    res.json({ success: true, data: item, message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/suppliers', async (_req: Request, res: Response) => {
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
