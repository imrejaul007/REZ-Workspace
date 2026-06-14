import { Router, Request, Response } from 'express';
import productService, { CreateProductData, UpdateProductData } from '../services/productService';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createProductSchema, updateProductSchema, productSearchSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', validate(productSearchSchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.search(req.query as any);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}));

router.get('/search', validate(productSearchSchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.search({ ...req.query as any, search: req.query.search as string });
  res.json({ success: true, data: result.data, pagination: result.pagination });
}));

router.get('/barcode/:barcode', asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getByBarcode(req.params.barcode);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product });
}));

router.get('/merchant/:merchantId', asyncHandler(async (req: Request, res: Response) => {
  const { category, page = 1, limit = 20 } = req.query as any;
  const result = await productService.getByMerchant(req.params.merchantId, { category, page: Number(page), limit: Number(limit) });
  res.json({ success: true, data: result.data, pagination: result.pagination });
}));

router.get('/stats/:merchantId', asyncHandler(async (req: Request, res: Response) => {
  const stats = await productService.getStatistics(req.params.merchantId);
  res.json({ success: true, data: stats });
}));

router.get('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product });
}));

router.post('/', validate(createProductSchema), asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body as CreateProductData);
  res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
}));

router.post('/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { products } = req.body;
  if (!Array.isArray(products)) return res.status(400).json({ success: false, error: 'Products array required' });
  const created = await productService.bulkCreate(products);
  res.status(201).json({ success: true, data: created, count: created.length, message: 'Products bulk created' });
}));

router.put('/:productId', validate(updateProductSchema), asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(req.params.productId, req.body as UpdateProductData);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product, message: 'Product updated successfully' });
}));

router.patch('/:productId/stock', asyncHandler(async (req: Request, res: Response) => {
  const { quantity, operation } = req.body;
  if (!['add', 'subtract', 'set'].includes(operation)) return res.status(400).json({ success: false, error: 'Invalid operation' });
  const product = await productService.updateStock(req.params.productId, quantity, operation);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product, message: 'Stock updated successfully' });
}));

router.delete('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await productService.delete(req.params.productId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, message: 'Product deleted successfully' });
}));

export default router;