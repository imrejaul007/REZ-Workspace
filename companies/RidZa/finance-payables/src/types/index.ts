/**
 * Type definitions for Finance Payables
 */

export interface Vendor {
  _id?: string;
  vendorId: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName?: string;
  };
  paymentTerms: 'immediate' | 'net15' | 'net30' | 'net45' | 'net60' | 'custom';
  customPaymentDays?: number;
  creditLimit?: number;
  currentBalance: number;
  category?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  _id?: string;
  billId: string;
  tenantId: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'approved' | 'scheduled' | 'paid' | 'overdue' | 'cancelled';
  category?: string;
  description?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    total: number;
  }>;
  attachments?: string[];
  scheduledPaymentDate?: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentReference?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSchedule {
  tenantId: string;
  weekStart: Date;
  weekEnd: Date;
  scheduledPayments: Array<{
    billId: string;
    vendorId: string;
    vendorName: string;
    amount: number;
    dueDate: Date;
    scheduledDate: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalAmount: number;
  cashFlowSuggestions: CashFlowSuggestion[];
}

export interface CashFlowSuggestion {
  type: 'early_payment' | 'delayed_payment' | 'consolidation' | 'discount';
  billId?: string;
  vendorId?: string;
  description: string;
  potentialSavings?: number;
  impact: 'high' | 'medium' | 'low';
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
