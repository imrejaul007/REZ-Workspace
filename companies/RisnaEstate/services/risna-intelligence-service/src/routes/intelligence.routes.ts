import { Router, Request, Response, NextFunction } from 'express';
import { intelligenceService } from '../services/intelligenceService';
import { successResponse } from '../utils/response';

const router = Router();

// Analyze a lead
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.body;
    const scores = intelligenceService.analyzeLead(profile);
    const segment = intelligenceService.classifyLead(scores);
    successResponse(res, { ...scores, segment });
  } catch (err) { next(err); }
});

// NRI probability check
router.post('/nri-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, email, interestedCountries, source } = req.body;
    const score = intelligenceService.calculateNRIProbability({ phone, email, interestedCountries, source });
    successResponse(res, { nriProbability: score, tier: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low' });
  } catch (err) { next(err); }
});

// HNI score check
router.post('/hni-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.body;
    const score = intelligenceService.calculateHNIScore(profile);
    successResponse(res, { hniScore: score, tier: score >= 70 ? 'vip' : score >= 50 ? 'premium' : 'standard' });
  } catch (err) { next(err); }
});

// Investor score check
router.post('/investor-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.body;
    const score = intelligenceService.calculateInvestorScore(profile);
    successResponse(res, { investorScore: score, tier: score >= 70 ? 'active' : score >= 40 ? 'passive' : 'casual' });
  } catch (err) { next(err); }
});

// Visa probability
router.post('/visa-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.body;
    const score = intelligenceService.calculateVisaProbability(profile);
    successResponse(res, { visaProbability: score, eligible: score >= 60 });
  } catch (err) { next(err); }
});

// Budget analysis
router.post('/budget-analysis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { budget, propertyTypes } = req.body;
    const affordability = intelligenceService.calculateAffordabilityScore({ budget } as any);
    const hni = intelligenceService.calculateHNIScore({ budget, propertyTypes } as any);
    successResponse(res, { affordabilityScore: affordability, hniScore: hni });
  } catch (err) { next(err); }
});

export default router;
