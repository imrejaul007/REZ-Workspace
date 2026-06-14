import { v4 as uuidv4 } from 'uuid';
import {
  ApprovalWorkflow,
  ApprovalStep,
  ContentSubmission,
  ApprovalAction,
  Notification,
  ApprovalStatus,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  SubmitContentInput,
  ApprovalActionInput
} from '../types';
import logger from '../utils/logger';

class WorkflowService {
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private submissions: Map<string, ContentSubmission> = new Map();
  private actions: Map<string, ApprovalAction> = new Map();
  private notifications: Map<string, Notification> = new Map();

  // Workflow CRUD
  createWorkflow(input: CreateWorkflowInput, tenantId: string): ApprovalWorkflow {
    const id = uuidv4();
    const now = new Date();

    const steps: ApprovalStep[] = input.steps.map((step, index) => ({
      id: uuidv4(),
      name: step.name,
      type: step.type,
      order: index,
      approverRole: step.approverRole,
      requiredApprovals: step.requiredApprovals,
      createdAt: now,
      updatedAt: now
    }));

    const workflow: ApprovalWorkflow = {
      id,
      name: input.name,
      description: input.description,
      steps,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.workflows.set(`${tenantId}:${id}`, workflow);
    logger.info(`Workflow created: ${id} for tenant: ${tenantId}`);

    return workflow;
  }

  getWorkflow(id: string, tenantId: string): ApprovalWorkflow | undefined {
    return this.workflows.get(`${tenantId}:${id}`);
  }

  getAllWorkflows(tenantId: string): ApprovalWorkflow[] {
    const workflows: ApprovalWorkflow[] = [];
    this.workflows.forEach((workflow, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        workflows.push(workflow);
      }
    });
    return workflows;
  }

  updateWorkflow(id: string, input: UpdateWorkflowInput, tenantId: string): ApprovalWorkflow | undefined {
    const key = `${tenantId}:${id}`;
    const workflow = this.workflows.get(key);

    if (!workflow) {
      return undefined;
    }

    const updatedWorkflow: ApprovalWorkflow = {
      ...workflow,
      name: input.name ?? workflow.name,
      description: input.description ?? workflow.description,
      isActive: input.isActive ?? workflow.isActive,
      steps: input.steps
        ? input.steps.map((step, index) => ({
            ...step,
            id: uuidv4(),
            order: index,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        : workflow.steps,
      updatedAt: new Date()
    };

    this.workflows.set(key, updatedWorkflow);
    logger.info(`Workflow updated: ${id} for tenant: ${tenantId}`);

    return updatedWorkflow;
  }

  deleteWorkflow(id: string, tenantId: string): boolean {
    const key = `${tenantId}:${id}`;
    const deleted = this.workflows.delete(key);
    if (deleted) {
      logger.info(`Workflow deleted: ${id} for tenant: ${tenantId}`);
    }
    return deleted;
  }

  // Content Submission
  submitContent(input: SubmitContentInput, submittedBy: string, tenantId: string): ContentSubmission | undefined {
    const workflow = this.getWorkflow(input.workflowId, tenantId);
    if (!workflow) {
      logger.warn(`Workflow not found: ${input.workflowId}`);
      return undefined;
    }

    const id = uuidv4();
    const now = new Date();

    const submission: ContentSubmission = {
      id,
      contentId: input.contentId,
      workflowId: input.workflowId,
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      submittedBy,
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.submissions.set(`${tenantId}:${id}`, submission);

    // Create notification for first step approvers
    this.createNotification({
      userId: submittedBy,
      type: 'approval_request',
      title: 'Content Submitted',
      message: `Content ${input.contentId} has been submitted for approval`,
      referenceId: id,
      referenceType: 'submission'
    });

    logger.info(`Content submitted: ${id} for content: ${input.contentId}`);
    return submission;
  }

  getSubmission(id: string, tenantId: string): ContentSubmission | undefined {
    return this.submissions.get(`${tenantId}:${id}`);
  }

  getSubmissions(tenantId: string, options?: {
    status?: ApprovalStatus;
    contentId?: string;
    page?: number;
    limit?: number;
  }): { submissions: ContentSubmission[]; total: number } {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    let submissions: ContentSubmission[] = [];
    this.submissions.forEach((submission, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        if (options?.status && submission.status !== options.status) return;
        if (options?.contentId && submission.contentId !== options.contentId) return;
        submissions.push(submission);
      }
    });

    const total = submissions.length;
    submissions = submissions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * limit, page * limit);

    return { submissions, total };
  }

  // Approval Actions
  performAction(
    submissionId: string,
    input: ApprovalActionInput,
    performedBy: string,
    tenantId: string
  ): { submission: ContentSubmission; action: ApprovalAction } | undefined {
    const submission = this.getSubmission(submissionId, tenantId);
    if (!submission) {
      logger.warn(`Submission not found: ${submissionId}`);
      return undefined;
    }

    const workflow = this.getWorkflow(submission.workflowId, tenantId);
    if (!workflow) {
      logger.warn(`Workflow not found: ${submission.workflowId}`);
      return undefined;
    }

    const currentStep = workflow.steps[submission.currentStep];
    if (!currentStep) {
      logger.warn(`Invalid step index: ${submission.currentStep}`);
      return undefined;
    }

    // Create approval action
    const action: ApprovalAction = {
      id: uuidv4(),
      submissionId,
      stepIndex: submission.currentStep,
      action: input.action,
      comment: input.comment,
      performedBy,
      performedAt: new Date(),
      createdAt: new Date()
    };

    this.actions.set(`${tenantId}:${action.id}`, action);

    // Update submission status based on action
    let newStatus = submission.status;
    let completed = false;

    switch (input.action) {
      case 'approve':
        if (submission.currentStep >= workflow.steps.length - 1) {
          // Final approval
          newStatus = ApprovalStatus.APPROVED;
          completed = true;
        } else {
          // Move to next step
          submission.currentStep += 1;
          newStatus = ApprovalStatus.IN_REVIEW;
        }
        this.createNotification({
          userId: submission.submittedBy,
          type: 'approval_request',
          title: 'Approval Given',
          message: `Your content has been approved at step ${submission.currentStep}`,
          referenceId: submissionId,
          referenceType: 'submission'
        });
        break;

      case 'reject':
        newStatus = ApprovalStatus.REJECTED;
        completed = true;
        this.createNotification({
          userId: submission.submittedBy,
          type: 'approval_rejected',
          title: 'Content Rejected',
          message: `Your content has been rejected: ${input.comment || 'No comment'}`,
          referenceId: submissionId,
          referenceType: 'submission'
        });
        break;

      case 'request_revision':
        newStatus = ApprovalStatus.REVISION_REQUESTED;
        this.createNotification({
          userId: submission.submittedBy,
          type: 'revision_requested',
          title: 'Revision Requested',
          message: `Changes requested: ${input.comment || 'No comment'}`,
          referenceId: submissionId,
          referenceType: 'submission'
        });
        break;
    }

    const updatedSubmission: ContentSubmission = {
      ...submission,
      status: newStatus,
      currentStep: submission.currentStep,
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date()
    };

    this.submissions.set(`${tenantId}:${submissionId}`, updatedSubmission);
    logger.info(`Action performed on submission: ${submissionId}, action: ${input.action}`);

    return { submission: updatedSubmission, action };
  }

  getSubmissionHistory(submissionId: string, tenantId: string): ApprovalAction[] {
    const actions: ApprovalAction[] = [];
    this.actions.forEach((action, key) => {
      if (key.startsWith(`${tenantId}:`) && action.submissionId === submissionId) {
        actions.push(action);
      }
    });
    return actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Notifications
  createNotification(input: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    const notification: Notification = {
      id: uuidv4(),
      ...input,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getUserNotifications(userId: string, tenantId: string): Notification[] {
    const notifications: Notification[] = [];
    this.notifications.forEach((notification) => {
      if (notification.userId === userId) {
        notifications.push(notification);
      }
    });
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationRead(id: string, tenantId: string): boolean {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): number {
    let count = 0;
    this.notifications.forEach((notification) => {
      if (notification.userId === userId && !notification.isRead) {
        notification.isRead = true;
        count++;
      }
    });
    return count;
  }
}

export default new WorkflowService();
