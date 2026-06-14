import { v4 as uuidv4 } from 'uuid';
import { Workflow, IWorkflow } from '../models/Workflow';
import { Approval, IApproval } from '../models/Approval';
import { History, IHistory } from '../models/History';
import { logger } from 'utils/logger.js';
import { recordWorkflowOperation, updateWorkflowMetrics, workflowDuration } from '../utils/metrics';

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  type: 'content_review' | 'campaign_approval' | 'asset_publishing' | 'custom';
  contentId?: string;
  contentType?: string;
  stages: Array<{
    name: string;
    order: number;
    type: 'submission' | 'review' | 'approval' | 'publish';
    assignees: string[];
    requiredApprovals: number;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  assignedTo?: string;
  deadline?: string;
}

export interface WorkflowFilters {
  status?: string;
  type?: string;
  createdBy?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export class WorkflowService {
  async create(input: CreateWorkflowInput): Promise<IWorkflow> {
    try {
      const workflowId = `wf-${uuidv4()}`;
      const stages = input.stages.map((s, idx) => ({
        stageId: `stage-${uuidv4()}`,
        name: s.name,
        order: s.order,
        type: s.type,
        assignees: s.assignees,
        status: idx === 0 ? 'pending' : 'pending',
        requiredApprovals: s.requiredApprovals,
        currentApprovals: 0
      }));

      const workflow = new Workflow({
        workflowId,
        ...input,
        stages,
        currentStageIndex: 0,
        status: 'draft'
      });

      await workflow.save();
      await this.recordHistory(workflowId, null, 'workflow_created', input.createdBy, 'system', null, { input });

      recordWorkflowOperation('create', 'success');
      await updateWorkflowMetrics();

      logger.info('Workflow created', { workflowId, name: input.name });
      return workflow;
    } catch (error) {
      recordWorkflowOperation('create', 'error');
      logger.error('Failed to create workflow', { error, input });
      throw error;
    }
  }

  async findById(workflowId: string): Promise<IWorkflow | null> {
    try {
      const workflow = await Workflow.findOne({ workflowId });
      recordWorkflowOperation('read', workflow ? 'success' : 'not_found');
      return workflow;
    } catch (error) {
      recordWorkflowOperation('read', 'error');
      logger.error('Failed to find workflow', { error, workflowId });
      throw error;
    }
  }

  async findAll(filters: WorkflowFilters): Promise<{ workflows: IWorkflow[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.assignedTo) query.assignedTo = filters.assignedTo;

      const [workflows, total] = await Promise.all([
        Workflow.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Workflow.countDocuments(query)
      ]);

      recordWorkflowOperation('list', 'success');
      return { workflows, total };
    } catch (error) {
      recordWorkflowOperation('list', 'error');
      logger.error('Failed to list workflows', { error, filters });
      throw error;
    }
  }

  async update(workflowId: string, input: any): Promise<IWorkflow | null> {
    try {
      const workflow = await Workflow.findOneAndUpdate(
        { workflowId, status: 'draft' },
        { $set: input },
        { new: true, runValidators: true }
      );

      if (workflow) {
        recordWorkflowOperation('update', 'success');
        await updateWorkflowMetrics();
        logger.info('Workflow updated', { workflowId });
      } else {
        recordWorkflowOperation('update', 'not_found');
      }
      return workflow;
    } catch (error) {
      recordWorkflowOperation('update', 'error');
      logger.error('Failed to update workflow', { error, workflowId, input });
      throw error;
    }
  }

  async submit(workflowId: string, input: { submittedBy: string; comments?: string }): Promise<IWorkflow | null> {
    try {
      const workflow = await Workflow.findOne({ workflowId });
      if (!workflow) {
        recordWorkflowOperation('submit', 'not_found');
        return null;
      }

      if (workflow.status !== 'draft' && workflow.status !== 'rejected') {
        throw new Error('Workflow can only be submitted from draft or rejected state');
      }

      workflow.status = 'pending';
      workflow.stages[0].status = 'in_progress';
      await workflow.save();

      await this.recordHistory(workflowId, workflow.stages[0].stageId, 'workflow_submitted', input.submittedBy, 'system', null, { comments: input.comments });

      recordWorkflowOperation('submit', 'success');
      await updateWorkflowMetrics();

      logger.info('Workflow submitted', { workflowId, submittedBy: input.submittedBy });
      return workflow;
    } catch (error) {
      recordWorkflowOperation('submit', 'error');
      logger.error('Failed to submit workflow', { error, workflowId, input });
      throw error;
    }
  }

  async approve(
    workflowId: string,
    input: {
      approverId: string;
      approverName: string;
      decision: 'approve' | 'reject' | 'request_changes';
      comments?: string;
      delegatedTo?: string;
    }
  ): Promise<IWorkflow | null> {
    try {
      const workflow = await Workflow.findOne({ workflowId });
      if (!workflow) {
        recordWorkflowOperation('approve', 'not_found');
        return null;
      }

      if (!['pending', 'in_review'].includes(workflow.status)) {
        throw new Error('Workflow is not in a state that can be approved');
      }

      const currentStage = workflow.stages[workflow.currentStageIndex];

      // Create approval record
      const approval = new Approval({
        approvalId: `apr-${uuidv4()}`,
        workflowId,
        stageId: currentStage.stageId,
        approverId: input.approverId,
        approverName: input.approverName,
        status: input.decision === 'approve' ? 'approved' : input.decision === 'reject' ? 'rejected' : 'pending',
        decision: input.decision,
        comments: input.comments,
        delegatedTo: input.delegatedTo,
        decidedAt: new Date()
      });
      await approval.save();

      // Update stage
      currentStage.currentApprovals += 1;
      currentStage.approver = input.approverId;
      currentStage.comments = input.comments;

      if (input.decision === 'reject') {
        currentStage.status = 'rejected';
        workflow.status = 'rejected';
        await workflow.save();
        await this.recordHistory(workflowId, currentStage.stageId, 'workflow_rejected', input.approverId, input.approverName, { status: 'pending' }, { status: 'rejected', comments: input.comments });
      } else if (input.decision === 'request_changes') {
        await workflow.save();
        await this.recordHistory(workflowId, currentStage.stageId, 'changes_requested', input.approverId, input.approverName, null, { comments: input.comments });
      } else if (currentStage.currentApprovals >= currentStage.requiredApprovals) {
        currentStage.status = 'completed';
        currentStage.completedAt = new Date();

        // Move to next stage or complete workflow
        if (workflow.currentStageIndex < workflow.stages.length - 1) {
          workflow.currentStageIndex += 1;
          workflow.status = 'in_review';
          workflow.stages[workflow.currentStageIndex].status = 'in_progress';
        } else {
          workflow.status = 'approved';
          workflow.completedAt = new Date();
          // Record duration
          const duration = (workflow.completedAt.getTime() - workflow.createdAt.getTime()) / 1000;
          workflowDuration.labels(workflow.type).observe(duration);
        }
        await workflow.save();
        await this.recordHistory(workflowId, currentStage.stageId, 'stage_completed', input.approverId, input.approverName, { status: 'in_progress' }, { status: 'completed' });
      }

      recordWorkflowOperation('approve', 'success');
      await updateWorkflowMetrics();

      logger.info('Workflow approved', { workflowId, decision: input.decision });
      return workflow;
    } catch (error) {
      recordWorkflowOperation('approve', 'error');
      logger.error('Failed to approve workflow', { error, workflowId, input });
      throw error;
    }
  }

  async publish(workflowId: string, input: { publishedBy: string; comments?: string }): Promise<IWorkflow | null> {
    try {
      const workflow = await Workflow.findOne({ workflowId });
      if (!workflow) {
        recordWorkflowOperation('publish', 'not_found');
        return null;
      }

      if (workflow.status !== 'approved') {
        throw new Error('Workflow must be approved before publishing');
      }

      workflow.status = 'published';
      workflow.completedAt = new Date();
      await workflow.save();

      await this.recordHistory(workflowId, null, 'workflow_published', input.publishedBy, 'system', { status: 'approved' }, { status: 'published', comments: input.comments });

      recordWorkflowOperation('publish', 'success');
      await updateWorkflowMetrics();

      logger.info('Workflow published', { workflowId });
      return workflow;
    } catch (error) {
      recordWorkflowOperation('publish', 'error');
      logger.error('Failed to publish workflow', { error, workflowId });
      throw error;
    }
  }

  async getHistory(workflowId: string): Promise<IHistory[]> {
    try {
      return await History.find({ workflowId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Failed to get workflow history', { error, workflowId });
      throw error;
    }
  }

  async getApprovals(workflowId: string): Promise<IApproval[]> {
    try {
      return await Approval.find({ workflowId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Failed to get approvals', { error, workflowId });
      throw error;
    }
  }

  private async recordHistory(
    workflowId: string,
    stageId: string | null,
    action: string,
    actorId: string,
    actorName: string,
    previousState: any,
    newState: any
  ): Promise<void> {
    const history = new History({
      historyId: `hist-${uuidv4()}`,
      workflowId,
      stageId: stageId || undefined,
      action,
      actorId,
      actorName,
      previousState,
      newState
    });
    await history.save();
  }
}

export const workflowService = new WorkflowService();