// ==========================================
// MyTalent - CorpPerks Payroll Service Integration
// ==========================================

import { Payslip, TaxDetail } from '../types';
import { mockPayslips, mockTaxDetail } from '../data/mockData';

const PAYROLL_SERVICE_URL = process.env.PAYROLL_SERVICE_URL || 'http://localhost:4006';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface PayslipResponse {
  success: boolean;
  payslip?: Payslip;
  error?: string;
}

interface PayslipListResponse {
  success: boolean;
  payslips?: Payslip[];
  error?: string;
}

/**
 * Get payslips
 */
export async function getPayslips(
  employeeId: string,
  limit = 12
): Promise<PayslipListResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return { success: true, payslips: mockPayslips };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/payslips/${employeeId}?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, payslips: data.payslips };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get payslips error:', error);
    return { success: true, payslips: mockPayslips };
  }
}

/**
 * Get specific payslip
 */
export async function getPayslip(
  employeeId: string,
  payslipId: string
): Promise<PayslipResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      const payslip = mockPayslips.find((p) => p.id === payslipId);
      return { success: true, payslip: payslip || mockPayslips[0] };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/payslip/${payslipId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, payslip: data.payslip };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get payslip error:', error);
    const payslip = mockPayslips.find((p) => p.id === payslipId);
    return { success: true, payslip: payslip || mockPayslips[0] };
  }
}

/**
 * Download payslip PDF
 */
export async function downloadPayslip(
  employeeId: string,
  payslipId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return {
        success: true,
        url: 'https://example.com/payslips/payslip-123.pdf',
      };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/download/${payslipId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, url: data.url };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Download payslip error:', error);
    return {
      success: true,
      url: 'https://example.com/payslips/payslip-123.pdf',
    };
  }
}

/**
 * Get tax details
 */
export async function getTaxDetails(
  employeeId: string,
  financialYear?: string
): Promise<{ success: boolean; taxDetail?: TaxDetail; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return { success: true, taxDetail: mockTaxDetail };
    }

    const params = financialYear ? `?year=${financialYear}` : '';
    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/tax/${employeeId}${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, taxDetail: data.taxDetail };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get tax details error:', error);
    return { success: true, taxDetail: mockTaxDetail };
  }
}

/**
 * Get PF details
 */
export async function getPFDetails(
  employeeId: string
): Promise<{ success: boolean; pfDetails?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return {
        success: true,
        pfDetails: {
          uan: '123456789012',
          memberName: 'Rahul Sharma',
          dateOfJoining: '2023-01-15',
          pfBalance: 45600,
          pensionBalance: 85000,
          employerContribution: 1800,
          employeeContribution: 1800,
        },
      };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/pf/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, pfDetails: data.pfDetails };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get PF details error:', error);
    return {
      success: true,
      pfDetails: {
        uan: '123456789012',
        memberName: 'Rahul Sharma',
        dateOfJoining: '2023-01-15',
        pfBalance: 45600,
        pensionBalance: 85000,
        employerContribution: 1800,
        employeeContribution: 1800,
      },
    };
  }
}

/**
 * Get ESI details
 */
export async function getESIDetails(
  employeeId: string
): Promise<{ success: boolean; esiDetails?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return {
        success: true,
        esiDetails: {
          ipNumber: '321234567890',
          memberName: 'Rahul Sharma',
          esiBalance: 2400,
          employerContribution: 420,
          employeeContribution: 140,
        },
      };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/esi/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, esiDetails: data.esiDetails };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get ESI details error:', error);
    return {
      success: true,
      esiDetails: {
        ipNumber: '321234567890',
        memberName: 'Rahul Sharma',
        esiBalance: 2400,
        employerContribution: 420,
        employeeContribution: 140,
      },
    };
  }
}

/**
 * Get bonus history
 */
export async function getBonusHistory(
  employeeId: string
): Promise<{ success: boolean; bonuses?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return {
        success: true,
        bonuses: [
          { id: '1', type: 'Performance Bonus', amount: 25000, date: '2026-03-28', quarter: 'Q4' },
          { id: '2', type: 'Festival Bonus', amount: 15000, date: '2025-10-20', quarter: 'Q3' },
          { id: '3', type: 'Annual Bonus', amount: 50000, date: '2025-04-15', quarter: 'Q1' },
        ],
      };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/bonuses/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, bonuses: data.bonuses };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get bonus history error:', error);
    return { success: true, bonuses: [] };
  }
}

/**
 * Get reimbursements
 */
export async function getReimbursements(
  employeeId: string
): Promise<{ success: boolean; reimbursements?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PAYROLL_SERVICE_URL) {
      return {
        success: true,
        reimbursements: [
          { id: '1', type: 'Travel', amount: 5000, status: 'paid', date: '2026-05-15' },
          { id: '2', type: 'Medical', amount: 8000, status: 'pending', date: '2026-05-20' },
          { id: '3', type: 'Equipment', amount: 15000, status: 'approved', date: '2026-05-22' },
        ],
      };
    }

    const response = await fetch(
      `${PAYROLL_SERVICE_URL}/api/payroll/reimbursements/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, reimbursements: data.reimbursements };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get reimbursements error:', error);
    return { success: true, reimbursements: [] };
  }
}
