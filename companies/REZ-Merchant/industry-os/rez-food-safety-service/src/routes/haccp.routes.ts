/**
 * HACCP Checklist Routes
 */

import { Router, Request, Response } from 'express';
import { HACCPCheck } from '../models';

const router = Router();

const HACCP_CHECKLISTS = {
  daily_kitchen: [
    'Refrigerator temperature logged',
    'Freezer temperature logged',
    'Hot holding temperature logged',
    'Handwashing stations supplied',
    'Sanitizer concentration correct',
    'Food contact surfaces sanitized',
    'Pest control check',
    'Waste disposed properly',
  ],
  food_receiving: [
    'Temperature of incoming food',
    'Packaging intact',
    'Expiry dates verified',
    'FSSAI license visible',
    'Vehicle cleanliness',
    'Documents complete',
  ],
  storage: [
    'Raw meat below cooked',
    'FIFO rotation followed',
    'Containers labeled',
    'Dry storage clean',
    'No cross-contamination',
  ],
};

router.get('/templates', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(HACCP_CHECKLISTS).map(([id, items]) => ({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      items,
    })),
  });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, restaurantId, checklistId, checklistName, checkType, checklistItems, checkedBy } = req.body;
    const failedItems = checklistItems.filter((i) => i.status === 'non-compliant');
    const overallStatus = failedItems.length === 0 ? 'passed' : failedItems.length < 3 ? 'partial' : 'failed';
    const check = new HACCPCheck({
      merchantId,
      restaurantId,
      checklistId,
      checklistName,
      checkType: checkType || 'general',
      checklistItems,
      checkedBy,
      overallStatus,
    });
    await check.save();
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit check' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, checkType, startDate, endDate } = req.query;
    const query: unknown = {};
    if (restaurantId) query.restaurantId = restaurantId;
    if (checkType) query.checkType = checkType;
    if (startDate && endDate) {
      query.checkedAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    const checks = await HACCPCheck.find(query).sort({ checkedAt: -1 });
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch checks' });
  }
});

router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const { restaurantId, period } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (Number(period) || 30));
    const checks = await HACCPCheck.find({ restaurantId, checkedAt: { $gte: startDate } });
    const total = checks.length;
    const passed = checks.filter(c => c.overallStatus === 'passed').length;
    const compliance = total > 0 ? (passed / total) * 100 : 100;
    res.json({ success: true, data: { totalChecks: total, passed, complianceScore: Math.round(compliance) } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate compliance' });
  }
});

router.post('/:checkId/approve', async (req: Request, res: Response) => {
  try {
    const { supervisorApproval } = req.body;
    const check = await HACCPCheck.findByIdAndUpdate(
      req.params.checkId,
      { supervisorApproval, approvedAt: new Date() },
      { new: true }
    );
    if (!check) {
      res.status(404).json({ success: false, error: 'Check not found' });
      return;
    }
    res.json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve' });
  }
});

export { router as haccpRoutes };
