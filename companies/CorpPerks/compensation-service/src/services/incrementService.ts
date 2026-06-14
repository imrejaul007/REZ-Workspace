import mongoose from 'mongoose';
import {
  IncrementPlan,
  IncrementPlanDocument,
  IncrementRequest,
  IncrementRequestDocument,
  CompensationPackage,
  SalaryBand,
} from '../models/index.js';
import {
  CreateIncrementPlanInput,
  PlanIncrementsInput,
  ApproveIncrementRequestInput,
} from '../validators/index.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export class IncrementService {
  async createPlan(data: CreateIncrementPlanInput): Promise<IncrementPlanDocument> {
    logger.info('Creating increment plan', { name: data.name, fiscalYear: data.fiscalYear });

    const plan = new IncrementPlan({
      ...data,
      plannedDate: new Date(data.plannedDate),
      status: 'draft',
    });

    await plan.save();

    logger.info('Increment plan created', { id: plan._id });
    return plan;
  }

  async findAllPlans(
    filters?: { fiscalYear?: string; status?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ plans: IncrementPlanDocument[]; total: number }> {
    const query: Record<string, any> = {};

    if (filters?.fiscalYear) {
      query.fiscalYear = filters.fiscalYear;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      IncrementPlan.find(query).sort({ fiscalYear: -1, createdAt: -1 }).skip(skip).limit(limit),
      IncrementPlan.countDocuments(query),
    ]);

    return { plans, total };
  }

  async findPlanById(id: string): Promise<IncrementPlanDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Increment plan not found');
    }

    const plan = await IncrementPlan.findById(id);
    if (!plan) {
      throw new NotFoundError('Increment plan not found');
    }

    return plan;
  }

  async approvePlan(planId: string, approvedBy: string): Promise<IncrementPlanDocument> {
    const plan = await this.findPlanById(planId);

    if (plan.status !== 'planned') {
      throw new ConflictError(`Cannot approve plan with status '${plan.status}'`);
    }

    plan.status = 'approved';
    plan.approvedBy = approvedBy;
    plan.approvedAt = new Date();

    await plan.save();

    logger.info('Increment plan approved', { id: plan._id, approvedBy });
    return plan;
  }

  async rejectPlan(planId: string, rejectedBy: string, reason: string): Promise<IncrementPlanDocument> {
    const plan = await this.findPlanById(planId);

    if (plan.status !== 'planned') {
      throw new ConflictError(`Cannot reject plan with status '${plan.status}'`);
    }

    plan.status = 'rejected';
    plan.approvedBy = rejectedBy;
    plan.approvedAt = new Date();

    await plan.save();

    logger.info('Increment plan rejected', { id: plan._id, rejectedBy, reason });
    return plan;
  }

  async planIncrements(data: PlanIncrementsInput): Promise<IncrementRequestDocument[]> {
    logger.info('Planning increments', { planId: data.planId, employeeCount: data.employeeIds.length });

    const plan = await this.findPlanById(data.planId);

    if (plan.status !== 'draft') {
      throw new ConflictError(`Cannot plan increments for plan with status '${plan.status}'`);
    }

    const effectiveDate = new Date(data.effectiveDate);
    const incrementRequests: IncrementRequestDocument[] = [];

    for (const employeeId of data.employeeIds) {
      const compensation = await CompensationPackage.findOne({ employeeId }).sort({ effectiveDate: -1 });

      if (!compensation) {
        logger.warn('No compensation found for employee', { employeeId });
        continue;
      }

      const proposedSalary = Math.round(compensation.salary * (1 + plan.percentage / 100));

      // Validate against band max
      const band = await SalaryBand.findById(compensation.bandId);
      const finalSalary = band && proposedSalary > band.maxSalary ? band.maxSalary : proposedSalary;

      const request = new IncrementRequest({
        employeeId,
        planId: plan._id,
        currentSalary: compensation.salary,
        proposedSalary: finalSalary,
        percentage: ((finalSalary - compensation.salary) / compensation.salary) * 100,
        effectiveDate,
        status: 'pending',
      });

      await request.save();
      incrementRequests.push(request);
    }

    // Update plan status to planned
    plan.status = 'planned';
    await plan.save();

    logger.info('Increments planned', {
      planId: plan._id,
      requestCount: incrementRequests.length,
    });

    return incrementRequests;
  }

  async approveIncrementRequest(
    requestId: string,
    approvedBy: string
  ): Promise<IncrementRequestDocument> {
    const request = await IncrementRequest.findById(requestId);

    if (!request) {
      throw new NotFoundError('Increment request not found');
    }

    if (request.status !== 'pending') {
      throw new ConflictError(`Cannot approve request with status '${request.status}'`);
    }

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    await request.save();

    logger.info('Increment request approved', { id: request._id, approvedBy });
    return request;
  }

  async rejectIncrementRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<IncrementRequestDocument> {
    const request = await IncrementRequest.findById(requestId);

    if (!request) {
      throw new NotFoundError('Increment request not found');
    }

    if (request.status !== 'pending') {
      throw new ConflictError(`Cannot reject request with status '${request.status}'`);
    }

    request.status = 'rejected';
    request.approvedBy = rejectedBy;
    request.approvedAt = new Date();
    request.rejectionReason = reason;

    await request.save();

    logger.info('Increment request rejected', { id: request._id, rejectedBy, reason });
    return request;
  }

  async findRequestsByPlanId(planId: string): Promise<IncrementRequestDocument[]> {
    return IncrementRequest.find({ planId }).sort({ createdAt: -1 });
  }

  async findRequestsByEmployeeId(employeeId: string): Promise<IncrementRequestDocument[]> {
    return IncrementRequest.find({ employeeId }).sort({ createdAt: -1 });
  }

  async findPendingRequests(): Promise<IncrementRequestDocument[]> {
    return IncrementRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
  }

  async processApprovedIncrements(planId: string): Promise<number> {
    const requests = await IncrementRequest.find({
      planId,
      status: 'approved',
    });

    let processed = 0;

    for (const request of requests) {
      const compensation = await CompensationPackage.findOne({ employeeId: request.employeeId }).sort({
        effectiveDate: -1,
      });

      if (compensation) {
        compensation.salary = request.proposedSalary;
        compensation.effectiveDate = request.effectiveDate;
        await compensation.save();
        processed++;
      }
    }

    logger.info('Approved increments processed', { planId, processed });
    return processed;
  }
}

export const incrementService = new IncrementService();
