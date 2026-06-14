import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Workflow, WorkflowInstance } from '../models/Workflow';
import {
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  InitiateWorkflowSchema,
  ApproveStepSchema,
  RejectWorkflowSchema,
  CancelWorkflowSchema,
  WorkflowQuerySchema,
  InstanceQuerySchema,
  PendingApprovalsQuerySchema
} from '../models/schemas';

export class WorkflowController {
  // Create a new workflow template
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = CreateWorkflowSchema.parse(req.body);

      // Assign order to steps
      const steps = validatedData.steps.map((step, index) => ({
        ...step,
        order: index + 1
      }));

      const workflow = new Workflow({
        ...validatedData,
        steps
      });

      await workflow.save();

      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // List workflow templates
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = WorkflowQuerySchema.parse(req.query);

      const filter: Record<string, unknown> = {};
      if (query.ownerId) filter.ownerId = query.ownerId;
      if (query.departmentId) filter.departmentId = query.departmentId;
      if (query.category) filter.category = query.category;
      if (query.type) filter.type = query.type;
      if (query.status) filter.status = query.status;

      const skip = (query.page - 1) * query.limit;

      const [workflows, total] = await Promise.all([
        Workflow.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(query.limit)
          .lean(),
        Workflow.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: workflows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Get single workflow template
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid workflow ID'
        });
        return;
      }

      const workflow = await Workflow.findById(id).lean();

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      // Get instance count
      const instanceCount = await WorkflowInstance.countDocuments({ workflowId: id });

      res.json({
        success: true,
        data: {
          ...workflow,
          instanceCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update workflow template
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateWorkflowSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid workflow ID'
        });
        return;
      }

      const workflow = await Workflow.findById(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      // If updating steps, reassign order
      if (validatedData.steps) {
        validatedData.steps = validatedData.steps.map((step, index) => ({
          ...step,
          order: index + 1
        }));
      }

      // Increment version if workflow is active
      if (validatedData.status === 'active' && workflow.status !== 'active') {
        validatedData.status = 'active';
      }

      Object.assign(workflow, validatedData);
      await workflow.save();

      res.json({
        success: true,
        data: workflow
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Delete workflow template
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid workflow ID'
        });
        return;
      }

      // Check for active instances
      const activeInstances = await WorkflowInstance.countDocuments({
        workflowId: id,
        status: { $in: ['pending', 'in_progress'] }
      });

      if (activeInstances > 0) {
        res.status(400).json({
          success: false,
          error: `Cannot delete workflow with ${activeInstances} active instances`
        });
        return;
      }

      const workflow = await Workflow.findByIdAndDelete(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Initiate a workflow instance
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = InitiateWorkflowSchema.parse(req.body);

      const workflow = await Workflow.findById(validatedData.workflowId);

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      if (workflow.status !== 'active') {
        res.status(400).json({
          success: false,
          error: 'Workflow is not active'
        });
        return;
      }

      // Check if conditions are met
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = workflow.conditions.every(condition => {
          const fieldValue = validatedData.data[condition.field];
          switch (condition.operator) {
            case 'eq': return fieldValue === condition.value;
            case 'neq': return fieldValue !== condition.value;
            case 'gt': return Number(fieldValue) > Number(condition.value);
            case 'lt': return Number(fieldValue) < Number(condition.value);
            case 'gte': return Number(fieldValue) >= Number(condition.value);
            case 'lte': return Number(fieldValue) <= Number(condition.value);
            case 'contains': return String(fieldValue).includes(String(condition.value));
            case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            default: return false;
          }
        });

        if (!conditionsMet) {
          res.status(400).json({
            success: false,
            error: 'Data does not meet workflow conditions'
          });
          return;
        }
      }

      // Create instance
      const instance = new WorkflowInstance({
        workflowId: workflow._id,
        workflowName: workflow.name,
        workflowVersion: workflow.version,
        initiatorId: validatedData.initiatorId,
        initiatorName: validatedData.initiatorName,
        currentStepIndex: 0,
        status: 'pending',
        data: validatedData.data,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        stepHistory: workflow.steps.map(step => ({
          stepId: step._id.toString(),
          stepName: step.name,
          action: step.action,
          status: 'pending' as const
        }))
      });

      // If first step is auto-complete, skip it
      const firstStep = workflow.steps[0];
      if (firstStep.action === 'complete' || firstStep.action === 'notify') {
        instance.stepHistory[0].status = 'approved';
        instance.stepHistory[0].actionAt = new Date();
        instance.currentStepIndex = 1;
        instance.status = 'in_progress';
      }

      await instance.save();

      res.status(201).json({
        success: true,
        data: instance
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // List workflow instances
  async listInstances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = InstanceQuerySchema.parse(req.query);

      const filter: Record<string, unknown> = {};
      if (query.workflowId) filter.workflowId = new mongoose.Types.ObjectId(query.workflowId);
      if (query.initiatorId) filter.initiatorId = query.initiatorId;
      if (query.status) filter.status = query.status;

      const skip = (query.page - 1) * query.limit;

      const [instances, total] = await Promise.all([
        WorkflowInstance.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(query.limit)
          .lean(),
        WorkflowInstance.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: instances,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Get workflow instance by ID
  async getInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid instance ID'
        });
        return;
      }

      const instance = await WorkflowInstance.findById(id)
        .populate('workflowId')
        .lean();

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      res.json({
        success: true,
        data: instance
      });
    } catch (error) {
      next(error);
    }
  }

  // Approve current step
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { stepIndex, comments, action } = ApproveStepSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid instance ID'
        });
        return;
      }

      const instance = await WorkflowInstance.findById(id);

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      if (instance.status === 'approved' || instance.status === 'rejected' || instance.status === 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Instance is already completed'
        });
        return;
      }

      const workflow = await Workflow.findById(instance.workflowId);
      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      const targetStepIndex = stepIndex ?? instance.currentStepIndex;
      const currentStep = workflow.steps[targetStepIndex];

      if (!currentStep) {
        res.status(400).json({
          success: false,
          error: 'Invalid step index'
        });
        return;
      }

      // Update step history
      instance.stepHistory[targetStepIndex].status = 'approved';
      instance.stepHistory[targetStepIndex].actionAt = new Date();
      instance.stepHistory[targetStepIndex].actionBy = req.headers['x-user-id'] as string || 'unknown';
      instance.stepHistory[targetStepIndex].action = action || currentStep.action;

      if (comments) {
        instance.approverComments = instance.approverComments || {};
        instance.approverComments[currentStep._id.toString()] = comments;
      }

      // Move to next step or complete
      const nextStepIndex = targetStepIndex + 1;
      if (nextStepIndex >= workflow.steps.length) {
        instance.status = 'approved';
        instance.completedAt = new Date();
      } else {
        const nextStep = workflow.steps[nextStepIndex];
        if (nextStep.action === 'complete' || nextStep.action === 'notify') {
          instance.stepHistory[nextStepIndex].status = 'approved';
          instance.stepHistory[nextStepIndex].actionAt = new Date();
          // Skip auto steps
          let skipIndex = nextStepIndex + 1;
          while (skipIndex < workflow.steps.length) {
            const skipStep = workflow.steps[skipIndex];
            if (skipStep.action === 'complete' || skipStep.action === 'notify') {
              instance.stepHistory[skipIndex].status = 'approved';
              instance.stepHistory[skipIndex].actionAt = new Date();
              skipIndex++;
            } else {
              break;
            }
          }
          if (skipIndex >= workflow.steps.length) {
            instance.status = 'approved';
            instance.completedAt = new Date();
          } else {
            instance.currentStepIndex = skipIndex;
            instance.status = 'in_progress';
          }
        } else {
          instance.currentStepIndex = nextStepIndex;
          instance.status = 'in_progress';
        }
      }

      await instance.save();

      res.json({
        success: true,
        data: {
          instanceId: instance._id,
          status: instance.status,
          currentStepIndex: instance.currentStepIndex,
          completedAt: instance.completedAt
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Reject workflow instance
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { stepIndex, reason } = RejectWorkflowSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid instance ID'
        });
        return;
      }

      const instance = await WorkflowInstance.findById(id);

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      if (instance.status === 'approved' || instance.status === 'rejected' || instance.status === 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Instance is already completed'
        });
        return;
      }

      const workflow = await Workflow.findById(instance.workflowId);
      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }

      const targetStepIndex = stepIndex ?? instance.currentStepIndex;
      const currentStep = workflow.steps[targetStepIndex];

      // Update step history
      instance.stepHistory[targetStepIndex].status = 'rejected';
      instance.stepHistory[targetStepIndex].actionAt = new Date();
      instance.stepHistory[targetStepIndex].actionBy = req.headers['x-user-id'] as string || 'unknown';
      instance.stepHistory[targetStepIndex].comments = reason;

      instance.status = 'rejected';
      instance.cancelledAt = new Date();
      instance.cancellationReason = reason;
      instance.cancelledBy = req.headers['x-user-id'] as string || 'unknown';

      await instance.save();

      res.json({
        success: true,
        data: {
          instanceId: instance._id,
          status: instance.status,
          rejectedAt: instance.cancelledAt,
          reason: instance.cancellationReason
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Cancel workflow instance
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = CancelWorkflowSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid instance ID'
        });
        return;
      }

      const instance = await WorkflowInstance.findById(id);

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      if (instance.status === 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Instance is already cancelled'
        });
        return;
      }

      instance.status = 'cancelled';
      instance.cancelledAt = new Date();
      instance.cancellationReason = reason;
      instance.cancelledBy = req.headers['x-user-id'] as string || 'unknown';

      await instance.save();

      res.json({
        success: true,
        data: {
          instanceId: instance._id,
          status: instance.status,
          cancelledAt: instance.cancelledAt,
          reason: instance.cancellationReason
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Get pending approvals for a user
  async getPendingApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = PendingApprovalsQuerySchema.parse(req.query);

      const filter: Record<string, unknown> = {
        status: { $in: ['pending', 'in_progress'] }
      };

      if (status) filter.status = status;

      // Find workflows where user is an approver
      const workflows = await Workflow.find({
        'steps.approverId': userId,
        status: 'active'
      }).lean();

      const workflowIds = workflows.map(w => w._id);

      // Find instances at steps where user is the approver
      const instances = await WorkflowInstance.find(filter)
        .populate({
          path: 'workflowId',
          select: 'name steps'
        })
        .lean();

      const pendingForUser = instances.filter(instance => {
        const workflow = instance.workflowId as unknown as typeof workflows[0];
        if (!workflow) return false;

        const currentStep = workflow.steps[instance.currentStepIndex];
        if (!currentStep) return false;

        return currentStep.approverId === userId && workflowIds.includes(workflow._id);
      });

      // Add step details
      const enrichedInstances = pendingForUser.map(instance => {
        const workflow = instance.workflowId as unknown as typeof workflows[0];
        const currentStep = workflow?.steps[instance.currentStepIndex];

        return {
          ...instance,
          currentStepDetails: currentStep
        };
      });

      res.json({
        success: true,
        data: enrichedInstances,
        count: enrichedInstances.length
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Get workflow statistics
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workflowId } = req.query;

      const filter: Record<string, unknown> = {};
      if (workflowId) filter.workflowId = new mongoose.Types.ObjectId(workflowId as string);

      const [
        totalInstances,
        pendingInstances,
        approvedInstances,
        rejectedInstances,
        cancelledInstances,
        recentInstances
      ] = await Promise.all([
        WorkflowInstance.countDocuments(filter),
        WorkflowInstance.countDocuments({ ...filter, status: 'pending' }),
        WorkflowInstance.countDocuments({ ...filter, status: 'approved' }),
        WorkflowInstance.countDocuments({ ...filter, status: 'rejected' }),
        WorkflowInstance.countDocuments({ ...filter, status: 'cancelled' }),
        WorkflowInstance.find(filter)
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      ]);

      // Calculate average completion time
      const completedInstances = await WorkflowInstance.find({
        ...filter,
        status: 'approved',
        completedAt: { $exists: true }
      })
        .select('createdAt completedAt')
        .lean();

      let avgCompletionTime = 0;
      if (completedInstances.length > 0) {
        const totalTime = completedInstances.reduce((sum, inst) => {
          const created = new Date(inst.createdAt).getTime();
          const completed = new Date(inst.completedAt!).getTime();
          return sum + (completed - created);
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedInstances.length / (1000 * 60)); // minutes
      }

      res.json({
        success: true,
        data: {
          total: totalInstances,
          pending: pendingInstances,
          approved: approvedInstances,
          rejected: rejectedInstances,
          cancelled: cancelledInstances,
          approvalRate: totalInstances > 0
            ? Math.round((approvedInstances / totalInstances) * 100)
            : 0,
          avgCompletionTimeMinutes: avgCompletionTime,
          recentInstances
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get categories and types
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await Workflow.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      const types = await Workflow.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          categories: categories.map(c => ({ name: c._id, count: c.count })),
          types: types.map(t => ({ name: t._id, count: t.count }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const workflowController = new WorkflowController();
