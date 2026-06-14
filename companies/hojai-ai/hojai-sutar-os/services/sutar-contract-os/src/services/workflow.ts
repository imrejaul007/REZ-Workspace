// ============================================================================
// SUTAR Contract OS - Workflow Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import { Workflow, WorkflowStep, WorkflowApprover, WorkflowNotification, WorkflowStatus, WorkflowStepStatus } from '../types/index';

// In-memory store for workflows
const workflowStore = new Map<string, Workflow>();

// Workflow Templates
const workflowTemplates = new Map<string, {
  name: string;
  type: 'sequential' | 'parallel' | 'conditional';
  steps: Omit<WorkflowStep, 'id' | 'status' | 'currentApprovals' | 'approverId' | 'completedAt'>[];
}>();

// Initialize default workflow templates
const initializeWorkflowTemplates = (): void => {
  // Standard approval workflow
  workflowTemplates.set('standard-approval', {
    name: 'Standard Approval',
    type: 'sequential',
    steps: [
      { name: 'Legal Review', description: 'Review by legal team', approverRole: 'legal', order: 1, requiredApprovals: 1, deadline: '3d' },
      { name: 'Finance Review', description: 'Review by finance team', approverRole: 'finance', order: 2, requiredApprovals: 1, deadline: '2d' },
      { name: 'Management Approval', description: 'Final approval by management', approverRole: 'manager', order: 3, requiredApprovals: 1, deadline: '1d' },
    ],
  });

  // High-value contract workflow
  workflowTemplates.set('high-value', {
    name: 'High Value Contract',
    type: 'sequential',
    steps: [
      { name: 'Initial Review', description: 'Initial contract review', approverRole: 'legal', order: 1, requiredApprovals: 1, deadline: '5d' },
      { name: 'Risk Assessment', description: 'Risk assessment by compliance', approverRole: 'compliance', order: 2, requiredApprovals: 2, deadline: '3d' },
      { name: 'Finance Approval', description: 'Finance team approval', approverRole: 'finance', order: 3, requiredApprovals: 1, deadline: '2d' },
      { name: 'Executive Approval', description: 'C-level approval', approverRole: 'executive', order: 4, requiredApprovals: 1, deadline: '1d' },
    ],
  });

  // NDA workflow
  workflowTemplates.set('nda-fast-track', {
    name: 'NDA Fast Track',
    type: 'sequential',
    steps: [
      { name: 'Legal Quick Review', description: 'Quick legal review', approverRole: 'legal', order: 1, requiredApprovals: 1, deadline: '1d' },
      { name: 'Approval', description: 'Final approval', approverRole: 'manager', order: 2, requiredApprovals: 1, deadline: '4h' },
    ],
  });

  // Partnership workflow
  workflowTemplates.set('partnership', {
    name: 'Partnership Agreement',
    type: 'sequential',
    steps: [
      { name: 'Business Review', description: 'Review by business development', approverRole: 'business', order: 1, requiredApprovals: 1, deadline: '5d' },
      { name: 'Legal Review', description: 'Legal team review', approverRole: 'legal', order: 2, requiredApprovals: 2, deadline: '5d' },
      { name: 'Finance Review', description: 'Financial assessment', approverRole: 'finance', order: 3, requiredApprovals: 1, deadline: '3d' },
      { name: 'Executive Approval', description: 'Executive sign-off', approverRole: 'executive', order: 4, requiredApprovals: 1, deadline: '2d' },
    ],
  });

  // Parallel approval workflow
  workflowTemplates.set('parallel-review', {
    name: 'Parallel Review',
    type: 'parallel',
    steps: [
      { name: 'Legal Review', description: 'Simultaneous legal review', approverRole: 'legal', order: 1, requiredApprovals: 1, deadline: '3d' },
      { name: 'Finance Review', description: 'Simultaneous finance review', approverRole: 'finance', order: 1, requiredApprovals: 1, deadline: '3d' },
      { name: 'Compliance Review', description: 'Simultaneous compliance review', approverRole: 'compliance', order: 1, requiredApprovals: 1, deadline: '3d' },
      { name: 'Final Approval', description: 'Final management approval', approverRole: 'manager', order: 2, requiredApprovals: 1, deadline: '1d' },
    ],
  });
};

initializeWorkflowTemplates();

// Helper function to calculate deadline
const calculateDeadline = (deadline: string | undefined, startDate: Date): Date => {
  if (!deadline) return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

  const match = deadline.match(/^(\d+)([dh])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const multiplier = unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return new Date(startDate.getTime() + value * multiplier);
  }
  return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
};

// Workflow Service Functions
export const workflowService = {
  // List all workflow templates
  listWorkflowTemplates: (): { templates: Array<{ id: string; name: string; type: string; stepCount: number }> } => {
    const templates = Array.from(workflowTemplates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      type: template.type,
      stepCount: template.steps.length,
    }));
    return { templates };
  },

  // Get workflow template
  getWorkflowTemplate: (templateId: string): { id: string; name: string; type: string; steps: WorkflowStep[] } | undefined => {
    const template = workflowTemplates.get(templateId);
    if (!template) return undefined;

    return {
      id: templateId,
      name: template.name,
      type: template.type,
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step-${index + 1}`,
        status: 'pending' as WorkflowStepStatus,
        currentApprovals: 0,
        approverId: [],
      })),
    };
  },

  // Start a new workflow
  startWorkflow: (contractId: string, templateId: string, options?: {
    customSteps?: Partial<WorkflowStep>[];
    deadline?: string;
  }): Workflow | undefined => {
    const template = workflowTemplates.get(templateId);
    if (!template) return undefined;

    const startDate = new Date();
    const steps: WorkflowStep[] = (options?.customSteps || template.steps).map((step, index) => ({
      id: `step-${uuidv4()}`,
      name: step.name || `Step ${index + 1}`,
      description: step.description,
      approverRole: step.approverRole || 'reviewer',
      approverId: step.approverId,
      approverEmail: step.approverEmail,
      status: index === 0 ? 'pending' : 'pending',
      order: step.order || index + 1,
      requiredApprovals: step.requiredApprovals || 1,
      currentApprovals: 0,
      approverId: (step.approverId || []) as WorkflowApprover[],
      deadline: step.deadline || calculateDeadline(undefined, startDate).toISOString(),
      condition: step.condition,
    }));

    const workflow: Workflow = {
      id: `workflow-${uuidv4()}`,
      contractId,
      name: template.name,
      type: template.type,
      steps,
      currentStepIndex: 0,
      status: 'pending',
      startedAt: startDate.toISOString(),
      deadline: options?.deadline || calculateDeadline(undefined, startDate).toISOString(),
      notifications: [],
    };

    workflowStore.set(workflow.id, workflow);
    console.log(`[WORKFLOW] Started: ${workflow.id} for contract ${contractId}`);
    return workflow;
  },

  // Get workflow by ID
  getWorkflow: (workflowId: string): Workflow | undefined => {
    return workflowStore.get(workflowId);
  },

  // Get workflow for contract
  getWorkflowForContract: (contractId: string): Workflow | undefined => {
    return Array.from(workflowStore.values()).find(w => w.contractId === contractId);
  },

  // Approve workflow step
  approveStep: (
    workflowId: string,
    stepId: string,
    approver: { id: string; name: string; email: string; role: string },
    comments?: string
  ): Workflow | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) return undefined;

    // Add approver
    const approverRecord: WorkflowApprover = {
      id: approver.id,
      name: approver.name,
      email: approver.email,
      role: approver.role,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      comments,
    };
    step.approverId.push(approverRecord);
    step.currentApprovals++;

    // Check if step is complete
    if (step.currentApprovals >= step.requiredApprovals) {
      step.status = 'approved';
      step.completedAt = new Date().toISOString();

      // Move to next step or complete workflow
      const currentIndex = workflow.steps.findIndex(s => s.id === stepId);
      if (currentIndex < workflow.steps.length - 1) {
        workflow.currentStepIndex = currentIndex + 1;
        workflow.status = 'in_progress';
      } else {
        workflow.status = 'approved';
        workflow.completedAt = new Date().toISOString();
      }
    }

    workflowStore.set(workflowId, workflow);
    console.log(`[WORKFLOW] Step approved: ${workflowId} - ${stepId} by ${approver.email}`);
    return workflow;
  },

  // Reject workflow step
  rejectStep: (
    workflowId: string,
    stepId: string,
    approver: { id: string; name: string; email: string; role: string },
    comments: string
  ): Workflow | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) return undefined;

    // Add rejection
    const approverRecord: WorkflowApprover = {
      id: approver.id,
      name: approver.name,
      email: approver.email,
      role: approver.role,
      status: 'rejected',
      comments,
    };
    step.approverId.push(approverRecord);
    step.status = 'rejected';
    step.completedAt = new Date().toISOString();
    workflow.status = 'rejected';

    workflowStore.set(workflowId, workflow);
    console.log(`[WORKFLOW] Step rejected: ${workflowId} - ${stepId} by ${approver.email}`);
    return workflow;
  },

  // Skip workflow step
  skipStep: (workflowId: string, stepId: string, reason: string): Workflow | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) return undefined;

    step.status = 'skipped';
    step.completedAt = new Date().toISOString();
    step.comments = reason;

    // Move to next step
    const currentIndex = workflow.steps.findIndex(s => s.id === stepId);
    if (currentIndex < workflow.steps.length - 1) {
      workflow.currentStepIndex = currentIndex + 1;
    } else {
      workflow.status = 'approved';
      workflow.completedAt = new Date().toISOString();
    }

    workflowStore.set(workflowId, workflow);
    console.log(`[WORKFLOW] Step skipped: ${workflowId} - ${stepId}`);
    return workflow;
  },

  // Cancel workflow
  cancelWorkflow: (workflowId: string, reason: string): Workflow | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    workflow.status = 'cancelled';
    workflow.steps.forEach(step => {
      if (step.status === 'pending') {
        step.status = 'skipped';
        step.comments = `Cancelled: ${reason}`;
      }
    });

    workflowStore.set(workflowId, workflow);
    console.log(`[WORKFLOW] Cancelled: ${workflowId} - ${reason}`);
    return workflow;
  },

  // Get workflow status
  getWorkflowStatus: (workflowId: string): {
    workflow: Workflow;
    currentStep: WorkflowStep | null;
    progress: { completed: number; total: number; percentage: number };
    timeRemaining: string | null;
  } | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    const currentStep = workflow.steps[workflow.currentStepIndex] || null;
    const completedSteps = workflow.steps.filter(s => s.status === 'approved' || s.status === 'skipped').length;
    const progress = {
      completed: completedSteps,
      total: workflow.steps.length,
      percentage: Math.round((completedSteps / workflow.steps.length) * 100),
    };

    let timeRemaining: string | null = null;
    if (workflow.deadline && workflow.status !== 'approved' && workflow.status !== 'rejected' && workflow.status !== 'cancelled') {
      const deadline = new Date(workflow.deadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        timeRemaining = `${days}d ${hours}h`;
      } else {
        timeRemaining = 'Overdue';
      }
    }

    return { workflow, currentStep, progress, timeRemaining };
  },

  // Add notification
  addNotification: (workflowId: string, notification: Omit<WorkflowNotification, 'id' | 'sentAt'>): WorkflowNotification | undefined => {
    const workflow = workflowStore.get(workflowId);
    if (!workflow) return undefined;

    const newNotification: WorkflowNotification = {
      id: `notif-${uuidv4()}`,
      ...notification,
      sentAt: new Date().toISOString(),
    };
    workflow.notifications.push(newNotification);
    workflowStore.set(workflowId, workflow);
    return newNotification;
  },

  // Get pending approvals for a user
  getPendingApprovals: (userId: string, userRole: string): Array<{ workflow: Workflow; step: WorkflowStep }> => {
    const results: Array<{ workflow: Workflow; step: WorkflowStep }> = [];

    workflowStore.forEach(workflow => {
      if (workflow.status === 'pending' || workflow.status === 'in_progress') {
        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (currentStep && currentStep.status === 'pending') {
          if (currentStep.approverRole === userRole || currentStep.approverId === userId) {
            // Check if user hasn't already approved
            const alreadyApproved = currentStep.approverId.some(a => a.id === userId);
            if (!alreadyApproved) {
              results.push({ workflow, step: currentStep });
            }
          }
        }
      }
    });

    return results;
  },

  // Get workflow history
  getWorkflowHistory: (contractId: string): Workflow[] => {
    return Array.from(workflowStore.values())
      .filter(w => w.contractId === contractId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  // Reminder for pending approvals
  sendReminders: (): void => {
    const now = new Date();
    workflowStore.forEach(workflow => {
      if (workflow.status === 'pending' || workflow.status === 'in_progress') {
        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (currentStep && currentStep.deadline) {
          const deadline = new Date(currentStep.deadline);
          const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (60 * 60 * 1000);

          // Send reminder if less than 24 hours remaining
          if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
            console.log(`[WORKFLOW] Reminder: ${workflow.id} - ${currentStep.name} deadline approaching`);
          }
        }
      }
    });
  },

  // Get workflow statistics
  getWorkflowStats: (): {
    total: number;
    pending: number;
    inProgress: number;
    approved: number;
    rejected: number;
    averageCompletionTime: number;
  } => {
    const workflows = Array.from(workflowStore.values());
    const completed = workflows.filter(w => w.status === 'approved' || w.status === 'rejected');

    let totalCompletionTime = 0;
    completed.forEach(w => {
      if (w.completedAt) {
        const start = new Date(w.startedAt).getTime();
        const end = new Date(w.completedAt).getTime();
        totalCompletionTime += (end - start) / (60 * 60 * 1000); // Hours
      }
    });

    return {
      total: workflows.length,
      pending: workflows.filter(w => w.status === 'pending').length,
      inProgress: workflows.filter(w => w.status === 'in_progress').length,
      approved: workflows.filter(w => w.status === 'approved').length,
      rejected: workflows.filter(w => w.status === 'rejected').length,
      averageCompletionTime: completed.length > 0 ? totalCompletionTime / completed.length : 0,
    };
  },
};

export default workflowService;
