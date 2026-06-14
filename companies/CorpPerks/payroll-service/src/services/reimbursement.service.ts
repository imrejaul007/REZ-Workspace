import { Reimbursement } from '../models/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import type { IReimbursement, ApiResponse, ReimbursementRequest } from '../types/index.js';

export class ReimbursementService {
  /**
   * Get reimbursements for an employee
   */
  async getReimbursements(
    tenantId: string,
    employeeId: string,
    options: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<{ reimbursements: IReimbursement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = { tenantId, employeeId };
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) (query.expenseDate as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (query.expenseDate as Record<string, unknown>).$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [reimbursements, total] = await Promise.all([
      Reimbursement.find(query).sort({ expenseDate: -1 }).skip(skip).limit(limit),
      Reimbursement.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        reimbursements,
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
   * Submit a new reimbursement request
   */
  async submitReimbursement(
    tenantId: string,
    input: ReimbursementRequest,
    employeeName: string
  ): Promise<ApiResponse<IReimbursement>> {
    const { employeeId, type, amount, description, expenseDate, receipt, category, projectCode } = input;

    // Validate amount against limit
    if (amount > config.payroll.reimbursementLimit) {
      return {
        success: false,
        error: `Reimbursement amount exceeds limit of ₹${config.payroll.reimbursementLimit.toLocaleString()}`,
      };
    }

    // Check for duplicate (same employee, type, amount, date)
    const existing = await Reimbursement.findOne({
      tenantId,
      employeeId,
      type,
      amount,
      expenseDate: {
        $gte: new Date(new Date(expenseDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(expenseDate).setHours(23, 59, 59, 999)),
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'A similar reimbursement request already exists for this date',
      };
    }

    const reimbursement = new Reimbursement({
      tenantId,
      employeeId,
      employeeName,
      type,
      amount,
      description,
      expenseDate: new Date(expenseDate),
      status: 'pending',
      receipt,
      category,
      projectCode,
    });

    await reimbursement.save();

    logger.info('Reimbursement submitted', {
      tenantId,
      employeeId,
      type,
      amount,
      reimbursementId: reimbursement._id,
    });

    return {
      success: true,
      data: reimbursement,
      message: 'Reimbursement submitted successfully',
    };
  }

  /**
   * Approve or reject a reimbursement
   */
  async updateReimbursementStatus(
    tenantId: string,
    reimbursementId: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string
  ): Promise<ApiResponse<IReimbursement>> {
    const reimbursement = await Reimbursement.findOne({ _id: reimbursementId, tenantId });

    if (!reimbursement) {
      return { success: false, error: 'Reimbursement not found' };
    }

    if (reimbursement.status !== 'pending') {
      return {
        success: false,
        error: `Cannot update reimbursement with status: ${reimbursement.status}`,
      };
    }

    reimbursement.status = status;
    reimbursement.approvedBy = approvedBy;
    reimbursement.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      reimbursement.rejectionReason = rejectionReason;
    }

    await reimbursement.save();

    logger.info('Reimbursement status updated', {
      tenantId,
      reimbursementId,
      status,
      approvedBy,
    });

    return {
      success: true,
      data: reimbursement,
      message: `Reimbursement ${status}`,
    };
  }

  /**
   * Mark reimbursement as paid (after payroll processing)
   */
  async markAsPaid(
    tenantId: string,
    reimbursementId: string
  ): Promise<ApiResponse<IReimbursement>> {
    const reimbursement = await Reimbursement.findOne({ _id: reimbursementId, tenantId });

    if (!reimbursement) {
      return { success: false, error: 'Reimbursement not found' };
    }

    if (reimbursement.status !== 'approved') {
      return {
        success: false,
        error: 'Only approved reimbursements can be marked as paid',
      };
    }

    reimbursement.status = 'paid';
    reimbursement.paidAt = new Date();

    await reimbursement.save();

    return {
      success: true,
      data: reimbursement,
      message: 'Reimbursement marked as paid',
    };
  }

  /**
   * Get pending reimbursements for payroll processing
   */
  async getPendingForPayroll(
    tenantId: string,
    employeeId: string
  ): Promise<ApiResponse<{ total: number; reimbursements: IReimbursement[] }>> {
    const reimbursements = await Reimbursement.find({
      tenantId,
      employeeId,
      status: 'approved',
    }).sort({ expenseDate: -1 });

    const total = reimbursements.reduce((sum, r) => sum + r.amount, 0);

    return {
      success: true,
      data: { total, reimbursements },
    };
  }

  /**
   * Get reimbursement summary by type for an employee
   */
  async getReimbursementSummary(
    tenantId: string,
    employeeId: string,
    _fiscalYear?: string
  ): Promise<ApiResponse<{
    totalClaimed: number;
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    totalPaid: number;
    byType: { type: string; total: number; count: number }[];
  }>> {
    const query: Record<string, unknown> = { tenantId, employeeId };

    const reimbursements = await Reimbursement.find(query);

    const byTypeMap = new Map<string, { total: number; count: number }>();
    let totalClaimed = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let totalPaid = 0;

    for (const r of reimbursements) {
      totalClaimed += r.amount;

      if (r.status === 'approved') totalApproved += r.amount;
      else if (r.status === 'pending') totalPending += r.amount;
      else if (r.status === 'rejected') totalRejected += r.amount;
      else if (r.status === 'paid') totalPaid += r.amount;

      const existing = byTypeMap.get(r.type);
      if (existing) {
        existing.total += r.amount;
        existing.count += 1;
      } else {
        byTypeMap.set(r.type, { total: r.amount, count: 1 });
      }
    }

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      total: data.total,
      count: data.count,
    }));

    return {
      success: true,
      data: { totalClaimed, totalApproved, totalPending, totalRejected, totalPaid, byType },
    };
  }

  /**
   * Get all pending reimbursements for a tenant (HR dashboard)
   */
  async getAllPendingReimbursements(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ reimbursements: IReimbursement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = { tenantId, status: 'pending' };
    const skip = (page - 1) * limit;

    const [reimbursements, total] = await Promise.all([
      Reimbursement.find(query).sort({ expenseDate: -1 }).skip(skip).limit(limit),
      Reimbursement.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        reimbursements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}

export const reimbursementService = new ReimbursementService();
