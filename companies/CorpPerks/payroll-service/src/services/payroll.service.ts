import mongoose from 'mongoose';
import { PayrollRun, SalaryComponent, Payslip, TaxDeclaration, Reimbursement, SalaryAdvance } from '../models/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import type {
  IPayrollRun,
  IPayslip,
  PayrollRunSummary,
  RunPayrollInput,
  ApiResponse,
} from '../types/index.js';

interface EmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  basicSalary: number;
  department?: string;
}

export class PayrollService {
  /**
   * Run payroll for a given month and year
   */
  async runPayroll(
    tenantId: string,
    input: RunPayrollInput,
    processedBy: string
  ): Promise<ApiResponse<IPayrollRun>> {
    const { month, year, employeeIds, includeReimbursements = true } = input;

    // Check if payroll already exists for this month/year
    const existingRun = await PayrollRun.findOne({ tenantId, month, year });
    if (existingRun && existingRun.status === 'completed') {
      return {
        success: false,
        error: `Payroll for ${month}/${year} already completed. Cancel it first to re-run.`,
      };
    }

    // Create or update payroll run
    let payrollRun = existingRun || new PayrollRun({
      tenantId,
      month,
      year,
      status: 'draft',
      totalEmployees: 0,
      totalAmount: 0,
      processedEmployees: 0,
      failedEmployees: 0,
      processedBy,
    });

    payrollRun.status = 'processing';
    payrollRun.startedAt = new Date();
    await payrollRun.save();

    try {
      // Fetch employees (in production, this would call the employee service)
      const employees = await this.getEmployees(tenantId, employeeIds);
      payrollRun.totalEmployees = employees.length;

      if (employees.length === 0) {
        payrollRun.status = 'failed';
        payrollRun.errorMessage = 'No employees found';
        await payrollRun.save();
        return { success: false, error: 'No employees found' };
      }

      const payslipIds: string[] = [];
      let totalAmount = 0;

      for (const employee of employees) {
        try {
          const payslip = await this.processEmployeePayroll(
            tenantId,
            employee,
            month,
            year,
            payrollRun._id.toString(),
            includeReimbursements
          );

          if (payslip) {
            payslipIds.push(payslip._id.toString());
            totalAmount += payslip.netSalary;
            payrollRun.processedEmployees += 1;
          }
        } catch (error) {
          logger.error(`Error processing payroll for employee ${employee.employeeId}`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          payrollRun.failedEmployees += 1;
        }
      }

      payrollRun.status = 'completed';
      payrollRun.completedAt = new Date();
      payrollRun.totalAmount = totalAmount;
      payrollRun.payslips = payslipIds;
      await payrollRun.save();

      logger.info(`Payroll completed for ${month}/${year}`, {
        tenantId,
        totalEmployees: payrollRun.totalEmployees,
        processed: payrollRun.processedEmployees,
        failed: payrollRun.failedEmployees,
        totalAmount
      });

      return {
        success: true,
        data: payrollRun,
        message: `Payroll processed successfully: ${payrollRun.processedEmployees} employees, ₹${totalAmount.toFixed(2)}`,
      };
    } catch (error) {
      payrollRun.status = 'failed';
      payrollRun.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await payrollRun.save();

      return {
        success: false,
        error: `Payroll run failed: ${payrollRun.errorMessage}`,
      };
    }
  }

  /**
   * Get employees for payroll processing
   * In production, this would call the Employee Service via HTTP
   */
  private async getEmployees(_tenantId: string, employeeIds?: string[]): Promise<EmployeeData[]> {
    // Mock employee data for development
    // In production, fetch from Employee Service
    if (employeeIds && employeeIds.length > 0) {
      return employeeIds.map((id, index) => ({
        employeeId: id,
        firstName: `Employee`,
        lastName: `${index + 1}`,
        email: `employee${index + 1}@corpperks.com`,
        basicSalary: 50000 + (index * 5000),
      }));
    }

    // Return mock employees for full run
    return [
      { employeeId: 'EMP001', firstName: 'John', lastName: 'Doe', email: 'john.doe@corpperks.com', basicSalary: 75000 },
      { employeeId: 'EMP002', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@corpperks.com', basicSalary: 60000 },
      { employeeId: 'EMP003', firstName: 'Raj', lastName: 'Kumar', email: 'raj.kumar@corpperks.com', basicSalary: 45000 },
    ];
  }

  /**
   * Process payroll for a single employee
   */
  private async processEmployeePayroll(
    tenantId: string,
    employee: EmployeeData,
    month: number,
    year: number,
    payrollRunId: string,
    includeReimbursements: boolean
  ): Promise<IPayslip | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Calculate salary components
      const { earnings, deductions, netSalary } = await this.calculateSalary(employee, month, year, tenantId);

      // Get pending reimbursements
      let reimbursements: { type: string; amount: number; status: string }[] = [];
      if (includeReimbursements) {
        const pendingReimbursements = await Reimbursement.find({
          tenantId,
          employeeId: employee.employeeId,
          status: 'approved',
        }).session(session);

        reimbursements = pendingReimbursements.map((r) => ({
          type: r.type,
          amount: r.amount,
          status: 'paid' as const,
        }));

        // Mark reimbursements as paid
        await Reimbursement.updateMany(
          { _id: { $in: pendingReimbursements.map((r) => r._id) } },
          { status: 'paid', paidAt: new Date() }
        ).session(session);
      }

      // Calculate take-home pay
      const reimbursementTotal = reimbursements.reduce((sum, r) => sum + r.amount, 0);
      const takeHome = netSalary + reimbursementTotal;

      // Create payslip
      const payslip = new Payslip({
        tenantId,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.email,
        payrollRunId: new mongoose.Types.ObjectId(payrollRunId),
        month,
        year,
        status: 'generated',
        earnings: {
          basic: earnings.basic,
          hra: earnings.hra,
          allowances: earnings.allowances,
          totalEarnings: earnings.gross,
        },
        deductions: {
          pf: deductions.pf,
          esic: deductions.esic,
          professionalTax: deductions.professionalTax,
          incomeTax: deductions.incomeTax,
          otherDeductions: deductions.other,
          totalDeductions: deductions.total,
        },
        grossSalary: earnings.gross,
        totalDeductions: deductions.total,
        netSalary,
        takeHome,
        workingDays: config.payroll.standardWorkingDays,
        effectiveWorkingDays: config.payroll.standardWorkingDays,
        lossOfPayDays: 0,
        reimbursements,
      });

      await payslip.save({ session });

      // Create salary component record
      const salaryComponent = new SalaryComponent({
        tenantId,
        employeeId: employee.employeeId,
        month,
        year,
        basic: earnings.basic,
        hra: earnings.hra,
        allowances: earnings.allowances,
        deductions: {
          pf: deductions.pf,
          esic: deductions.esic,
          professionalTax: deductions.professionalTax,
          incomeTax: deductions.incomeTax,
          other: deductions.other,
        },
        grossSalary: earnings.gross,
        totalDeductions: deductions.total,
        netSalary,
        effectiveWorkingDays: config.payroll.standardWorkingDays,
        lossOfPayDays: 0,
        isActive: true,
      });

      await salaryComponent.save({ session });

      // Check for pending salary advances
      const pendingAdvances = await SalaryAdvance.find({
        tenantId,
        employeeId: employee.employeeId,
        status: 'approved',
        expectedDeductionMonth: month,
        expectedDeductionYear: year,
      }).session(session);

      if (pendingAdvances.length > 0) {
        // In production, deduct advance from payslip
        logger.info(`Deducting salary advance for ${employee.employeeId}`, {
          month,
          year,
          advanceCount: pendingAdvances.length
        });
      }

      await session.commitTransaction();
      return payslip;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate salary breakdown for an employee
   */
  private async calculateSalary(
    employee: EmployeeData,
    month: number,
    year: number,
    tenantId: string
  ): Promise<{
    earnings: { basic: number; hra: number; allowances: Record<string, number>; gross: number };
    deductions: { pf: number; esic: number; professionalTax: number; incomeTax: number; other: number; total: number };
    netSalary: number;
  }> {
    const basic = employee.basicSalary;

    // HRA is typically 40-50% of basic (assuming 40%)
    const hra = Math.round(basic * 0.4);

    // Allowances
    const allowances = {
      medical: Math.round(basic * 0.05),
      transport: Math.round(basic * 0.1),
      communication: 1000,
      food: 2200,
    };

    // Calculate gross
    const allowancesTotal = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const gross = basic + hra + allowancesTotal;

    // Deductions
    const pf = Math.min(basic * config.tax.pfRate, config.tax.employerPF);
    const esic = gross <= config.tax.esicLimit ? Math.round(gross * config.tax.esicRate) : 0;

    // Professional Tax based on slab
    let professionalTax = 0;
    if (gross > 15000) professionalTax = 200;
    else if (gross > 10000) professionalTax = 150;

    // Get tax declaration for the fiscal year
    const fiscalYear = this.getFiscalYear(month, year);
    const taxDeclaration = await TaxDeclaration.findOne({
      tenantId,
      employeeId: employee.employeeId,
      fiscalYear,
      status: 'approved',
    });

    // Calculate TDS based on annual income and declarations
    const annualIncome = gross * 12;
    let incomeTax = 0;

    if (taxDeclaration) {
      const totalDeductions = taxDeclaration.totalVerified + config.tax.standardDeduction;
      const taxableIncome = Math.max(0, annualIncome - totalDeductions);
      incomeTax = Math.round(this.calculateIncomeTax(taxableIncome) / 12);
    }

    const otherDeductions = 0;
    const totalDeductions = pf + esic + professionalTax + incomeTax + otherDeductions;
    const netSalary = gross - totalDeductions;

    return {
      earnings: { basic, hra, allowances, gross },
      deductions: { pf, esic, professionalTax, incomeTax, other: otherDeductions, total: totalDeductions },
      netSalary: Math.max(0, netSalary),
    };
  }

  /**
   * Calculate income tax based on new tax regime (FY 2024-25)
   */
  private calculateIncomeTax(taxableIncome: number): number {
    // New tax regime slabs
    if (taxableIncome <= 300000) return 0;
    if (taxableIncome <= 700000) return (taxableIncome - 300000) * 0.05;
    if (taxableIncome <= 1000000) return 20000 + (taxableIncome - 700000) * 0.1;
    if (taxableIncome <= 1200000) return 50000 + (taxableIncome - 1000000) * 0.15;
    if (taxableIncome <= 1500000) return 80000 + (taxableIncome - 1200000) * 0.2;
    return 140000 + (taxableIncome - 1500000) * 0.3;
  }

  /**
   * Get fiscal year from month/year
   */
  private getFiscalYear(month: number, year: number): string {
    if (month <= 3) {
      return `${year - 1}-${String(year).slice(-2)}`;
    }
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  /**
   * Get payroll summary
   */
  async getPayrollSummary(tenantId: string, month: number, year: number): Promise<ApiResponse<PayrollRunSummary>> {
    const payrollRun = await PayrollRun.findOne({ tenantId, month, year });

    if (!payrollRun) {
      return { success: false, error: 'Payroll run not found' };
    }

    const payslips = await Payslip.find({
      tenantId,
      month,
      year,
    });

    const summary: PayrollRunSummary = {
      totalEmployees: payrollRun.totalEmployees,
      processedEmployees: payrollRun.processedEmployees,
      failedEmployees: payrollRun.failedEmployees,
      totalGross: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
      totalDeductions: payslips.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payslips.reduce((sum, p) => sum + p.netSalary, 0),
      totalTDS: payslips.reduce((sum, p) => sum + p.deductions.incomeTax, 0),
    };

    return { success: true, data: summary };
  }

  /**
   * Get all payroll runs for a tenant
   */
  async getPayrollRuns(
    tenantId: string,
    filters: { month?: number; year?: number; status?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ runs: IPayrollRun[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query: Record<string, unknown> = { tenantId };

    if (filters.month) query.month = filters.month;
    if (filters.year) query.year = filters.year;
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;

    const [runs, total] = await Promise.all([
      PayrollRun.find(query).sort({ year: -1, month: -1 }).skip(skip).limit(limit),
      PayrollRun.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        runs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Cancel a payroll run
   */
  async cancelPayrollRun(tenantId: string, payrollRunId: string): Promise<ApiResponse<IPayrollRun>> {
    const payrollRun = await PayrollRun.findOne({ _id: payrollRunId, tenantId });

    if (!payrollRun) {
      return { success: false, error: 'Payroll run not found' };
    }

    if (payrollRun.status === 'completed') {
      // Soft cancel - mark as cancelled but keep payslips
      payrollRun.status = 'cancelled';
      await payrollRun.save();

      // Mark payslips as on_hold
      await Payslip.updateMany(
        { payrollRunId: payrollRun._id },
        { status: 'on_hold' }
      );
    } else {
      payrollRun.status = 'cancelled';
      await payrollRun.save();

      // Delete draft payslips
      await Payslip.deleteMany({ payrollRunId: payrollRun._id });
    }

    return { success: true, data: payrollRun, message: 'Payroll run cancelled' };
  }
}

export const payrollService = new PayrollService();
