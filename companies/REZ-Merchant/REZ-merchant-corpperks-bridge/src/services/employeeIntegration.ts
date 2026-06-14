/**
 * Employee Integration Service
 *
 * Connects CorpPerks HR data to REZ Merchant
 * Enables corporate discounts, expense tracking, and employee benefits
 */

import axios from 'axios';

const CORPPERKS_API = process.env.CORPPERKS_API_URL || 'https://corpperks.onrender.com/api';
const MERCHANT_SERVICE = process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';
const WALLET_SERVICE = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export interface Employee {
  employeeId: string;
  email: string;
  companyId: string;
  department?: string;
  designation?: string;
  corporateTier: 'standard' | 'premium' | 'enterprise';
}

export interface CorporateDiscount {
  companyId: string;
  discountPercent: number;
  maxDiscount: number;
  categories: string[];
}

export interface CorporateAllowance {
  total: number;
  used: number;
  remaining: number;
}

export interface CorporateExpense {
  employeeId: string;
  companyId: string;
  amount: number;
  category: string;
  merchantId: string;
  orderId: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DiscountApplication {
  discount: number;
  companyId: string;
  originalTotal: number;
  finalTotal: number;
}

// Employee validation and sync
export async function validateEmployee(token: string): Promise<Employee | null> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/employee/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.employee;
  } catch {
    return null;
  }
}

export async function syncEmployee(companyId: string, employee: Employee): Promise<void> {
  // Create/update merchant customer with employee data
  await axios.post(`${MERCHANT_SERVICE}/api/v1/customers/corporate-sync`, {
    companyId,
    employeeId: employee.employeeId,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
    tier: employee.corporateTier
  }, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN }
  });
}

// Corporate discount validation
export async function getCorporateDiscount(
  companyId: string,
  category: string
): Promise<CorporateDiscount | null> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/discounts/${companyId}`, {
      params: { category }
    });
    return response.data.discount;
  } catch {
    return null;
  }
}

export async function applyCorporateDiscount(
  customerId: string,
  cartTotal: number,
  category: string
): Promise<{ discount: number; companyId: string } | null> {
  const discount = await getCorporateDiscount(customerId, category);
  if (!discount) return null;

  const discountAmount = Math.min(
    cartTotal * (discount.discountPercent / 100),
    discount.maxDiscount
  );

  return {
    discount: Math.round(discountAmount),
    companyId: discount.companyId
  };
}

// Expense tracking
export async function logCorporateExpense(data: {
  employeeId: string;
  companyId: string;
  amount: number;
  category: string;
  merchantId: string;
  orderId: string;
}): Promise<void> {
  await axios.post(`${CORPPERKS_API}/expenses/log`, {
    ...data,
    source: 'REZ_MERCHANT'
  }, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN }
  });
}

// Corporate wallet/allowance
export async function getCorporateAllowance(employeeId: string): Promise<CorporateAllowance> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/allowance/${employeeId}`);
    return response.data;
  } catch {
    return { total: 0, used: 0, remaining: 0 };
  }
}

export async function deductFromAllowance(
  employeeId: string,
  amount: number,
  orderId: string
): Promise<boolean> {
  try {
    await axios.post(`${CORPPERKS_API}/allowance/deduct`, {
      employeeId,
      amount,
      orderId,
      source: 'REZ_MERCHANT'
    }, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN }
    });
    return true;
  } catch {
    return false;
  }
}

// Employee benefits catalog
export async function getCorporateCatalog(companyId: string): Promise<unknown[]> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/catalog/${companyId}`);
    return response.data.products || [];
  } catch {
    return [];
  }
}

// Batch sync for multiple employees
export async function batchSyncEmployees(
  companyId: string,
  employees: Employee[]
): Promise<{ synced: number; failed: string[] }> {
  const failed: string[] = [];

  for (const employee of employees) {
    try {
      await syncEmployee(companyId, employee);
    } catch {
      failed.push(employee.employeeId);
    }
  }

  return {
    synced: employees.length - failed.length,
    failed
  };
}

// Check if employee has active allowance
export async function hasActiveAllowance(employeeId: string): Promise<boolean> {
  const allowance = await getCorporateAllowance(employeeId);
  return allowance.remaining > 0;
}

// Get expense history for an employee
export async function getExpenseHistory(
  employeeId: string,
  limit: number = 50
): Promise<CorporateExpense[]> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/expenses/history/${employeeId}`, {
      params: { limit }
    });
    return response.data.expenses || [];
  } catch {
    return [];
  }
}

// Validate discount eligibility
export async function validateDiscountEligibility(
  companyId: string,
  category: string,
  cartTotal: number
): Promise<{ eligible: boolean; discount: CorporateDiscount | null; finalAmount: number }> {
  const discount = await getCorporateDiscount(companyId, category);

  if (!discount) {
    return { eligible: false, discount: null, finalAmount: cartTotal };
  }

  const discountAmount = Math.min(
    cartTotal * (discount.discountPercent / 100),
    discount.maxDiscount
  );

  return {
    eligible: true,
    discount,
    finalAmount: Math.round((cartTotal - discountAmount) * 100) / 100
  };
}

// Sync discount configuration from CorpPerks
export async function syncDiscountConfig(companyId: string): Promise<CorporateDiscount[]> {
  try {
    const response = await axios.get(`${CORPPERKS_API}/discounts/${companyId}/all`);
    return response.data.discounts || [];
  } catch {
    return [];
  }
}
