import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOne({ _id: req.params.storeId, merchantId: req.merchantId }).select('gallery images name').lean() as unknown;
    if (!store) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: { gallery: store.gallery || store.images || [] } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/:storeId/images', async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) { res.status(400).json({ success: false, message: 'images array required' }); return; }
    const store = await Store.findOneAndUpdate({ _id: req.params.storeId, merchantId: req.merchantId }, { $push: { gallery: { $each: images } } }, { new: true });
    if (!store) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: store });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:storeId/images/:imageIndex', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOne({ _id: req.params.storeId, merchantId: req.merchantId }) as unknown;
    if (!store) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const idx = parseInt(req.params.imageIndex as string);
    if (store.gallery && store.gallery[idx]) { store.gallery.splice(idx, 1); await store.save(); }
    res.json({ success: true, message: 'Image removed' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
