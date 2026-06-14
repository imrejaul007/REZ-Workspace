import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, merchant: req.merchantId }).select('variants name').lean() as unknown;
    if (!product) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: product.variants || [] });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/:productId', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate({ _id: req.params.productId, merchant: req.merchantId }, { $push: { variants: req.body } }, { new: true });
    if (!product) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: product });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:productId/:variantIndex', async (req: Request, res: Response) => {
  try {
    const idx = parseInt(req.params.variantIndex as string);
    const update: unknown = {};
    for (const [k, v] of Object.entries(req.body)) update[`variants.${idx}.${k}`] = v;
    const product = await Product.findByIdAndUpdate({ _id: req.params.productId, merchant: req.merchantId }, { $set: update }, { new: true });
    if (!product) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: product });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:productId/:variantIndex', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, merchant: req.merchantId }) as unknown;
    if (!product) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const idx = parseInt(req.params.variantIndex as string);
    if (product.variants && product.variants[idx]) { product.variants.splice(idx, 1); await product.save(); }
    res.json({ success: true, message: 'Variant removed' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
