import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { SKUModel } from '../models/SKU';
import { CreateProductSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const collectionId = req.query.collectionId as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (collectionId) query.collectionId = collectionId;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProductModel.countDocuments(query)
    ]);

    res.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const data = await CreateProductSchema.parseAsync(req.body);
    const product = new ProductModel(data);
    await product.save();
    res.status(201).json({ success: true, data: product, message: 'Product created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/skus/product/:productId', async (req: Request, res: Response) => {
  try {
    const skus = await SKUModel.find({ productId: req.params.productId });
    res.json({ success: true, data: skus });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/skus', async (req: Request, res: Response) => {
  try {
    const sku = new SKUModel(req.body);
    await sku.save();
    res.status(201).json({ success: true, data: sku, message: 'SKU created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
