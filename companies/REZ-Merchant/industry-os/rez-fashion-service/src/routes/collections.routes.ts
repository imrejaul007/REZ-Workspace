import { Router, Request, Response } from 'express';
import { Collection } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createCollectionSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, status } = req.query as any;
  const collections = await Collection.findByMerchant(merchantId, status);
  res.json({ success: true, data: collections, count: collections.length });
}));

router.get('/:collectionId', asyncHandler(async (req: Request, res: Response) => {
  const collection = await Collection.findOne({ collectionId: req.params.collectionId });
  if (!collection) return res.status(404).json({ success: false, error: 'Collection not found' });
  res.json({ success: true, data: collection });
}));

router.post('/', validate(createCollectionSchema), asyncHandler(async (req: Request, res: Response) => {
  const collection = new Collection(req.body);
  await collection.save();
  res.status(201).json({ success: true, data: collection, message: 'Collection created successfully' });
}));

router.put('/:collectionId', asyncHandler(async (req: Request, res: Response) => {
  const collection = await Collection.findOneAndUpdate({ collectionId: req.params.collectionId }, { $set: req.body }, { new: true, runValidators: true });
  if (!collection) return res.status(404).json({ success: false, error: 'Collection not found' });
  res.json({ success: true, data: collection, message: 'Collection updated successfully' });
}));

router.post('/:collectionId/products', asyncHandler(async (req: Request, res: Response) => {
  const { productIds, action } = req.body;
  const collection = await Collection.findOne({ collectionId: req.params.collectionId });
  if (!collection) return res.status(404).json({ success: false, error: 'Collection not found' });

  if (action === 'add') {
    productIds.forEach((id: string) => collection.addProduct(id));
  } else if (action === 'remove') {
    productIds.forEach((id: string) => collection.removeProduct(id));
  } else {
    return res.status(400).json({ success: false, error: 'Invalid action. Use "add" or "remove"' });
  }

  res.json({ success: true, data: collection, message: `Products ${action}ed successfully` });
}));

router.delete('/:collectionId', asyncHandler(async (req: Request, res: Response) => {
  const result = await Collection.deleteOne({ collectionId: req.params.collectionId });
  if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Collection not found' });
  res.json({ success: true, message: 'Collection deleted successfully' });
}));

export default router;