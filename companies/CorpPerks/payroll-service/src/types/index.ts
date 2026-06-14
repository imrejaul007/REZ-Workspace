import { Request } from 'express';

// ============================================
// BASE TYPES
// ============================================

export interface IBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

export type UserRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
  tenantId?: string;
}

// ============================================
// PAYROLL RUN TYPES
// ============================================

export type PayrollRunStatus = 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface IPayrollRun extends IBase {
  tenantId: string;
  month: number; // 1-12
  year: number;
  status: PayrollRunStatus;
  totalEmployees: number;
  totalAmount: number;
  processedEmployees: number;
  failedEmployees: number;
  startedAt?: Date;
  completedAt?: Date;
  processedBy: string;
  errorMessage?: string;
  payslips: string[]; // Array of Payslip IDs
}

export interface PayrollRunSummary {
  totalEmployees: number;
  processedEmployees: number;
  failedEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  totalTDS: number;
}

// ============================================
// SALARY COMPONENT TYPES
// ============================================

export interface ISalaryComponent extends IBase {
  tenantId: string;
  employeeId: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: {
    medical?: number;
    transport?: number;
    communication?: number;
    education?: number;
    food?: number;
    other?: number;
  };
  deductions: {
    incomeTax?: number;
    pf?: number;
    esic?: number;
    professionalTax?: number;
    tds?: number;
    other?: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  effectiveWorkingDays: number;
  lossOfPayDays: number;
  isActive: boolean;
}

export interface SalaryBreakdown {
  earnings: {
    basic: number;
    hra: number;
    allowances: Record<string, number>;
    gross: number;
  };
  deductions: {
    pf: number;
    esic: number;
    professionalTax: number;
    incomeTax: number;
    other: number;
    total: number;
  };
  netPay: number;
}

// ============================================
// PAYSLIP TYPES
// ============================================

export type PayslipStatus = 'generated' | 'approved' | 'paid' | 'on_hold';

export interface IPayslip extends IBase {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  payrollRunId: string;
  month: number;
  year: number;
  status: PayslipStatus;

  // Earnings
  earnings: {
    basic: number;
    hra: number;
    allowances: {
      medical?: number;
      transport?: number;
      communication?: number;
      education?: number;
      food?: number;
      other?: number;
    };
    totalEarnings: number;
  };

  // Deductions
  deductions: {
    pf: number;
    esic: number;
    professionalTax: number;
    incomeTax: number;
    otherDeductions: number;
    totalDeductions: number;
  };

  // Totals
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  takeHome: number;

  // Working days
  workingDays: number;
  effectiveWorkingDays: number;
  lossOfPayDays: number;

  // Reimbursements
  reimbursements: {
    type: string;
    amount: number;
    status: ReimbursementStatus;
  }[];

  // Payment info
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;

  // Metadata
  leaveDeductions: number;
  bonus: number;
  incentives: number;
}

export interface PayslipDetail extends IPayslip {
  taxDeclarations?: ITaxDeclaration;
  components?: ISalaryComponent;
}

// ============================================
// TAX DECLARATION TYPES
// ============================================

export type DeclarationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ITaxDeclaration extends IBase {
  tenantId: string;
  employeeId: string;
  fiscalYear: string; // e.g., "2024-25"
  declarations: {
    section: string;
    amount: number;
    proof?: string;
    status: DeclarationStatus;
    verifiedAt?: Date;
    verifiedBy?: string;
  }[];
  totalDeclared: number;
  totalVerified: number;
  status: DeclarationStatus;
  submittedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  basicSalary: number;
  totalAllowances: number;
}

export interface TaxSection {
  code: string;
  name: string;
  maxAmount: number;
  description: string;
}

export const TAX_SECTIONS: TaxSection[] = [
  { code: 'HRA', name: 'House Rent Allowance', maxAmount: 0, description: 'Rent paid for accommodation' },
  { code: '80C', name: 'Life Insurance, PPF, ELSS, etc.', maxAmount: 150000, description: 'Section 80C investments' },
  { code: '80CCD1', name: 'NPS Contribution', maxAmount: 50000, description: 'NPS employee contribution' },
  { code: '80D', name: 'Health Insurance Premium', maxAmount: 25000, description: 'Medical insurance premium' },
  { code: '80E', name: 'Education Loan Interest', maxAmount: 0, description: 'Interest on education loan' },
  { code: '80G', name: 'Donations', maxAmount: 0, description: 'Donations to charitable institutions' },
  { code: '80TTA', name: 'Savings Interest', maxAmount: 10000, description: 'Interest from savings accounts' },
  { code: '24', name: 'Home Loan Interest', maxAmount: 200000, description: 'Interest on home loan' },
  { code: '10(13A)', name: 'HRA Exemption', maxAmount: 0, description: 'HRA exemption calculation' },
];

// ============================================
// REIMBURSEMENT TYPES
// ============================================

export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'rejected';
export type ReimbursementType = 'travel' | 'medical' | 'meal' | 'phone' | 'internet' | 'equipment' | 'training' | 'other';

export interface IReimbursement extends IBase {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  type: ReimbursementType;
  amount: number;
  currency: string;
  description: string;
  expenseDate: Date;
  status: ReimbursementStatus;
  receipt?: string;
  receiptUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  paidAt?: Date;
  category?: string;
  projectCode?: string;
}

export interface ReimbursementRequest {
  employeeId: string;
  type: ReimbursementType;
  amount: number;
  description: string;
  expenseDate: string;
  receipt?: string;
  category?: string;
  projectCode?: string;
}

// ============================================
// SALARY ADVANCE TYPES
// ============================================

export type AdvanceStatus = 'pending' | 'approved' | 'rejected' | 'deducted' | 'cancelled';

export interface ISalaryAdvance extends IBase {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  requestedAmount: number;
  approvedAmount: number;
  reason: string;
  status: AdvanceStatus;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  expectedDeductionMonth: number;
  expectedDeductionYear: number;
  actualDeductionMonth?: number;
  actualDeductionYear?: number;
  rejectionReason?: string;
}

export interface SalaryAdvanceRequest {
  employeeId: string;
  amount: number;
  reason: string;
  expectedDeductionMonth: number;
  expectedDeductionYear: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  pagination?: IPagination;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// PAYROLL INPUT TYPES
// ============================================

export interface RunPayrollInput {
  month: number;
  year: number;
  employeeIds?: string[];
  includeReimbursements?: boolean;
}

export interface CreateSalaryComponentInput {
  employeeId: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: {
    medical?: number;
    transport?: number;
    communication?: number;
    education?: number;
    food?: number;
    other?: number;
  };
  deductions: {
    incomeTax?: number;
    pf?: number;
    esic?: number;
    professionalTax?: number;
    tds?: number;
    other?: number;
  };
}

export interface SubmitTaxDeclarationInput {
  employeeId: string;
  fiscalYear: string;
  declarations: {
    section: string;
    amount: number;
    proof?: string;
  }[];
  basicSalary?: number;
  totalAllowances?: number;
}
