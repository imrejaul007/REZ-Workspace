import { Router, Request, Response } from 'express';
import { investmentService } from '../services/investmentService';
import { successResponse } from '../utils/response';

const router = Router();

// EMI Calculator
router.post('/emi', (req: Request, res: Response) => {
  const { principal, interestRate, tenureMonths } = req.body;
  const result = investmentService.calculateEMI({ principal, interestRate, tenureMonths });
  successResponse(res, result);
});

// ROI Calculator
router.post('/roi', (req: Request, res: Response) => {
  const result = investmentService.calculateROI(req.body);
  successResponse(res, result);
});

// Rental Yield
router.post('/yield', (req: Request, res: Response) => {
  const { purchasePrice, monthlyRent } = req.body;
  const result = investmentService.calculateRentalYield(purchasePrice, monthlyRent);
  successResponse(res, result);
});

// Affordability
router.post('/affordability', (req: Request, res: Response) => {
  const result = investmentService.calculateAffordability(req.body);
  successResponse(res, result);
});

// Compare properties
router.post('/compare', (req: Request, res: Response) => {
  const { properties } = req.body;
  const result = investmentService.compareProperties(properties);
  successResponse(res, result);
});

// Visa eligibility
router.post('/visa-eligibility', (req: Request, res: Response) => {
  const { propertyValue, currency } = req.body;
  const result = investmentService.calculateVisaEligibility(propertyValue, currency);
  successResponse(res, result);
});

export default router;
