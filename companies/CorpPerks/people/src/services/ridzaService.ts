// ==========================================
// MyTalent - RidZa Integration
// Financial Health & Salary Advance
// ==========================================

import { FinancialHealth, SalaryAdvance, CreditCard, LoanOffer } from '../types';
import { mockFinancialHealth, mockSalaryAdvances } from '../data/mockData';

const RIDZA_SERVICE_URL = process.env.RIDZA_SERVICE_URL || 'http://localhost:4503';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface FinancialHealthResponse {
  success: boolean;
  health?: FinancialHealth;
  error?: string;
}

interface SalaryAdvanceResponse {
  success: boolean;
  advance?: SalaryAdvance;
  error?: string;
}

/**
 * Get financial health score
 */
export async function getFinancialHealth(
  employeeId: string
): Promise<FinancialHealthResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      return { success: true, health: mockFinancialHealth };
    }

    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/financial-health/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, health: data.health };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get financial health error:', error);
    return { success: true, health: mockFinancialHealth };
  }
}

/**
 * Get salary advance eligibility
 */
export async function getSalaryAdvanceEligibility(
  employeeId: string
): Promise<{ success: boolean; eligible?: boolean; maxAmount?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      return { success: true, eligible: true, maxAmount: 50000 };
    }

    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/salary-advance/eligibility/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        eligible: data.eligible,
        maxAmount: data.maxAmount,
      };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get salary advance eligibility error:', error);
    return { success: true, eligible: true, maxAmount: 50000 };
  }
}

/**
 * Apply for salary advance
 */
export async function applySalaryAdvance(
  employeeId: string,
  amount: number,
  repaymentMonths: number = 3
): Promise<SalaryAdvanceResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      const advance: SalaryAdvance = {
        id: `adv-${Date.now()}`,
        amount,
        requestedOn: new Date().toISOString(),
        status: 'pending',
        repaymentDate: new Date(Date.now() + repaymentMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      return { success: true, advance };
    }

    const response = await fetch(`${RIDZA_SERVICE_URL}/api/salary-advance/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, amount, repaymentMonths }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, advance: data.advance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Apply salary advance error:', error);
    return { success: true, advance: null };
  }
}

/**
 * Get salary advance history
 */
export async function getSalaryAdvanceHistory(
  employeeId: string
): Promise<{ success: boolean; advances?: SalaryAdvance[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      return { success: true, advances: mockSalaryAdvances };
    }

    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/salary-advance/history/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, advances: data.advances };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get salary advance history error:', error);
    return { success: true, advances: mockSalaryAdvances };
  }
}

/**
 * Get recommended credit cards
 */
export async function getRecommendedCreditCards(
  employeeId: string
): Promise<{ success: boolean; cards?: CreditCard[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      return {
        success: true,
        cards: [
          {
            id: 'card-1',
            name: 'RidZa Cashback',
            bank: 'RidZa Bank',
            annualFee: 0,
            cashbackRate: 5,
            rewardRate: 2,
            features: ['5% cashback on dining', '2% on shopping', '1% on all'],
            eligibility: 'Salary > 25,000',
            applyUrl: 'https://ridza.example.com/apply',
          },
          {
            id: 'card-2',
            name: 'RidZa Platinum',
            bank: 'RidZa Bank',
            annualFee: 999,
            cashbackRate: 10,
            rewardRate: 5,
            features: ['10% cashback on travel', '5% on dining', 'Complimentary lounge'],
            eligibility: 'Salary > 50,000',
            applyUrl: 'https://ridza.example.com/apply',
          },
        ],
      };
    }

    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/credit-cards/recommended/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, cards: data.cards };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get credit cards error:', error);
    return { success: true, cards: [] };
  }
}

/**
 * Get loan offers
 */
export async function getLoanOffers(
  type?: string
): Promise<{ success: boolean; loans?: LoanOffer[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      const loans: LoanOffer[] = [
        {
          id: 'loan-1',
          type: 'personal',
          name: 'Personal Loan',
          minAmount: 50000,
          maxAmount: 500000,
          minTenure: 12,
          maxTenure: 60,
          interestRate: 10.5,
          processingFee: 1,
          features: ['Quick approval', 'No collateral', 'Flexible tenure'],
          eligibility: 'Salary > 20,000',
          applyUrl: 'https://ridza.example.com/apply',
        },
        {
          id: 'loan-2',
          type: 'salary-based',
          name: 'Salary Advance Loan',
          minAmount: 10000,
          maxAmount: 200000,
          minTenure: 3,
          maxTenure: 12,
          interestRate: 8.5,
          processingFee: 0.5,
          features: ['Low interest', 'Instant disbursement', 'Salary deduction'],
          eligibility: 'Completed 6 months',
          applyUrl: 'https://ridza.example.com/apply',
        },
        {
          id: 'loan-3',
          type: 'home',
          name: 'Home Loan',
          minAmount: 500000,
          maxAmount: 10000000,
          minTenure: 60,
          maxTenure: 300,
          interestRate: 6.5,
          processingFee: 0.5,
          features: ['Low EMI', 'Tax benefits', 'Flexible repayment'],
          eligibility: 'Property documents required',
          applyUrl: 'https://ridza.example.com/apply',
        },
        {
          id: 'loan-4',
          type: 'education',
          name: 'Education Loan',
          minAmount: 100000,
          maxAmount: 3000000,
          minTenure: 12,
          maxTenure: 84,
          interestRate: 9,
          processingFee: 0.5,
          features: ['Moratorium period', 'Tax benefits', 'Low interest'],
          eligibility: 'Admission letter required',
          applyUrl: 'https://ridza.example.com/apply',
        },
      ];

      if (type) {
        return { success: true, loans: loans.filter((l) => l.type === type) };
      }

      return { success: true, loans };
    }

    const params = type ? `?type=${type}` : '';
    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/loans${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, loans: data.loans };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get loan offers error:', error);
    return { success: true, loans: [] };
  }
}

/**
 * Get insurance products
 */
export async function getInsuranceProducts(
  type?: string
): Promise<{ success: boolean; products?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RIDZA_SERVICE_URL) {
      return {
        success: true,
        products: [
          {
            id: 'ins-1',
            type: 'health',
            name: 'Comprehensive Health Cover',
            provider: 'RidZa Insurance',
            coverage: 500000,
            premium: 500,
            features: ['Cashless hospitalization', 'No medical test', 'Family cover'],
          },
          {
            id: 'ins-2',
            type: 'term',
            name: 'Term Life Insurance',
            provider: 'RidZa Insurance',
            coverage: 5000000,
            premium: 300,
            features: ['High cover', 'Low premium', 'Tax benefits'],
          },
        ],
      };
    }

    const params = type ? `?type=${type}` : '';
    const response = await fetch(
      `${RIDZA_SERVICE_URL}/api/insurance${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, products: data.products };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get insurance products error:', error);
    return { success: true, products: [] };
  }
}
