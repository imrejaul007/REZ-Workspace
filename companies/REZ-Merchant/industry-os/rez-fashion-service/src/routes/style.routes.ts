import { Router, Request, Response } from 'express';
import { CustomerStyle } from '../models';
import styleAdvisorService from '../services/styleAdvisor';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createStyleProfileSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/profiles', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, segment } = req.query as any;
  let profiles;
  if (segment) {
    profiles = await CustomerStyle.findBySegment(merchantId, segment);
  } else {
    profiles = await CustomerStyle.find(merchantId ? { merchantId } : {});
  }
  res.json({ success: true, data: profiles, count: profiles.length });
}));

router.get('/profiles/:styleId', asyncHandler(async (req: Request, res: Response) => {
  const profile = await CustomerStyle.findOne({ styleId: req.params.styleId });
  if (!profile) return res.status(404).json({ success: false, error: 'Style profile not found' });
  res.json({ success: true, data: profile });
}));

router.get('/profiles/customer/:customerId', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  const profile = await CustomerStyle.findByCustomer(req.params.customerId, merchantId);
  if (!profile) return res.status(404).json({ success: false, error: 'Style profile not found' });
  res.json({ success: true, data: profile });
}));

router.get('/recommendations/:customerId', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  const recommendations = await styleAdvisorService.getRecommendations(req.params.customerId, merchantId);
  res.json({ success: true, data: recommendations });
}));

router.get('/analyze/:customerId', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  const analysis = await styleAdvisorService.analyzeCustomerStyle(req.params.customerId, merchantId);
  res.json({ success: true, data: analysis });
}));

router.post('/profiles', validate(createStyleProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const profile = await styleAdvisorService.createOrUpdateProfile(req.body.customerId, req.body.merchantId, req.body);
  res.status(201).json({ success: true, data: profile, message: 'Style profile created successfully' });
}));

router.put('/profiles/:styleId', asyncHandler(async (req: Request, res: Response) => {
  const profile = await CustomerStyle.findOne({ styleId: req.params.styleId });
  if (!profile) return res.status(404).json({ success: false, error: 'Style profile not found' });
  Object.assign(profile, req.body);
  await profile.save();
  res.json({ success: true, data: profile, message: 'Style profile updated successfully' });
}));

export default router;