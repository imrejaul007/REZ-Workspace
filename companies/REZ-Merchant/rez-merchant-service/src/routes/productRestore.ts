import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// SECURITY: All endpoints MUST scope by `merchant: req.merchantId`.
// Previously a merchant could list/restore any soft-deleted product
// across the entire catalogue simply by guessing IDs.

router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }

    // Verify the merchant owns this store before listing anything.
    const ownedStore = await Store.findOne({
      _id: storeId as string,
      merchant: req.merchantId,
    })
      .select('_id')
      .lean();
    if (!ownedStore) {
      res.status(403).json({ success: false, message: 'You do not own this store' });
      return;
    }

    const products = await Product.find({
      store: new mongoose.Types.ObjectId(storeId as string),
      merchant: req.merchantId,
      isDeleted: true,
    })
      .sort({ deletedAt: -1 })
      .lean();
    res.json({ success: true, data: products });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to list deleted products' });
  }
});

router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    // Only restore a product that belongs to this merchant.
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, merchant: req.merchantId },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true },
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, message: 'Product restored', data: product });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to restore product' });
  }
});

export default router;
