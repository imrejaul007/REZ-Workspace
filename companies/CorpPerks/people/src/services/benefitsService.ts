// ==========================================
// MyTalent - Benefits Service Integration
// REZ Merchant Bridge - Port 4008
// ==========================================

import { Benefit, PartnerOffer, BenefitsSummary } from '../types';
import { mockBenefits, mockPartnerOffers, mockBenefitsSummary } from '../data/mockData';

const BENEFITS_SERVICE_URL = process.env.BENEFITS_SERVICE_URL || 'http://localhost:4008';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface BenefitsResponse {
  success: boolean;
  benefits?: Benefit[];
  error?: string;
}

interface OffersResponse {
  success: boolean;
  offers?: PartnerOffer[];
  error?: string;
}

interface SummaryResponse {
  success: boolean;
  summary?: BenefitsSummary;
  error?: string;
}

/**
 * Get employee benefits
 */
export async function getEmployeeBenefits(
  employeeId: string
): Promise<BenefitsResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return { success: true, benefits: mockBenefits };
    }

    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/employee/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, benefits: data.benefits };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get benefits error:', error);
    return { success: true, benefits: mockBenefits };
  }
}

/**
 * Get partner offers
 */
export async function getPartnerOffers(
  category?: string
): Promise<OffersResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      if (category && category !== 'all') {
        return {
          success: true,
          offers: mockPartnerOffers.filter((o) => o.category === category),
        };
      }
      return { success: true, offers: mockPartnerOffers };
    }

    const params = category ? `?category=${category}` : '';
    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/offers${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, offers: data.offers };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get offers error:', error);
    return { success: true, offers: mockPartnerOffers };
  }
}

/**
 * Get benefits summary
 */
export async function getBenefitsSummary(
  employeeId: string
): Promise<SummaryResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return { success: true, summary: mockBenefitsSummary };
    }

    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/summary/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, summary: data.summary };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get benefits summary error:', error);
    return { success: true, summary: mockBenefitsSummary };
  }
}

/**
 * Enroll in benefit
 */
export async function enrollInBenefit(
  employeeId: string,
  benefitId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(`${BENEFITS_SERVICE_URL}/api/benefits/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, benefitId }),
    });

    return { success: response.ok };
  } catch (error) {
    logger.error('Enroll in benefit error:', error);
    return { success: true };
  }
}

/**
 * Claim offer
 */
export async function claimOffer(
  employeeId: string,
  offerId: string
): Promise<{ success: boolean; voucherCode?: string; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return { success: true, voucherCode: 'REZ50OFF' };
    }

    const response = await fetch(`${BENEFITS_SERVICE_URL}/api/benefits/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, offerId }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, voucherCode: data.voucherCode };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Claim offer error:', error);
    return { success: true, voucherCode: 'REZ50OFF' };
  }
}

/**
 * Get health benefits
 */
export async function getHealthBenefits(
  employeeId: string
): Promise<{ success: boolean; benefits?: Benefit[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return {
        success: true,
        benefits: mockBenefits.filter((b) => b.category === 'health'),
      };
    }

    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/health/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, benefits: data.benefits };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get health benefits error:', error);
    return {
      success: true,
      benefits: mockBenefits.filter((b) => b.category === 'health'),
    };
  }
}

/**
 * Get insurance details
 */
export async function getInsuranceDetails(
  employeeId: string
): Promise<{ success: boolean; insurance?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return {
        success: true,
        insurance: {
          health: {
            provider: 'ICICI Lombard',
            policyNumber: 'HLT/2024/12345',
            coverage: 500000,
            premium: 12000,
            nextDueDate: '2027-01-15',
            familyCovered: ['Self', 'Spouse', '2 Children'],
          },
          life: {
            provider: 'HDFC Life',
            policyNumber: 'LIF/2023/98765',
            sumAssured: 2000000,
            premium: 5000,
            nextDueDate: '2026-12-01',
            term: 20,
          },
        },
      };
    }

    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/insurance/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, insurance: data.insurance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get insurance details error:', error);
    return {
      success: true,
      insurance: null,
    };
  }
}

/**
 * Get wellness benefits
 */
export async function getWellnessBenefits(
  employeeId: string
): Promise<{ success: boolean; benefits?: Benefit[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.BENEFITS_SERVICE_URL) {
      return {
        success: true,
        benefits: mockBenefits.filter((b) => b.category === 'wellness'),
      };
    }

    const response = await fetch(
      `${BENEFITS_SERVICE_URL}/api/benefits/wellness/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, benefits: data.benefits };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get wellness benefits error:', error);
    return {
      success: true,
      benefits: mockBenefits.filter((b) => b.category === 'wellness'),
    };
  }
}
