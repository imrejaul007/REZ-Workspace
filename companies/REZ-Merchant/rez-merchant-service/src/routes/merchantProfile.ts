import { Router, Request, Response } from 'express';
import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId).lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const storeCount = await Store.countDocuments({ merchantId: req.merchantId });
    res.json({ success: true, data: { ...merchant, storeCount } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    // BAK-HIGH-002 FIX: Field allowlisting — only these fields can be updated by the merchant.
    // Prevents attackers from setting internal fields like isVerified, commissionRate, kycStatus.
    const ALLOWED_FIELDS = [
      'businessName', 'businessType', 'description', 'phone', 'email',
      'address', 'logo', 'gstNumber', 'panNumber',
    ];
    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: updates }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/stores', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).lean();
    res.json({ success: true, data: stores });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
