import { Router, Request, Response } from 'express';
import { StaffShift } from '../models/StaffShift';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, weekStart } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const query: unknown = { storeId, merchantId: req.merchantId };
    if (weekStart) { const d = new Date(weekStart as string); d.setHours(0,0,0,0); query.weekStartDate = d; }
    const shifts = await StaffShift.find(query).lean();
    res.json({ success: true, data: shifts });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { storeId, staffId, staffName, weekStartDate, shifts } = req.body;
    if (!storeId || !staffId || !staffName || !weekStartDate || !shifts) { res.status(400).json({ success: false, message: 'Missing required fields' }); return; }
    const weekDate = new Date(weekStartDate); weekDate.setHours(0,0,0,0);
    const rota = await StaffShift.findOneAndUpdate({ storeId, staffId, weekStartDate: weekDate, merchantId: req.merchantId }, { $set: { shifts, staffName } }, { upsert: true, new: true });
    res.json({ success: true, data: rota });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:staffId/:weekStart', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const weekDate = new Date(req.params.weekStart as string); weekDate.setHours(0,0,0,0);
    const rota = await StaffShift.findOne({ storeId, staffId: req.params.staffId, weekStartDate: weekDate, merchantId: req.merchantId }).lean();
    if (!rota) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rota });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:shiftId', async (req: Request, res: Response) => {
  try {
    await StaffShift.findOneAndDelete({ _id: req.params.shiftId, merchantId: req.merchantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
