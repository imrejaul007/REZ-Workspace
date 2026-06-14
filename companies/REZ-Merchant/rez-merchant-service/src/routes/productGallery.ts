import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// SECURITY: All endpoints MUST scope by `merchant: req.merchantId`.
// Without this, any merchant can list/append/delete images on any
// product across the entire catalogue.

router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const product = (await Product.findOne({
      _id: req.params.productId,
      merchant: req.merchantId,
    })
      .select('images name')
      .lean()) as unknown;
    if (!product) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, data: { images: product.images || [] } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load gallery' });
  }
});

router.post('/:productId/images', async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) {
      res.status(400).json({ success: false, message: 'images array required' });
      return;
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, merchant: req.merchantId },
      { $push: { images: { $each: images } } },
      { new: true },
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to add images' });
  }
});

router.delete('/:productId/images/:imageIndex', async (req: Request, res: Response) => {
  try {
    const product = (await Product.findOne({
      _id: req.params.productId,
      merchant: req.merchantId,
    })) as unknown;
    if (!product) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    const idx = parseInt(req.params.imageIndex as string);
    if (product.images && product.images[idx]) {
      product.images.splice(idx, 1);
      await product.save();
    }
    res.json({ success: true, message: 'Image removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove image' });
  }
});

export default router;
