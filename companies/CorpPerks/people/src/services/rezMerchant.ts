/**
 * REZ Merchant Integration for MyTalent App
 *
 * Fetches employee benefits and offers from REZ Merchant (nextaBizz)
 * via the CorpPerks-REZ Merchant Bridge Service
 */

const REZ_MERCHANT_BRIDGE_URL = process.env.REZ_MERCHANT_BRIDGE_URL || 'https://rez-merchant-corpperks-bridge.onrender.com';
const API_VERSION = '/api/v1'; // Use v1 API for public endpoints
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpperks-bridge-token';

// Types
export interface Benefit {
  id: string;
  corpPerksId: string;
  name: string;
  description: string;
  type: 'meal_allowance' | 'meal_plan' | 'fuel_allowance' | 'transport' | 'health_insurance' | 'wellness' | 'tax_benefit' | 'corporate_discount' | 'gift_voucher' | 'other';
  value: number;
  currency: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  merchantId?: string;
  category?: string;
  tags: string[];
  icon: string;
}

export interface EmployeeBenefit extends Benefit {
  assignedAt: string;
  expiresAt?: string;
  remainingValue: number;
  totalValue: number;
  usagePercentage: number;
  usageHistory: Array<{
    date: string;
    amount: number;
    merchantOrderId?: string;
    description?: string;
  }>;
}

export interface PartnerOffer {
  id: string;
  brand: string;
  brandIcon: string;
  discount: string;
  discountValue: number;
  description: string;
  expiryDate?: string;
  redemptionCode?: string;
  claimUrl?: string;
  terms?: string;
  category: 'electronics' | 'travel' | 'food' | 'entertainment' | 'health' | 'education' | 'lifestyle';
}

export interface BenefitsSummary {
  totalValue: number;
  healthValue: number;
  financialValue: number;
  wellnessValue: number;
  learningValue: number;
  perksValue: number;
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
    default: '🏪',
  };
  return iconMap[brand.toLowerCase()] || iconMap.default;
}

// API call helper
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${REZ_MERCHANT_BRIDGE_URL}${API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`REZ Merchant API error: ${response.status}`);
  }

  return response.json();
}

// Fetch all benefits for an employee
export async function getEmployeeBenefits(employeeId: string): Promise<EmployeeBenefit[]> {
  try {
    const data = await apiCall<{ success: boolean; data: any[] }>(
      `/benefits/employee/${employeeId}`
    );

    return data.data.map((benefit: any) => ({
      ...benefit,
      icon: getBenefitIcon(benefit.type),
    }));
  } catch (error) {
    logger.error('Failed to fetch benefits:', error);
    return [];
  }
}

// Fetch benefits summary
export async function getBenefitsSummary(employeeId: string): Promise<BenefitsSummary> {
  try {
    const data = await apiCall<BenefitsSummary>(
      `/benefits/summary/${employeeId}`
    );
    return data;
  } catch (error) {
    logger.error('Failed to fetch summary:', error);
    return {
      totalValue: 96000,
      healthValue: 55000,
      financialValue: 30000,
      wellnessValue: 36000,
      learningValue: 54000,
      perksValue: 26400,
    };
  }
}

// Fetch all available offers (from partner network)
export async function getPartnerOffers(): Promise<PartnerOffer[]> {
  try {
    const data = await apiCall<{ success: boolean; data: any[] }>(
      '/offers'
    );

    return data.data.map((offer: any) => ({
      id: offer.id,
      brand: offer.brand,
      brandIcon: getBrandIcon(offer.brand),
      discount: offer.discount,
      discountValue: offer.discountValue,
      description: offer.description,
      expiryDate: offer.expiryDate,
      redemptionCode: offer.redemptionCode,
      claimUrl: offer.claimUrl,
      terms: offer.terms,
      category: offer.category,
    }));
  } catch (error) {
    logger.error('Failed to fetch offers:', error);
    // Return mock data if API unavailable
    return getMockPartnerOffers();
  }
}

// Claim an offer
export async function claimOffer(offerId: string, employeeId: string): Promise<{ success: boolean; code?: string }> {
  try {
    const data = await apiCall<{ success: boolean; code?: string }>(
      '/offers/claim',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId, employeeId }),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to claim offer:', error);
    return { success: false };
  }
}

// Get benefit categories
export function getBenefitsByCategory(benefits: EmployeeBenefit[]): Record<string, EmployeeBenefit[]> {
  const categories: Record<string, EmployeeBenefit[]> = {
    health: [],
    financial: [],
    wellness: [],
    learning: [],
    perks: [],
  };

  benefits.forEach((benefit) => {
    if (benefit.type === 'health_insurance') {
      categories.health.push(benefit);
    } else if (['fuel_allowance', 'transport', 'tax_benefit'].includes(benefit.type)) {
      categories.financial.push(benefit);
    } else if (benefit.type === 'wellness') {
      categories.wellness.push(benefit);
    } else if (['meal_allowance', 'meal_plan', 'gift_voucher', 'corporate_discount'].includes(benefit.type)) {
      categories.perks.push(benefit);
    } else {
      categories.perks.push(benefit);
    }
  });

  return categories;
}

// Mock data for development/offline mode
export function getMockPartnerOffers(): PartnerOffer[] {
  return [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
      brand: 'Amazon',
      brandIcon: '📦',
      discount: 'Free Prime 1 year',
      discountValue: 100,
      description: 'Complimentary Amazon Prime subscription',
      expiryDate: undefined,
      category: 'entertainment',
    },
    {
      id: '4',
      brand: 'Spotify',
      brandIcon: '🎵',
      discount: '50% off Premium',
      discountValue: 50,
      description: 'Half price on Spotify Premium annual plan',
      expiryDate: undefined,
      category: 'entertainment',
    },
    {
      id: '5',
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
      id: '6',
      brand: 'Swiggy',
      brandIcon: '🍔',
      discount: 'Free delivery',
      discountValue: 100,
      description: 'Unlimited free deliveries for 30 days',
      expiryDate: '2026-06-30',
      category: 'food',
    },
    {
      id: '7',
      brand: 'Netflix',
      brandIcon: '🎬',
      discount: '30% off',
      discountValue: 30,
      description: 'Employee discount on Netflix plans',
      expiryDate: undefined,
      category: 'entertainment',
    },
    {
      id: '8',
      brand: 'Coursera',
      brandIcon: '🎓',
      discount: '1 month free',
      discountValue: 100,
      description: 'Free month on Coursera Plus subscription',
      expiryDate: '2026-12-31',
      category: 'education',
    },
  ];
}

// Mock benefits for development/offline mode
export function getMockBenefits(): EmployeeBenefit[] {
  return [
    {
      id: '1',
      corpPerksId: 'BEN001',
      name: 'Health Insurance',
      description: 'Comprehensive medical coverage for you and family',
      type: 'health_insurance',
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
      id: '2',
      corpPerksId: 'BEN002',
      name: 'Dental & Vision',
      description: 'Dental checkups and eye care coverage',
      type: 'health_insurance',
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
      id: '3',
      corpPerksId: 'BEN003',
      name: 'Gym Membership',
      description: 'Access to 5000+ gyms nationwide via FitPass',
      type: 'wellness',
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
      id: '4',
      corpPerksId: 'BEN004',
      name: 'Mental Wellness',
      description: '24/7 counseling & therapy sessions via YourDOST',
      type: 'wellness',
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
      id: '5',
      corpPerksId: 'BEN005',
      name: 'Phone Allowance',
      description: 'Monthly mobile and data reimbursement',
      type: 'other',
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
      id: '6',
      corpPerksId: 'BEN006',
      name: 'Meal Card',
      description: 'Sodexo meal coupons for lunch',
      type: 'meal_allowance',
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
      id: '7',
      corpPerksId: 'BEN007',
      name: 'Fuel Allowance',
      description: 'Petrol/diesel reimbursement',
      type: 'fuel_allowance',
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
      id: '8',
      corpPerksId: 'BEN008',
      name: 'Learning Budget',
      description: 'Coursera & LinkedIn Learning subscriptions',
      type: 'other',
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
      id: '9',
      corpPerksId: 'BEN009',
      name: 'Book Allowance',
      description: 'Books and professional reading material',
      type: 'other',
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
      id: '10',
      corpPerksId: 'BEN010',
      name: 'Festival Bonus',
      description: 'Additional bonus during Diwali',
      type: 'tax_benefit',
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
}
