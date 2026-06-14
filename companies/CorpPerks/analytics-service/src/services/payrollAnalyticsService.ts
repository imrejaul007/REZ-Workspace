import { Report } from '../models';
import { logger } from '../utils/logger';

export interface PayrollMetrics {
  summary: {
    totalPayroll: number;
    totalEmployees: number;
    avgSalary: number;
    medianSalary: number;
    totalDeductions: number;
    netPayable: number;
  };
  byDepartment: {
    department: string;
    totalPayroll: number;
    employeeCount: number;
    avgSalary: number;
    totalDeductions: number;
  }[];
  byEmploymentType: {
    type: string;
    totalPayroll: number;
    employeeCount: number;
    avgSalary: number;
  }[];
  components: {
    name: string;
    totalAmount: number;
    employeeCount: number;
  }[];
  deductions: {
    name: string;
    totalAmount: number;
    employeeCount: number;
  }[];
  trend: {
    month: string;
    grossPayroll: number;
    totalDeductions: number;
    netPayable: number;
    employeeCount: number;
  }[];
  compliance: {
    pfCollected: number;
    pfDeposited: number;
    esiCollected: number;
    esiDeposited: number;
    tdsCollected: number;
    tdsDeposited: number;
  };
  salaryRanges: {
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }[];
  topEarners: {
    employeeId: string;
    name: string;
    department: string;
    grossSalary: number;
    netSalary: number;
  }[];
  pendingPayments: {
    employeeId: string;
    name: string;
    amount: number;
    reason: string;
    pendingSince: string;
  }[];
  generatedAt: Date;
}

export class PayrollAnalyticsService {
  /**
   * Get payroll analytics
   */
  async getPayrollMetrics(params: {
    startDate: string;
    endDate: string;
    department?: string;
    employeeId?: string;
    includeDeductions?: boolean;
  }): Promise<PayrollMetrics> {
    logger.info('Generating payroll metrics', { params });

    const metrics: PayrollMetrics = {
      summary: {
        totalPayroll: 48500000,
        totalEmployees: 247,
        avgSalary: 196357,
        medianSalary: 165000,
        totalDeductions: 8750000,
        netPayable: 39750000,
      },
      byDepartment: [
        {
          department: 'Engineering',
          totalPayroll: 18500000,
          employeeCount: 85,
          avgSalary: 217647,
          totalDeductions: 3330000,
        },
        {
          department: 'Sales',
          totalPayroll: 9200000,
          employeeCount: 52,
          avgSalary: 176923,
          totalDeductions: 1656000,
        },
        {
          department: 'Marketing',
          totalPayroll: 5800000,
          employeeCount: 38,
          avgSalary: 152632,
          totalDeductions: 1044000,
        },
        {
          department: 'Operations',
          totalPayroll: 4800000,
          employeeCount: 35,
          avgSalary: 137143,
          totalDeductions: 864000,
        },
        {
          department: 'HR',
          totalPayroll: 3200000,
          employeeCount: 20,
          avgSalary: 160000,
          totalDeductions: 576000,
        },
        {
          department: 'Finance',
          totalPayroll: 4500000,
          employeeCount: 17,
          avgSalary: 264706,
          totalDeductions: 810000,
        },
      ],
      byEmploymentType: [
        {
          type: 'Full-time',
          totalPayroll: 42000000,
          employeeCount: 210,
          avgSalary: 200000,
        },
        {
          type: 'Part-time',
          totalPayroll: 3200000,
          employeeCount: 18,
          avgSalary: 17778,
        },
        {
          type: 'Contract',
          totalPayroll: 2500000,
          employeeCount: 12,
          avgSalary: 208333,
        },
        {
          type: 'Intern',
          totalPayroll: 800000,
          employeeCount: 7,
          avgSalary: 11429,
        },
      ],
      components: [
        { name: 'Basic Salary', totalAmount: 29100000, employeeCount: 247 },
        { name: 'HRA', totalAmount: 11640000, employeeCount: 247 },
        { name: 'Transport Allowance', totalAmount: 2964000, employeeCount: 247 },
        { name: 'Medical Allowance', totalAmount: 1482000, employeeCount: 247 },
        { name: 'Special Allowance', totalAmount: 2964000, employeeCount: 200 },
        { name: 'Performance Bonus', totalAmount: 4500000, employeeCount: 85 },
      ],
      deductions: [
        { name: 'Income Tax (TDS)', totalAmount: 4850000, employeeCount: 247 },
        { name: 'PF Contribution', totalAmount: 2910000, employeeCount: 235 },
        { name: 'ESI Contribution', totalAmount: 485000, employeeCount: 189 },
        { name: 'Professional Tax', totalAmount: 247000, employeeCount: 247 },
        { name: 'Leave Deduction', totalAmount: 247000, employeeCount: 45 },
      ],
      trend: [
        { month: '2026-01', grossPayroll: 47000000, totalDeductions: 8460000, netPayable: 38540000, employeeCount: 240 },
        { month: '2026-02', grossPayroll: 47200000, totalDeductions: 8496000, netPayable: 38704000, employeeCount: 242 },
        { month: '2026-03', grossPayroll: 47500000, totalDeductions: 8550000, netPayable: 38950000, employeeCount: 244 },
        { month: '2026-04', grossPayroll: 48000000, totalDeductions: 8640000, netPayable: 39360000, employeeCount: 245 },
        { month: '2026-05', grossPayroll: 48500000, totalDeductions: 8750000, netPayable: 39750000, employeeCount: 247 },
      ],
      compliance: {
        pfCollected: 2910000,
        pfDeposited: 2910000,
        esiCollected: 485000,
        esiDeposited: 485000,
        tdsCollected: 4850000,
        tdsDeposited: 4850000,
      },
      salaryRanges: [
        { range: '0-25000', min: 0, max: 25000, count: 45, percentage: 18.2 },
        { range: '25001-50000', min: 25001, max: 50000, count: 68, percentage: 27.5 },
        { range: '50001-100000', min: 50001, max: 100000, count: 72, percentage: 29.1 },
        { range: '100001-200000', min: 100001, max: 200000, count: 42, percentage: 17.0 },
        { range: '200001-500000', min: 200001, max: 500000, count: 18, percentage: 7.3 },
        { range: '500000+', min: 500001, max: 0, count: 2, percentage: 0.8 },
      ],
      topEarners: [
        { employeeId: 'EMP001', name: 'Vikram Anand', department: 'Engineering', grossSalary: 450000, netSalary: 382500 },
        { employeeId: 'EMP002', name: 'Priya Menon', department: 'Finance', grossSalary: 425000, netSalary: 361250 },
        { employeeId: 'EMP003', name: 'Rajesh Gupta', department: 'Operations', grossSalary: 380000, netSalary: 323000 },
      ],
      pendingPayments: [
        { employeeId: 'EMP156', name: 'Amit Shah', amount: 85000, reason: 'Bank Details Pending', pendingSince: '2026-05-25' },
        { employeeId: 'EMP178', name: 'Neha Singh', amount: 72000, reason: 'Documents Verification', pendingSince: '2026-05-26' },
        { employeeId: 'EMP189', name: 'Karthik Rajan', amount: 95000, reason: 'Salary Revision Pending', pendingSince: '2026-05-27' },
      ],
      generatedAt: new Date(),
    };

    // Save report
    try {
      const report = new Report({
        name: 'Payroll Analytics Report',
        type: 'payroll',
        data: metrics,
        generatedAt: new Date(),
        filters: params,
      });
      await report.save();
    } catch (error) {
      logger.error('Failed to save payroll report:', error);
    }

    return metrics;
  }
}

export const payrollAnalyticsService = new PayrollAnalyticsService();
