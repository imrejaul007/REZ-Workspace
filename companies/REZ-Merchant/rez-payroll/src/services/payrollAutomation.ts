/**
 * Payroll Automation Service
 * Automated payroll processing with statutory compliance
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  doj: Date; // Date of joining
  status: 'active' | 'inactive' | 'terminated';
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    accountHolderName: string;
  };
  salary: SalaryComponents;
  statutory: StatutoryComponents;
  leaves: LeaveBalance;
}

export interface SalaryComponents {
  basic: number;
  hra: number;
  allowances: Record<string, number>; // Transport, medical, etc.
  total: number;
}

export interface StatutoryComponents {
  pfEnabled: boolean;
  pfEmployee: number; // Percentage
  pfEmployer: number;
  esicEnabled: boolean;
  esicEmployee: number;
  esicEmployer: number;
  ptEnabled: boolean;
  ptState: string; // For professional tax
  tdsEnabled: boolean;
}

export interface LeaveBalance {
  cl: number; // Casual leave
  sl: number; // Sick leave
  el: number; // Earned leave
  unpaid: number;
}

export interface PayrollRun {
  id: string;
  merchantId: string;
  month: number; // 1-12
  year: number;
  status: 'draft' | 'calculated' | 'approved' | 'disbursed' | 'failed';
  employees: PayrollEntry[];
  totals: PayrollTotals;
  disbursementDate?: Date;
  disbursementReference?: string;
  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  department: string;
  daysWorked: number;
  daysAbsent: number;
  unpaidLeaves: number;
  grossSalary: number;
  earnings: EarningsBreakdown;
  deductions: DeductionsBreakdown;
  netSalary: number;
  status: 'pending' | 'approved' | 'disbursed' | 'failed';
  disbursedAt?: Date;
  transactionId?: string;
  error?: string;
}

export interface EarningsBreakdown {
  basic: number;
  hra: number;
  transport: number;
  medical: number;
  special: number;
  overtime: number;
  bonus: number;
  incentive: number;
  arrears: number; // Back pay
  total: number;
}

export interface DeductionsBreakdown {
  pf: number;
  esic: number;
  pt: number; // Professional Tax
  tds: number;
  advances: number;
  other: number;
  total: number;
}

export interface PayrollTotals {
  grossPayroll: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetPayroll: number;
  totalPFEmployer: number;
  totalESICEmployer: number;
  totalPT: number;
  totalTDS: number;
  employeeCount: number;
}

export interface DisbursementResult {
  success: boolean;
  disbursed: number;
  failed: number;
  transactions: Array<{
    employeeId: string;
    accountNumber: string;
    amount: number;
    status: 'success' | 'failed';
    transactionId?: string;
    error?: string;
  }>;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const EmployeeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: String,
  department: String,
  designation: String,
  doj: Date,
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  bankAccount: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
    accountHolderName: String,
  },
  salary: {
    basic: Number,
    hra: Number,
    allowances: { type: Map, of: Number },
    total: Number,
  },
  statutory: {
    pfEnabled: Boolean,
    pfEmployee: Number,
    pfEmployer: Number,
    esicEnabled: Boolean,
    esicEmployee: Number,
    esicEmployer: Number,
    ptEnabled: Boolean,
    ptState: String,
    tdsEnabled: Boolean,
  },
  leaves: {
    cl: Number,
    sl: Number,
    el: Number,
    unpaid: Number,
  },
}, { timestamps: true });

const PayrollRunSchema = new Schema({
  id: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'calculated', 'approved', 'disbursed', 'failed'], default: 'draft' },
  employees: [{
    employeeId: String,
    employeeName: String,
    department: String,
    daysWorked: Number,
    daysAbsent: Number,
    unpaidLeaves: Number,
    grossSalary: Number,
    earnings: {
      basic: Number,
      hra: Number,
      transport: Number,
      medical: Number,
      special: Number,
      overtime: Number,
      bonus: Number,
      incentive: Number,
      arrears: Number,
      total: Number,
    },
    deductions: {
      pf: Number,
      esic: Number,
      pt: Number,
      tds: Number,
      advances: Number,
      other: Number,
      total: Number,
    },
    netSalary: Number,
    status: { type: String, enum: ['pending', 'approved', 'disbursed', 'failed'] },
    disbursedAt: Date,
    transactionId: String,
    error: String,
  }],
  totals: {
    grossPayroll: Number,
    totalEarnings: Number,
    totalDeductions: Number,
    totalNetPayroll: Number,
    totalPFEmployer: Number,
    totalESICEmployer: Number,
    totalPT: Number,
    totalTDS: Number,
    employeeCount: Number,
  },
  disbursementDate: Date,
  disbursementReference: String,
  createdBy: String,
  approvedAt: Date,
  approvedBy: String,
}, { timestamps: true });

PayrollRunSchema.index({ merchantId: 1, month: 1, year: 1 }, { unique: true });

const PayslipSchema = new Schema({
  id: { type: String, required: true, unique: true },
  payrollRunId: { type: String, required: true, index: true },
  employeeId: String,
  month: Number,
  year: Number,
  pdfUrl: String,
  sentAt: Date,
  sentVia: ['email', 'sms', 'whatsapp', 'app'],
}, { timestamps: true });

export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const PayrollRunModel = mongoose.models.PayrollRun || mongoose.model('PayrollRun', PayrollRunSchema);
export const Payslip = mongoose.models.Payslip || mongoose.model('Payslip', PayslipSchema);

// ── Statutory Rates (2024-25) ────────────────────────────────────────────────

const STATUTORY_RATES = {
  pf: {
    employee: 12, // 12% of Basic + DA
    employer: 13, // 13% (12% EPF + 0.5% EDLI + 0.5% EPS)
    maxSalary: 15000, // Salary above this exempt from PF
  },
  esic: {
    employee: 0.75, // 0.75% for salary <= 21000
    employer: 3.25, // 3.25%
    maxSalary: 21000,
  },
  pt: { // Professional Tax varies by state
    Karnataka: 200,
    Maharashtra: { 0: 0, 10000: 175, 20000: 350 }, // Slab-wise
    Delhi: 200,
    default: 0,
  },
  tds: {
    standardRate: 0.10, // 10% for salary
    surcharge: 0.02, // Health & Education cess
  },
};

// ── Payroll Automation Service ──────────────────────────────────────────────────

class PayrollAutomationService {
  /**
   * Run payroll for a month
   */
  async runPayroll(params: {
    merchantId: string;
    month: number;
    year: number;
    userId: string;
  }): Promise<PayrollRun> {
    // Check if already run
    const existing = await PayrollRunModel.findOne({
      merchantId: params.merchantId,
      month: params.month,
      year: params.year,
    });

    if (existing) {
      throw new Error(`Payroll already run for ${params.month}/${params.year}`);
    }

    // Get active employees
    const employees = await Employee.find({
      merchantId: params.merchantId,
      status: 'active',
    });

    // Calculate payroll for each employee
    const entries: PayrollEntry[] = [];
    let totals: PayrollTotals = {
      grossPayroll: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      totalNetPayroll: 0,
      totalPFEmployer: 0,
      totalESICEmployer: 0,
      totalPT: 0,
      totalTDS: 0,
      employeeCount: employees.length,
    };

    for (const employee of employees) {
      const entry = await this.calculateSalary(employee, params.month, params.year);
      entries.push(entry);

      // Accumulate totals
      totals.grossPayroll += entry.grossSalary;
      totals.totalEarnings += entry.earnings.total;
      totals.totalDeductions += entry.deductions.total;
      totals.totalNetPayroll += entry.netSalary;
      totals.totalPFEmployer += this.calculatePFEmployer(employee);
      totals.totalESICEmployer += this.calculateESICEmployer(employee);
      totals.totalPT += entry.deductions.pt;
      totals.totalTDS += entry.deductions.tds;
    }

    // Create payroll run
    const payrollRun = new PayrollRunModel({
      id: `PR_${params.year}_${String(params.month).padStart(2, '0')}_${Date.now()}`,
      merchantId: params.merchantId,
      month: params.month,
      year: params.year,
      status: 'calculated',
      employees: entries,
      totals,
      createdBy: params.userId,
    });

    await payrollRun.save();
    return payrollRun;
  }

  /**
   * Calculate salary for an employee
   */
  private async calculateSalary(
    employee: Employee,
    month: number,
    year: number
  ): Promise<PayrollEntry> {
    // Get attendance for the month
    const attendance = await this.getAttendance(employee.id, month, year);
    const daysWorked = attendance.present + attendance.lateHalfDay;
    const unpaidLeaves = attendance.absent;
    const totalDays = this.getTotalDaysInMonth(month, year);

    // Calculate prorated basic
    const basic = employee.salary.basic;
    const proratedBasic = (basic / totalDays) * daysWorked;

    // Calculate HRA (typically 40-50% of basic)
    const hra = (proratedBasic * 40) / 100;

    // Calculate other earnings
    const earnings: EarningsBreakdown = {
      basic: Math.round(proratedBasic),
      hra: Math.round(hra),
      transport: employee.salary.allowances?.transport || 0,
      medical: employee.salary.allowances?.medical || 0,
      special: employee.salary.allowances?.special || 0,
      overtime: attendance.overtimeHours * (basic / (totalDays * 8)), // OT rate
      bonus: 0, // Would come from performance
      incentive: 0,
      arrears: 0,
      total: 0,
    };

    earnings.total = Object.values(earnings).reduce((sum, val) =>
      typeof val === 'number' ? sum + val : sum, 0
    );

    const grossSalary = earnings.total;

    // Calculate deductions
    const deductions: DeductionsBreakdown = {
      pf: employee.statutory.pfEnabled ? this.calculatePF(proratedBasic, employee.statutory) : 0,
      esic: employee.statutory.esicEnabled ? this.calculateESIC(grossSalary, employee.statutory) : 0,
      pt: employee.statutory.ptEnabled ? this.calculatePT(grossSalary, employee.statutory.ptState) : 0,
      tds: employee.statutory.tdsEnabled ? this.calculateTDS(grossSalary, employee) : 0,
      advances: 0, // Would come from advances module
      other: 0,
      total: 0,
    };

    deductions.total = Object.values(deductions).reduce((sum, val) =>
      typeof val === 'number' ? sum + val : sum, 0
    );

    const netSalary = grossSalary - deductions.total;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department || 'General',
      daysWorked,
      daysAbsent: unpaidLeaves,
      unpaidLeaves,
      grossSalary,
      earnings,
      deductions,
      netSalary: Math.round(netSalary),
      status: 'pending',
    };
  }

  /**
   * Calculate PF deduction
   */
  private calculatePF(basic: number, statutory: StatutoryComponents): number {
    const pfBasic = Math.min(basic, STATUTORY_RATES.pf.maxSalary);
    return Math.round((pfBasic * STATUTORY_RATES.pf.employee) / 100);
  }

  /**
   * Calculate PF employer contribution
   */
  private calculatePFEmployer(employee: Employee): number {
    if (!employee.statutory.pfEnabled) return 0;
    const basic = employee.salary.basic;
    const pfBasic = Math.min(basic, STATUTORY_RATES.pf.maxSalary);
    return Math.round((pfBasic * STATUTORY_RATES.pf.employer) / 100);
  }

  /**
   * Calculate ESIC deduction
   */
  private calculateESIC(grossSalary: number, statutory: StatutoryComponents): number {
    if (!statutory.esicEnabled) return 0;
    if (grossSalary > STATUTORY_RATES.esic.maxSalary) return 0;
    return Math.round((grossSalary * STATUTORY_RATES.esic.employee) / 100);
  }

  /**
   * Calculate ESIC employer contribution
   */
  private calculateESICEmployer(employee: Employee): number {
    if (!employee.statutory.esicEnabled) return 0;
    const gross = employee.salary.total || employee.salary.basic;
    if (gross > STATUTORY_RATES.esic.maxSalary) return 0;
    return Math.round((gross * STATUTORY_RATES.esic.employer) / 100);
  }

  /**
   * Calculate Professional Tax
   */
  private calculatePT(grossSalary: number, state: string): number {
    const ptConfig = STATUTORY_RATES.pt[state as keyof typeof STATUTORY_RATES.pt];

    if (typeof ptConfig === 'number') {
      return ptConfig;
    }

    if (typeof ptConfig === 'object') {
      // Slab-wise calculation
      const slabs = Object.entries(ptConfig)
        .map(([k, v]) => [Number(k), v as number])
        .sort((a, b) => b[0] - a[0]);

      for (const [threshold, amount] of slabs) {
        if (grossSalary >= threshold) {
          return amount;
        }
      }
    }

    return 0;
  }

  /**
   * Calculate TDS
   */
  private calculateTDS(monthlyGross: number, employee: Employee): number {
    const annualGross = monthlyGross * 12;
    const exemptions = this.getTaxExemptions(employee);
    const taxableIncome = Math.max(0, annualGross - exemptions);

    // Old tax slab rates
    let tax = 0;
    if (taxableIncome > 250000) {
      if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
    }

    // Rebate under 87A for income <= 5 lakhs
    if (taxableIncome <= 500000) {
      tax = 0;
    }

    // Add cess
    const cess = tax * 0.04;

    // Return monthly TDS
    return Math.round((tax + cess) / 12);
  }

  /**
   * Get tax exemptions
   */
  private getTaxExemptions(employee: Employee): number {
    // Standard deduction
    let exemptions = 50000; // Standard deduction 80C/80D would be added based on declarations
    return exemptions;
  }

  /**
   * Get attendance for an employee
   */
  private async getAttendance(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{
    present: number;
    absent: number;
    lateHalfDay: number;
    overtimeHours: number;
  }> {
    // This would query the attendance service
    // Mock implementation
    return {
      present: 22,
      absent: 2,
      lateHalfDay: 1,
      overtimeHours: 4,
    };
  }

  /**
   * Get total days in month
   */
  private getTotalDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Approve payroll
   */
  async approvePayroll(
    payrollRunId: string,
    userId: string
  ): Promise<PayrollRun> {
    const payrollRun = await PayrollRunModel.findOne({ id: payrollRunId });
    if (!payrollRun) throw new Error('Payroll run not found');

    if (payrollRun.status !== 'calculated') {
      throw new Error('Can only approve calculated payroll');
    }

    payrollRun.status = 'approved';
    payrollRun.approvedAt = new Date();
    payrollRun.approvedBy = userId;

    // Mark all entries as approved
    payrollRun.employees.forEach(entry => {
      entry.status = 'approved';
    });

    await payrollRun.save();
    return payrollRun;
  }

  /**
   * Disburse salaries
   */
  async disburseSalaries(
    payrollRunId: string
  ): Promise<DisbursementResult> {
    const payrollRun = await PayrollRunModel.findOne({ id: payrollRunId });
    if (!payrollRun) throw new Error('Payroll run not found');

    if (payrollRun.status !== 'approved') {
      throw new Error('Can only disburse approved payroll');
    }

    const transactions: DisbursementResult['transactions'] = [];
    let disbursed = 0;
    let failed = 0;

    // Process each employee
    for (const entry of payrollRun.employees) {
      const employee = await Employee.findOne({ id: entry.employeeId });

      if (!employee) {
        entry.status = 'failed';
        entry.error = 'Employee not found';
        failed++;
        transactions.push({
          employeeId: entry.employeeId,
          accountNumber: '',
          amount: entry.netSalary,
          status: 'failed',
          error: 'Employee not found',
        });
        continue;
      }

      try {
        // Call payment service to initiate NEFT/RTGS
        const transactionId = await this.initiateBankTransfer({
          accountNumber: employee.bankAccount.accountNumber,
          ifsc: employee.bankAccount.ifsc,
          amount: entry.netSalary,
          reference: `${payrollRun.month}/${payrollRun.year} Salary`,
        });

        entry.status = 'disbursed';
        entry.disbursedAt = new Date();
        entry.transactionId = transactionId;
        disbursed++;

        transactions.push({
          employeeId: entry.employeeId,
          accountNumber: employee.bankAccount.accountNumber,
          amount: entry.netSalary,
          status: 'success',
          transactionId,
        });
      } catch (error) {
        entry.status = 'failed';
        entry.error = error instanceof Error ? error.message : 'Transfer failed';
        failed++;

        transactions.push({
          employeeId: entry.employeeId,
          accountNumber: employee.bankAccount.accountNumber,
          amount: entry.netSalary,
          status: 'failed',
          error: entry.error,
        });
      }
    }

    // Update payroll run status
    payrollRun.status = failed === payrollRun.employees.length ? 'failed' : 'disbursed';
    payrollRun.disbursementDate = new Date();
    payrollRun.disbursementReference = `NEFT_${Date.now()}`;

    await payrollRun.save();

    return {
      success: failed === 0,
      disbursed,
      failed,
      transactions,
    };
  }

  /**
   * Initiate bank transfer (mock implementation)
   */
  private async initiateBankTransfer(params: {
    accountNumber: string;
    ifsc: string;
    amount: number;
    reference: string;
  }): Promise<string> {
    // In production, this would integrate with bank API
    console.log(`[Payroll] Initiating transfer: ₹${params.amount} to A/C ${params.accountNumber}`);
    return `NEFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add employee
   */
  async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const newEmployee = new Employee({
      id: `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...employee,
    });

    await newEmployee.save();
    return newEmployee;
  }

  /**
   * Update employee
   */
  async updateEmployee(
    employeeId: string,
    updates: Partial<Employee>
  ): Promise<Employee> {
    const employee = await Employee.findOneAndUpdate(
      { id: employeeId },
      updates,
      { new: true }
    );

    if (!employee) throw new Error('Employee not found');
    return employee;
  }

  /**
   * Get employees
   */
  async getEmployees(merchantId: string, status?: string): Promise<Employee[]> {
    const query: any = { merchantId };
    if (status) query.status = status;

    return Employee.find(query);
  }

  /**
   * Get payroll history
   */
  async getPayrollHistory(
    merchantId: string,
    year?: number
  ): Promise<PayrollRun[]> {
    const query: any = { merchantId };
    if (year) query.year = year;

    return PayrollRunModel.find(query).sort({ year: -1, month: -1 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate Form 16 data
   */
  async generateForm16(employeeId: string, year: number): Promise<{
    employee: Employee;
    payrollRuns: PayrollRun[];
    totalEarnings: number;
    totalDeductions: number;
    totalTDS: number;
    totalPF: number;
  }> {
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) throw new Error('Employee not found');

    const payrollRuns = await PayrollRunModel.find({
      employeeId: employeeId,
      year,
      status: 'disbursed',
    });

    const totals = payrollRuns.reduce(
      (acc, run) => {
        const entry = run.employees.find(e => e.employeeId === employeeId);
        if (entry) {
          acc.earnings += entry.earnings.total;
          acc.deductions += entry.deductions.total;
          acc.tds += entry.deductions.tds;
          acc.pf += entry.deductions.pf;
        }
        return acc;
      },
      { earnings: 0, deductions: 0, tds: 0, pf: 0 }
    );

    return {
      employee,
      payrollRuns,
      totalEarnings: totals.earnings,
      totalDeductions: totals.deductions,
      totalTDS: totals.tds,
      totalPF: totals.pf,
    };
  }

  /**
   * Get cost center report
   */
  async getCostCenterReport(
    merchantId: string,
    month: number,
    year: number
  ): Promise<Map<string, {
    headcount: number;
    grossPayroll: number;
    netPayroll: number;
    pfEmployer: number;
    esicEmployer: number;
  }>> {
    const payrollRun = await PayrollRunModel.findOne({
      merchantId,
      month,
      year,
    });

    if (!payrollRun) throw new Error('Payroll run not found');

    const report = new Map<string, any>();

    for (const entry of payrollRun.employees) {
      const dept = entry.department || 'General';

      if (!report.has(dept)) {
        report.set(dept, {
          headcount: 0,
          grossPayroll: 0,
          netPayroll: 0,
          pfEmployer: 0,
          esicEmployer: 0,
        });
      }

      const data = report.get(dept);
      data.headcount++;
      data.grossPayroll += entry.grossSalary;
      data.netPayroll += entry.netSalary;
    }

    return report;
  }
}

export const payrollAutomationService = new PayrollAutomationService();
export default payrollAutomationService;
