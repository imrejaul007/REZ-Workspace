import { Router, Request, Response } from 'express';
import { Alert, AlertRule } from '../models/Alert';

const router = Router();

// Alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { merchantId, type, severity, resolved } = req.query;
    const query: Record<string, any> = {};
    if (merchantId) query.merchantId = merchantId;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query)
      .populate('productId', 'name sku')
      .sort({ severity: 1, createdAt: -1 });
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch alerts' } });
  }
});

router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('productId');
    if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch alert' } });
  }
});

router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.patch('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.patch('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedBy: userId, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Rules
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const { merchantId, isActive } = req.query;
    const query: Record<string, any> = {};
    if (merchantId) query.merchantId = merchantId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await AlertRule.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: rules, count: rules.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch rules' } });
  }
});

router.post('/rules', async (req: Request, res: Response) => {
  try {
    const rule = await AlertRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const rule = await AlertRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    await AlertRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Stats
router.get('/stats/:merchantId', async (req: Request, res: Response) => {
  try {
    const { unresolved, critical } = await Promise.all([
      Alert.countDocuments({ merchantId: req.params.merchantId, resolved: false }),
      Alert.countDocuments({ merchantId: req.params.merchantId, severity: 'critical', resolved: false }),
    ]);

    const byType = await Alert.aggregate([
      { $match: { merchantId: require('mongoose').Types.ObjectId.createFromHexString(req.params.merchantId), resolved: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: { unresolved, critical, byType: Object.fromEntries(byType.map(t => [t._id, t.count])) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats' } });
  }
});

export default router;
