/**
 * Employee Disbursements Service
 *
 * Manages salary, incentive, and expense payouts to employees:
 * - Salary disbursements
 * - Incentive payments
 * - Expense reimbursements
 * - Commission payouts
 * - Bulk disbursements
 */

import { Types } from 'mongoose';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DisbursementType = 'salary' | 'incentive' | 'expense' | 'commission' | 'bonus' | 'reimbursement' | 'advance';
export type DisbursementStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque';

export interface Employee {
  id: string;
  merchantId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department?: string;
  designation?: string;
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  upiId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Disbursement {
  id: string;
  merchantId: string;
  employeeId: string;
  employeeName: string;

  type: DisbursementType;
  amount: number;
  TDSAmount?: number;
  netAmount: number;

  reference: string;
  description: string;

  paymentMethod: PaymentMethod;
  status: DisbursementStatus;

  // Payment details
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  upiId?: string;

  // Processing details
  processedAt?: Date;
  completedAt?: Date;
  utrNumber?: string;
  failureReason?: string;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;

  // Metadata
  period?: string; // e.g., "2024-01" for salary
  category?: string; // e.g., "Travel" for expenses
  invoiceIds?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface DisbursementBatch {
  id: string;
  merchantId: string;
  batchNumber: string;
  type: DisbursementType;

  totalAmount: number;
  TDSAmount: number;
  netAmount: number;
  employeeCount: number;
  completedCount: number;
  failedCount: number;

  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';

  disbursements: string[]; // Disbursement IDs

  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

// ── Employee Management ─────────────────────────────────────────────────────────

const employees: Map<string, Employee> = new Map();
const disbursements: Map<string, Disbursement> = new Map();
const batches: Map<string, DisbursementBatch> = new Map();

/**
 * Add employee
 */
export async function addEmployee(
  merchantId: string,
  employeeData: Omit<Employee, 'id' | 'merchantId' | 'createdAt' | 'updatedAt' | 'isActive'>
): Promise<Employee> {
  const id = new Types.ObjectId().toString();

  const employee: Employee = {
    ...employeeData,
    id,
    merchantId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  employees.set(id, employee);

  logger.info('[EmployeePayout] Employee added', { merchantId, employeeId: employee.employeeId });

  return employee;
}

/**
 * Update employee
 */
export async function updateEmployee(
  merchantId: string,
  employeeId: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  const employee = employees.get(employeeId);

  if (!employee || employee.merchantId !== merchantId) {
    return null;
  }

  Object.assign(employee, updates, { updatedAt: new Date() });
  employees.set(employeeId, employee);

  return employee;
}

/**
 * Get employees
 */
export async function getEmployees(
  merchantId: string,
  options?: {
    department?: string;
    isActive?: boolean;
    search?: string;
  }
): Promise<Employee[]> {
  let filtered = Array.from(employees.values()).filter((emp) => {
    if (emp.merchantId !== merchantId) return false;
    if (options?.department && emp.department !== options.department) return false;
    if (options?.isActive !== undefined && emp.isActive !== options.isActive) return false;
    if (options?.search) {
      const search = options.search.toLowerCase();
      if (
        !emp.name.toLowerCase().includes(search) &&
        !emp.employeeId.toLowerCase().includes(search) &&
        !emp.email?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Disbursement Creation ───────────────────────────────────────────────────────

/**
 * Create single disbursement
 */
export async function createDisbursement(
  merchantId: string,
  data: {
    employeeId: string;
    type: DisbursementType;
    amount: number;
    description: string;
    TDSAmount?: number;
    paymentMethod: PaymentMethod;
    period?: string;
    category?: string;
    invoiceIds?: string[];
  }
): Promise<Disbursement> {
  const employee = employees.get(data.employeeId);

  if (!employee || employee.merchantId !== merchantId) {
    throw new Error('Employee not found');
  }

  const id = new Types.ObjectId().toString();
  const reference = generateReference(data.type);

  const disbursement: Disbursement = {
    id,
    merchantId,
    employeeId: data.employeeId,
    employeeName: employee.name,

    type: data.type,
    amount: data.amount,
    TDSAmount: data.TDSAmount,
    netAmount: data.amount - (data.TDSAmount || 0),

    reference,
    description: data.description,

    paymentMethod: data.paymentMethod,
    status: 'pending',

    bankAccount: employee.bankAccount,
    upiId: employee.upiId,

    period: data.period,
    category: data.category,
    invoiceIds: data.invoiceIds,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  disbursements.set(id, disbursement);

  logger.info('[EmployeePayout] Disbursement created', {
    merchantId,
    disbursementId: id,
    type: data.type,
    amount: data.amount,
  });

  return disbursement;
}

/**
 * Create bulk disbursement batch
 */
export async function createBulkDisbursement(
  merchantId: string,
  data: {
    type: DisbursementType;
    disbursements: {
      employeeId: string;
      amount: number;
      description: string;
      TDSAmount?: number;
      period?: string;
      category?: string;
    }[];
  }
): Promise<DisbursementBatch> {
  const batchId = new Types.ObjectId().toString();
  const batchNumber = `BATCH-${Date.now()}`;

  const disbursementIds: string[] = [];
  let totalAmount = 0;
  let totalTDS = 0;

  for (const item of data.disbursements) {
    const disbursement = await createDisbursement(merchantId, {
      employeeId: item.employeeId,
      type: data.type,
      amount: item.amount,
      description: item.description,
      TDSAmount: item.TDSAmount,
      paymentMethod: 'bank_transfer',
      period: item.period,
      category: item.category,
    });

    disbursementIds.push(disbursement.id);
    totalAmount += disbursement.amount;
    totalTDS += disbursement.TDSAmount || 0;
  }

  const batch: DisbursementBatch = {
    id: batchId,
    merchantId,
    batchNumber,
    type: data.type,
    totalAmount,
    TDSAmount: totalTDS,
    netAmount: totalAmount - totalTDS,
    employeeCount: disbursementIds.length,
    completedCount: 0,
    failedCount: 0,
    status: 'pending',
    disbursements: disbursementIds,
    createdAt: new Date(),
  };

  batches.set(batchId, batch);

  logger.info('[EmployeePayout] Bulk disbursement created', {
    merchantId,
    batchId,
    count: disbursementIds.length,
    totalAmount,
  });

  return batch;
}

// ── Salary Disbursement ─────────────────────────────────────────────────────────

/**
 * Create salary batch for a period
 */
export async function createSalaryBatch(
  merchantId: string,
  period: string, // e.g., "2024-01"
  salaryData: {
    employeeId: string;
    grossSalary: number;
    TDSAmount?: number;
    deductions?: { name: string; amount: number }[];
    description?: string;
  }[]
): Promise<DisbursementBatch> {
  const disbursementItems = salaryData.map((salary) => {
    const employee = employees.get(salary.employeeId);
    return {
      employeeId: salary.employeeId,
      amount: salary.netAmount || (salary.grossSalary - (salary.TDSAmount || 0)),
      description: salary.description || `Salary for ${period}`,
      TDSAmount: salary.TDSAmount,
      period,
    };
  });

  return createBulkDisbursement(merchantId, {
    type: 'salary',
    disbursements: disbursementItems,
  });
}

// ── Approval & Processing ───────────────────────────────────────────────────────

/**
 * Approve disbursement
 */
export async function approveDisbursement(
  merchantId: string,
  disbursementId: string,
  approvedBy: string
): Promise<Disbursement | null> {
  const disbursement = disbursements.get(disbursementId);

  if (!disbursement || disbursement.merchantId !== merchantId) {
    return null;
  }

  if (disbursement.status !== 'pending') {
    throw new Error('Can only approve pending disbursements');
  }

  disbursement.status = 'approved';
  disbursement.approvedBy = approvedBy;
  disbursement.approvedAt = new Date();
  disbursement.updatedAt = new Date();

  disbursements.set(disbursementId, disbursement);

  return disbursement;
}

/**
 * Approve batch
 */
export async function approveBatch(
  merchantId: string,
  batchId: string,
  approvedBy: string
): Promise<DisbursementBatch | null> {
  const batch = batches.get(batchId);

  if (!batch || batch.merchantId !== merchantId) {
    return null;
  }

  // Approve all disbursements in the batch
  for (const disbursementId of batch.disbursements) {
    await approveDisbursement(merchantId, disbursementId, approvedBy);
  }

  batch.status = 'approved';
  batches.set(batchId, batch);

  return batch;
}

/**
 * Process disbursement
 */
export async function processDisbursement(
  merchantId: string,
  disbursementId: string
): Promise<Disbursement | null> {
  const disbursement = disbursements.get(disbursementId);

  if (!disbursement || disbursement.merchantId !== merchantId) {
    return null;
  }

  if (!['pending', 'approved'].includes(disbursement.status)) {
    throw new Error('Cannot process this disbursement');
  }

  disbursement.status = 'processing';
  disbursement.processedAt = new Date();
  disbursement.updatedAt = new Date();

  // In production, this would call the payment gateway
  // For demo, simulate success
  try {
    await simulatePayment(disbursement);

    disbursement.status = 'completed';
    disbursement.completedAt = new Date();
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    disbursement.utrNumber = (() => {
      try {
        const { randomUUID } = require('crypto');
        return `UTR${Date.now()}${randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase()}`;
      } catch {
        return `UTR${Date.now()}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
      }
    })();
  } catch (error) {
    disbursement.status = 'failed';
    disbursement.failureReason = error instanceof Error ? error.message : 'Payment failed';
  }

  disbursements.set(disbursementId, disbursement);

  return disbursement;
}

/**
 * Process batch
 */
export async function processBatch(
  merchantId: string,
  batchId: string
): Promise<DisbursementBatch | null> {
  const batch = batches.get(batchId);

  if (!batch || batch.merchantId !== merchantId) {
    return null;
  }

  batch.status = 'processing';
  batches.set(batchId, batch);

  let completedCount = 0;
  let failedCount = 0;

  for (const disbursementId of batch.disbursements) {
    const result = await processDisbursement(merchantId, disbursementId);

    if (result?.status === 'completed') {
      completedCount++;
    } else {
      failedCount++;
    }
  }

  batch.completedCount = completedCount;
  batch.failedCount = failedCount;
  batch.processedAt = new Date();

  if (failedCount === 0) {
    batch.status = 'completed';
    batch.completedAt = new Date();
  } else if (completedCount > 0) {
    batch.status = 'partial';
  } else {
    batch.status = 'failed';
  }

  batches.set(batchId, batch);

  return batch;
}

// ── Queries ─────────────────────────────────────────────────────────────────────

/**
 * Get disbursement by ID
 */
export async function getDisbursement(
  merchantId: string,
  disbursementId: string
): Promise<Disbursement | null> {
  const disbursement = disbursements.get(disbursementId);

  if (!disbursement || disbursement.merchantId !== merchantId) {
    return null;
  }

  return disbursement;
}

/**
 * Get disbursements
 */
export async function getDisbursements(
  merchantId: string,
  options?: {
    type?: DisbursementType;
    status?: DisbursementStatus;
    employeeId?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ disbursements: Disbursement[]; total: number; summary: { totalAmount: number; pendingAmount: number; completedAmount: number } }> {
  let filtered = Array.from(disbursements.values()).filter((d) => {
    if (d.merchantId !== merchantId) return false;
    if (options?.type && d.type !== options.type) return false;
    if (options?.status && d.status !== options.status) return false;
    if (options?.employeeId && d.employeeId !== options.employeeId) return false;
    if (options?.fromDate && d.createdAt < options.fromDate) return false;
    if (options?.toDate && d.createdAt > options.toDate) return false;
    return true;
  });

  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // Calculate summary
  const allForMerchant = Array.from(disbursements.values()).filter((d) => d.merchantId === merchantId);
  const summary = {
    totalAmount: allForMerchant.reduce((sum, d) => sum + d.amount, 0),
    pendingAmount: allForMerchant
      .filter((d) => ['pending', 'approved', 'processing'].includes(d.status))
      .reduce((sum, d) => sum + d.netAmount, 0),
    completedAmount: allForMerchant
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.netAmount, 0),
  };

  return {
    disbursements: paginated,
    total,
    summary,
  };
}

/**
 * Get batch
 */
export async function getBatch(
  merchantId: string,
  batchId: string
): Promise<DisbursementBatch | null> {
  const batch = batches.get(batchId);

  if (!batch || batch.merchantId !== merchantId) {
    return null;
  }

  return batch;
}

/**
 * Get batches
 */
export async function getBatches(
  merchantId: string,
  options?: {
    type?: DisbursementType;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ batches: DisbursementBatch[]; total: number }> {
  let filtered = Array.from(batches.values()).filter((b) => {
    if (b.merchantId !== merchantId) return false;
    if (options?.type && b.type !== options.type) return false;
    if (options?.status && b.status !== options.status) return false;
    return true;
  });

  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return {
    batches: paginated,
    total,
  };
}

// ── Cancel ─────────────────────────────────────────────────────────────────────

/**
 * Cancel disbursement
 */
export async function cancelDisbursement(
  merchantId: string,
  disbursementId: string,
  reason: string
): Promise<boolean> {
  const disbursement = disbursements.get(disbursementId);

  if (!disbursement || disbursement.merchantId !== merchantId) {
    return false;
  }

  if (disbursement.status === 'completed') {
    throw new Error('Cannot cancel completed disbursement');
  }

  disbursement.status = 'cancelled';
  disbursement.failureReason = reason;
  disbursement.updatedAt = new Date();

  disbursements.set(disbursementId, disbursement);

  return true;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * FIX (security): Generate secure reference using crypto
 */
function generateReference(type: DisbursementType): string {
  const prefixes: Record<DisbursementType, string> = {
    salary: 'SAL',
    incentive: 'INC',
    expense: 'EXP',
    commission: 'COM',
    bonus: 'BON',
    reimbursement: 'REI',
    advance: 'ADV',
  };

  const prefix = prefixes[type];
  const timestamp = Date.now().toString(36).toUpperCase();
  // FIX (security): Replaced Math.random() with crypto
  let random: string;
  try {
    const { randomUUID } = require('crypto');
    random = randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
  } catch {
    random = Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  return `${prefix}-${timestamp}${random}`;
}

async function simulatePayment(disbursement: Disbursement): Promise<void> {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate 95% success rate
  if (Math.random() < 0.05) {
    throw new Error('Payment gateway timeout');
  }
}
