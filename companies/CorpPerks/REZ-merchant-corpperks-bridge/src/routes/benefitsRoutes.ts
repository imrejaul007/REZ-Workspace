/**
 * Benefits Routes
 *
 * API endpoints for employee benefits and partner offers
 */

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { BenefitModel, EmployeeBenefitModel } from '../models/benefit.model';
import { Benefit, EmployeeBenefit, BenefitType } from '../types';

const router = Router();

// Error handler wrapper
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Helper to get icon based on benefit type
function getBenefitIcon(type: string): string {
  const iconMap: Record<string, string> = {
    health_insurance: '🏥',
    meal_allowance: '🍽️',
    meal_plan: '🍽️',
    fuel_allowance: '⛽',
    transport: '🚌',
    wellness: '🧘',
    tax_benefit: '📋',
    corporate_discount: '🏷️',
    gift_voucher: '🎁',
    other: '📦',
  };
  return iconMap[type] || '📦';
}

// Helper to get icon based on brand
function getBrandIcon(brand: string): string {
  const iconMap: Record<string, string> = {
    apple: '🍎',
    samsung: '📺',
    amazon: '📦',
    spotify: '🎵',
    uber: '🚗',
    ola: '🚕',
    swiggy: '🍔',
    zomato: '🍕',
    netflix: '🎬',
    prime: '▶️',
    coursera: '🎓',
    default: '🏪',
  };
  return iconMap[brand.toLowerCase()] || iconMap.default;
}

// Mock partner offers (in production, these would come from a database or external API)
const mockPartnerOffers = [
  {
    id: 'offer-1',
    brand: 'Apple',
    brandIcon: '🍎',
    discount: '15% off MacBooks',
    discountValue: 15,
    description: 'Exclusive employee discount on MacBooks and iPads',
    expiryDate: '2026-06-30',
    category: 'electronics',
    terms: 'Valid on select MacBook models. Max discount ₹25,000.',
  },
  {
    id: 'offer-2',
    brand: 'Samsung',
    brandIcon: '📺',
    discount: '20% off TVs',
    discountValue: 20,
    description: 'Corporate discount on Samsung Smart TVs',
    expiryDate: '2026-05-31',
    category: 'electronics',
    terms: 'Valid on 2026 models only.',
  },
  {
    id: 'offer-3',
    brand: 'Amazon',
    brandIcon: '📦',
    discount: 'Free Prime 1 year',
    discountValue: 100,
    description: 'Complimentary Amazon Prime subscription',
    expiryDate: undefined,
    category: 'entertainment',
  },
  {
    id: 'offer-4',
    brand: 'Spotify',
    brandIcon: '🎵',
    discount: '50% off Premium',
    discountValue: 50,
    description: 'Half price on Spotify Premium annual plan',
    expiryDate: undefined,
    category: 'entertainment',
  },
  {
    id: 'offer-5',
    brand: 'Uber',
    brandIcon: '🚗',
    discount: '₹200 off first 5 rides',
    discountValue: 200,
    description: '₹200 off on each of your first 5 Uber rides',
    expiryDate: '2026-06-15',
    category: 'travel',
    terms: 'Valid for new Uber users only.',
  },
  {
    id: 'offer-6',
    brand: 'Swiggy',
    brandIcon: '🍔',
    discount: 'Free delivery',
    discountValue: 100,
    description: 'Unlimited free deliveries for 30 days',
    expiryDate: '2026-06-30',
    category: 'food',
  },
  {
    id: 'offer-7',
    brand: 'Netflix',
    brandIcon: '🎬',
    discount: '30% off',
    discountValue: 30,
    description: 'Employee discount on Netflix plans',
    expiryDate: undefined,
    category: 'entertainment',
  },
  {
    id: 'offer-8',
    brand: 'Coursera',
    brandIcon: '🎓',
    discount: '1 month free',
    discountValue: 100,
    description: 'Free month on Coursera Plus subscription',
    expiryDate: '2026-12-31',
    category: 'education',
  },
];

// Mock employee benefits (in production, these would come from MongoDB)
const mockEmployeeBenefits = [
  {
    id: 'eb-1',
    corpPerksId: 'BEN001',
    name: 'Health Insurance',
    description: 'Comprehensive medical coverage for you and family',
    type: 'health_insurance' as BenefitType,
    value: 500000,
    currency: 'INR',
    isActive: true,
    tags: ['health', 'insurance'],
    icon: '🏥',
    assignedAt: '2026-01-01',
    remainingValue: 500000,
    totalValue: 500000,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-2',
    corpPerksId: 'BEN002',
    name: 'Dental & Vision',
    description: 'Dental checkups and eye care coverage',
    type: 'health_insurance' as BenefitType,
    value: 50000,
    currency: 'INR',
    isActive: true,
    tags: ['health', 'dental'],
    icon: '👁️',
    assignedAt: '2026-01-01',
    remainingValue: 50000,
    totalValue: 50000,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-3',
    corpPerksId: 'BEN003',
    name: 'Gym Membership',
    description: 'Access to 5000+ gyms nationwide via FitPass',
    type: 'wellness' as BenefitType,
    value: 2500,
    currency: 'INR',
    isActive: true,
    merchantId: 'FITPASS001',
    tags: ['wellness', 'fitness'],
    icon: '💪',
    assignedAt: '2026-01-01',
    remainingValue: 1500,
    totalValue: 2500,
    usagePercentage: 40,
    usageHistory: [{ date: '2026-05-01', amount: 1000, description: 'Monthly gym subscription' }],
  },
  {
    id: 'eb-4',
    corpPerksId: 'BEN004',
    name: 'Mental Wellness',
    description: '24/7 counseling & therapy sessions via YourDOST',
    type: 'wellness' as BenefitType,
    value: 10000,
    currency: 'INR',
    isActive: true,
    merchantId: 'YOUDOST001',
    tags: ['wellness', 'mental-health'],
    icon: '🧠',
    assignedAt: '2026-01-01',
    remainingValue: 10000,
    totalValue: 10000,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-5',
    corpPerksId: 'BEN005',
    name: 'Phone Allowance',
    description: 'Monthly mobile and data reimbursement',
    type: 'other' as BenefitType,
    value: 1500,
    currency: 'INR',
    isActive: true,
    tags: ['allowance', 'communication'],
    icon: '📱',
    assignedAt: '2026-01-01',
    remainingValue: 1500,
    totalValue: 1500,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-6',
    corpPerksId: 'BEN006',
    name: 'Meal Card',
    description: 'Sodexo meal coupons for lunch',
    type: 'meal_allowance' as BenefitType,
    value: 2200,
    currency: 'INR',
    isActive: true,
    merchantId: 'SODEXO001',
    tags: ['food', 'meal'],
    icon: '🍽️',
    assignedAt: '2026-01-01',
    remainingValue: 1100,
    totalValue: 2200,
    usagePercentage: 50,
    usageHistory: [{ date: '2026-05-20', amount: 1100, description: 'Meal coupons used' }],
  },
  {
    id: 'eb-7',
    corpPerksId: 'BEN007',
    name: 'Fuel Allowance',
    description: 'Petrol/diesel reimbursement',
    type: 'fuel_allowance' as BenefitType,
    value: 1000,
    currency: 'INR',
    isActive: true,
    tags: ['allowance', 'fuel'],
    icon: '⛽',
    assignedAt: '2026-01-01',
    remainingValue: 600,
    totalValue: 1000,
    usagePercentage: 40,
    usageHistory: [{ date: '2026-05-15', amount: 400, description: 'Fuel reimbursement' }],
  },
  {
    id: 'eb-8',
    corpPerksId: 'BEN008',
    name: 'Learning Budget',
    description: 'Coursera & LinkedIn Learning subscriptions',
    type: 'other' as BenefitType,
    value: 40000,
    currency: 'INR',
    isActive: true,
    merchantId: 'COURSERA001',
    tags: ['learning', 'education'],
    icon: '🎓',
    assignedAt: '2026-01-01',
    remainingValue: 40000,
    totalValue: 40000,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-9',
    corpPerksId: 'BEN009',
    name: 'Book Allowance',
    description: 'Books and professional reading material',
    type: 'other' as BenefitType,
    value: 500,
    currency: 'INR',
    isActive: true,
    tags: ['learning', 'books'],
    icon: '📚',
    assignedAt: '2026-01-01',
    remainingValue: 500,
    totalValue: 500,
    usagePercentage: 0,
    usageHistory: [],
  },
  {
    id: 'eb-10',
    corpPerksId: 'BEN010',
    name: 'Festival Bonus',
    description: 'Additional bonus during Diwali',
    type: 'tax_benefit' as BenefitType,
    value: 50000,
    currency: 'INR',
    validFrom: '2026-09-01',
    validTo: '2026-10-31',
    isActive: true,
    tags: ['bonus', 'festival'],
    icon: '🎉',
    assignedAt: '2026-01-01',
    remainingValue: 50000,
    totalValue: 50000,
    usagePercentage: 0,
    usageHistory: [],
  },
];

/**
 * GET /api/benefits/employee/:employeeId
 * Get all benefits for an employee
 */
router.get(
  '/employee/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    try {
      // Try to fetch from MongoDB first
      const dbBenefits = await EmployeeBenefitModel.findWithBenefitDetails(employeeId);

      if (dbBenefits.length > 0) {
        const benefits = dbBenefits.map((eb: any) => ({
          id: eb._id.toString(),
          corpPerksId: eb.benefit.corpPerksId,
          name: eb.benefit.name,
          description: eb.benefit.description,
          type: eb.benefit.type,
          value: eb.benefit.value,
          currency: eb.benefit.currency,
          validFrom: eb.benefit.validFrom,
          validTo: eb.benefit.validTo,
          isActive: eb.benefit.isActive,
          merchantId: eb.benefit.merchantId,
          category: eb.benefit.category,
          tags: eb.benefit.tags,
          icon: getBenefitIcon(eb.benefit.type),
          assignedAt: eb.assignedAt.toISOString(),
          expiresAt: eb.expiresAt?.toISOString(),
          remainingValue: eb.remainingValue,
          totalValue: eb.totalValue,
          usagePercentage: eb.usagePercentage,
          usageHistory: eb.usageHistory.map((h: any) => ({
            date: h.date.toISOString(),
            amount: h.amount,
            merchantOrderId: h.merchantOrderId,
            description: h.description,
          })),
        }));

        return res.status(200).json({
          success: true,
          data: benefits,
        });
      }

      // Fallback to mock data for development
      return res.status(200).json({
        success: true,
        data: mockEmployeeBenefits.map(b => ({
          ...b,
          expiresAt: b.validTo,
        })),
      });
    } catch (error) {
      // Fallback to mock data on error
      logger.error('Error fetching benefits:', error);
      return res.status(200).json({
        success: true,
        data: mockEmployeeBenefits.map(b => ({
          ...b,
          expiresAt: b.validTo,
        })),
      });
    }
  })
);

/**
 * GET /api/benefits/summary/:employeeId
 * Get benefits summary for an employee
 */
router.get(
  '/summary/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    try {
      const dbBenefits = await EmployeeBenefitModel.findWithBenefitDetails(employeeId);

      if (dbBenefits.length > 0) {
        const summary = {
          totalValue: 0,
          healthValue: 0,
          financialValue: 0,
          wellnessValue: 0,
          learningValue: 0,
          perksValue: 0,
        };

        dbBenefits.forEach((eb: any) => {
          summary.totalValue += eb.totalValue;

          if (eb.benefit.type === 'health_insurance') {
            summary.healthValue += eb.totalValue;
          } else if (['fuel_allowance', 'transport', 'tax_benefit'].includes(eb.benefit.type)) {
            summary.financialValue += eb.totalValue;
          } else if (eb.benefit.type === 'wellness') {
            summary.wellnessValue += eb.totalValue;
          } else {
            summary.perksValue += eb.totalValue;
          }
        });

        return res.status(200).json(summary);
      }

      // Mock summary
      return res.status(200).json({
        totalValue: 96000,
        healthValue: 55000,
        financialValue: 30000,
        wellnessValue: 36000,
        learningValue: 54000,
        perksValue: 26400,
      });
    } catch (error) {
      logger.error('Error fetching summary:', error);
      return res.status(200).json({
        totalValue: 96000,
        healthValue: 55000,
        financialValue: 30000,
        wellnessValue: 36000,
        learningValue: 54000,
        perksValue: 26400,
      });
    }
  })
);

/**
 * GET /api/offers
 * Get all partner offers
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // In production, fetch from database or external API
      // For now, return mock offers
      return res.status(200).json({
        success: true,
        data: mockPartnerOffers,
      });
    } catch (error) {
      logger.error('Error fetching offers:', error);
      return res.status(200).json({
        success: true,
        data: mockPartnerOffers,
      });
    }
  })
);

/**
 * POST /api/offers/claim
 * Claim an offer for an employee
 */
router.post(
  '/claim',
  asyncHandler(async (req: Request, res: Response) => {
    const { offerId, employeeId } = req.body;

    if (!offerId || !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'offerId and employeeId are required',
      });
    }

    const offer = mockPartnerOffers.find(o => o.id === offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
    }

    // Generate a mock redemption code
    const redemptionCode = `REZ-${Date.now().toString(36).toUpperCase()}-${randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      code: redemptionCode,
      offer: {
        brand: offer.brand,
        discount: offer.discount,
      },
    });
  })
);

/**
 * GET /api/offers/:category
 * Get offers by category
 */
router.get(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;

    const filteredOffers = mockPartnerOffers.filter(o => o.category === category);

    return res.status(200).json({
      success: true,
      data: filteredOffers,
    });
  })
);

export default router;
