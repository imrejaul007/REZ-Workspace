import { SalaryAdvance } from '../models/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import type { ISalaryAdvance, ApiResponse, SalaryAdvanceRequest } from '../types/index.js';

export class AdvanceService {
  /**
   * Request a salary advance
   */
  async requestAdvance(
    tenantId: string,
    input: SalaryAdvanceRequest,
    employeeName: string
  ): Promise<ApiResponse<ISalaryAdvance>> {
    const { employeeId, amount, reason, expectedDeductionMonth, expectedDeductionYear } = input;

    // Check for existing pending/approved advance for the same month
    const existingAdvance = await SalaryAdvance.findOne({
      tenantId,
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { expectedDeductionMonth, expectedDeductionYear },
        {
          expectedDeductionMonth: { $gte: expectedDeductionMonth },
          expectedDeductionYear: expectedDeductionYear,
        },
      ],
    });

    if (existingAdvance) {
      return {
        success: false,
        error: 'You already have a pending or approved salary advance for this period',
      };
    }

    // Validate deduction month/year is in the future
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (
      expectedDeductionYear < currentYear ||
      (expectedDeductionYear === currentYear && expectedDeductionMonth <= currentMonth)
    ) {
      return {
        success: false,
        error: 'Deduction must be scheduled for a future month',
      };
    }

    const advance = new SalaryAdvance({
      tenantId,
      employeeId,
      employeeName,
      requestedAmount: amount,
      approvedAmount: 0,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      expectedDeductionMonth,
      expectedDeductionYear,
    });

    await advance.save();

    logger.info('Salary advance requested', {
      tenantId,
      employeeId,
      amount,
      advanceId: advance._id,
    });

    return {
      success: true,
      data: advance,
      message: 'Salary advance request submitted',
    };
  }

  /**
   * Get salary advances for an employee
   */
  async getEmployeeAdvances(
    tenantId: string,
    employeeId: string,
    status?: string
  ): Promise<ApiResponse<ISalaryAdvance[]>> {
    const query: Record<string, unknown> = { tenantId, employeeId };
    if (status) query.status = status;

    const advances = await SalaryAdvance.find(query).sort({ requestedAt: -1 });

    return { success: true, data: advances };
  }

  /**
   * Approve or reject a salary advance
   */
  async approveAdvance(
    tenantId: string,
    advanceId: string,
    approvedBy: string,
    approvedAmount: number,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<ApiResponse<ISalaryAdvance>> {
    const advance = await SalaryAdvance.findOne({ _id: advanceId, tenantId });

    if (!advance) {
      return { success: false, error: 'Salary advance not found' };
    }

    if (advance.status !== 'pending') {
      return {
        success: false,
        error: `Cannot modify advance with status: ${advance.status}`,
      };
    }

    if (status === 'approved') {
      advance.status = 'approved';
      advance.approvedAmount = approvedAmount;
      advance.approvedBy = approvedBy;
      advance.approvedAt = new Date();
    } else {
      advance.status = 'rejected';
      advance.approvedBy = approvedBy;
      advance.approvedAt = new Date();
      if (rejectionReason) {
        advance.rejectionReason = rejectionReason;
      }
    }

    await advance.save();

    logger.info('Salary advance processed', {
      tenantId,
      advanceId,
      status,
      approvedAmount: status === 'approved' ? approvedAmount : undefined,
      approvedBy,
    });

    return {
      success: true,
      data: advance,
      message: `Salary advance ${status}`,
    };
  }

  /**
   * Mark advance as deducted (after payroll processing)
   */
  async markAsDeducted(
    tenantId: string,
    advanceId: string,
    actualMonth: number,
    actualYear: number
  ): Promise<ApiResponse<ISalaryAdvance>> {
    const advance = await SalaryAdvance.findOne({ _id: advanceId, tenantId });

    if (!advance) {
      return { success: false, error: 'Salary advance not found' };
    }

    if (advance.status !== 'approved') {
      return {
        success: false,
        error: 'Only approved advances can be marked as deducted',
      };
    }

    advance.status = 'deducted';
    advance.actualDeductionMonth = actualMonth;
    advance.actualDeductionYear = actualYear;

    await advance.save();

    logger.info('Salary advance deducted', {
      tenantId,
      advanceId,
      actualMonth,
      actualYear,
    });

    return {
      success: true,
      data: advance,
      message: 'Salary advance deducted from salary',
    };
  }

  /**
   * Cancel a salary advance request
   */
  async cancelAdvance(
    tenantId: string,
    advanceId: string,
    employeeId: string
  ): Promise<ApiResponse<ISalaryAdvance>> {
    const advance = await SalaryAdvance.findOne({ _id: advanceId, tenantId, employeeId });

    if (!advance) {
      return { success: false, error: 'Salary advance not found' };
    }

    if (advance.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending advances can be cancelled',
      };
    }

    advance.status = 'cancelled';
    await advance.save();

    return {
      success: true,
      data: advance,
      message: 'Salary advance cancelled',
    };
  }

  /**
   * Get pending advances for a tenant (HR dashboard)
   */
  async getPendingAdvances(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ advances: ISalaryAdvance[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = { tenantId, status: 'pending' };
    const skip = (page - 1) * limit;

    const [advances, total] = await Promise.all([
      SalaryAdvance.find(query).sort({ requestedAt: -1 }).skip(skip).limit(limit),
      SalaryAdvance.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        advances,
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
   * Get advances due for deduction in a specific month
   */
  async getAdvancesForDeduction(
    tenantId: string,
    month: number,
    year: number
  ): Promise<ApiResponse<ISalaryAdvance[]>> {
    const advances = await SalaryAdvance.find({
      tenantId,
      status: 'approved',
      expectedDeductionMonth: month,
      expectedDeductionYear: year,
    });

    return { success: true, data: advances };
  }

  /**
   * Calculate maximum advance amount for an employee
   */
  async calculateMaxAdvance(
    _tenantId: string,
    _employeeId: string
  ): Promise<ApiResponse<{ maxAdvance: number; reason: string }>> {
    // In production, fetch employee's salary from payroll/employee service
    // For now, use a default gross salary
    const defaultGrossSalary = 50000;
    const maxAdvancePercentage = config.payroll.maxAdvancePercentage;

    const maxAdvance = Math.round(defaultGrossSalary * maxAdvancePercentage);

    return {
      success: true,
      data: {
        maxAdvance,
        reason: `Up to ${maxAdvancePercentage * 100}% of gross salary (₹${defaultGrossSalary.toLocaleString()})`,
      },
    };
  }
}

export const advanceService = new AdvanceService();
