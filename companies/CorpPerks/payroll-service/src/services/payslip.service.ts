import { Payslip, SalaryComponent, TaxDeclaration } from '../models/index.js';
import type { IPayslip, ApiResponse, PayslipDetail } from '../types/index.js';

export class PayslipService {
  /**
   * Get all payslips for an employee
   */
  async getEmployeePayslips(
    tenantId: string,
    employeeId: string,
    options: { month?: number; year?: number; status?: string; page?: number; limit?: number } = {}
  ): Promise<ApiResponse<{ payslips: IPayslip[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const { month, year, status, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = { tenantId, employeeId };
    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [payslips, total] = await Promise.all([
      Payslip.find(query).sort({ year: -1, month: -1 }).skip(skip).limit(limit),
      Payslip.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        payslips,
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
   * Get payslip by ID with full details
   */
  async getPayslipById(
    tenantId: string,
    payslipId: string
  ): Promise<ApiResponse<PayslipDetail>> {
    const payslip = await Payslip.findOne({ _id: payslipId, tenantId });

    if (!payslip) {
      return { success: false, error: 'Payslip not found' };
    }

    // Get salary components
    const components = await SalaryComponent.findOne({
      tenantId,
      employeeId: payslip.employeeId,
      month: payslip.month,
      year: payslip.year,
    });

    // Get tax declaration for the period
    const fiscalYear = this.getFiscalYear(payslip.month, payslip.year);
    const taxDeclaration = await TaxDeclaration.findOne({
      tenantId,
      employeeId: payslip.employeeId,
      fiscalYear,
    });

    const detail: PayslipDetail = {
      ...payslip.toObject(),
      components: components || undefined,
      taxDeclarations: taxDeclaration || undefined,
    };

    return { success: true, data: detail };
  }

  /**
   * Get payslip by employee/month/year
   */
  async getPayslipByPeriod(
    tenantId: string,
    employeeId: string,
    month: number,
    year: number
  ): Promise<ApiResponse<IPayslip>> {
    const payslip = await Payslip.findOne({ tenantId, employeeId, month, year });

    if (!payslip) {
      return { success: false, error: 'Payslip not found for the specified period' };
    }

    return { success: true, data: payslip };
  }

  /**
   * Update payslip status (approve/mark as paid)
   */
  async updatePayslipStatus(
    tenantId: string,
    payslipId: string,
    status: 'approved' | 'paid' | 'on_hold',
    paymentInfo?: { date: Date; method: string; transactionId: string }
  ): Promise<ApiResponse<IPayslip>> {
    const payslip = await Payslip.findOne({ _id: payslipId, tenantId });

    if (!payslip) {
      return { success: false, error: 'Payslip not found' };
    }

    if (status === 'paid' && paymentInfo) {
      payslip.status = 'paid';
      payslip.paymentDate = paymentInfo.date;
      payslip.paymentMethod = paymentInfo.method;
      payslip.transactionId = paymentInfo.transactionId;
    } else {
      payslip.status = status;
    }

    await payslip.save();

    return { success: true, data: payslip, message: `Payslip marked as ${status}` };
  }

  /**
   * Get all payslips for a payroll run
   */
  async getPayslipsByPayrollRun(
    tenantId: string,
    payrollRunId: string
  ): Promise<ApiResponse<IPayslip[]>> {
    const payslips = await Payslip.find({ tenantId, payrollRunId }).sort({ employeeId: 1 });

    return { success: true, data: payslips };
  }

  /**
   * Get payslip statistics for an employee
   */
  async getPayslipStats(
    tenantId: string,
    employeeId: string
  ): Promise<ApiResponse<{
    totalPayslips: number;
    totalEarnings: number;
    totalDeductions: number;
    totalNetPay: number;
    averageNetPay: number;
  }>> {
    const stats = await Payslip.aggregate([
      { $match: { tenantId, employeeId } },
      {
        $group: {
          _id: null,
          totalPayslips: { $sum: 1 },
          totalEarnings: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetPay: { $sum: '$netSalary' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        success: true,
        data: {
          totalPayslips: 0,
          totalEarnings: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          averageNetPay: 0,
        },
      };
    }

    const { totalPayslips, totalEarnings, totalDeductions, totalNetPay } = stats[0];

    return {
      success: true,
      data: {
        totalPayslips,
        totalEarnings,
        totalDeductions,
        totalNetPay,
        averageNetPay: Math.round(totalNetPay / totalPayslips),
      },
    };
  }

  private getFiscalYear(month: number, year: number): string {
    if (month <= 3) {
      return `${year - 1}-${String(year).slice(-2)}`;
    }
    return `${year}-${String(year + 1).slice(-2)}`;
  }
}

export const payslipService = new PayslipService();
