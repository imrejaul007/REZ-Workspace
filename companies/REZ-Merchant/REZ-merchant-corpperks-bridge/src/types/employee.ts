/**
 * Shared Types for CorpPerks Bridge
 */

// Employee Types
export type CorporateTier = 'standard' | 'premium' | 'enterprise';

export interface Employee {
  employeeId: string;
  email: string;
  companyId: string;
  department?: string;
  designation?: string;
  corporateTier: CorporateTier;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSyncPayload {
  companyId: string;
  employeeId: string;
  email: string;
  department?: string;
  designation?: string;
  tier: CorporateTier;
}

// Discount Types
export interface CorporateDiscount {
  companyId: string;
  discountPercent: number;
  maxDiscount: number;
  categories: string[];
  validFrom?: Date;
  validTo?: Date;
  isActive: boolean;
}

export interface DiscountApplication {
  discount: number;
  companyId: string;
  originalTotal: number;
  finalTotal: number;
  category: string;
  appliedAt: Date;
}

export interface DiscountEligibility {
  eligible: boolean;
  discount: CorporateDiscount | null;
  finalAmount: number;
  reason?: string;
}

// Allowance Types
export interface CorporateAllowance {
  total: number;
  used: number;
  remaining: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  resetDate?: Date;
}

export interface AllowanceDeduction {
  employeeId: string;
  amount: number;
  orderId: string;
  source: 'REZ_MERCHANT';
  timestamp: Date;
}

// Expense Types
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface CorporateExpense {
  employeeId: string;
  companyId: string;
  amount: number;
  category: string;
  merchantId: string;
  orderId: string;
  timestamp: Date;
  status: ExpenseStatus;
  description?: string;
  receipt?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ExpenseReport {
  employeeId: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  expenses: CorporateExpense[];
}

// Company Types
export interface Company {
  companyId: string;
  name: string;
  domain: string;
  tier: CorporateTier;
  discountConfig: CorporateDiscount[];
  allowExpenses: boolean;
  allowAllowance: boolean;
  maxExpenseLimit?: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
