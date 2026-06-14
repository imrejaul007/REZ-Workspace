import { v4 as uuid } from 'uuid';
import { ApprovalRequest, ApprovalTemplate, ApprovalStats, ApprovalHistoryEntry } from '../models/approval';
import logger from '../utils/logger';

// In-memory storage (replace with database in production)
const approvalRequests: Map<string, ApprovalRequest> = new Map();
const approvalTemplates: Map<string, ApprovalTemplate> = new Map();

// Initialize with default templates
const defaultTemplates: ApprovalTemplate[] = [
  {
    id: 'finance-approval',
    name: 'Finance Approval',
    description: 'Approval for financial transactions',
    nodeType: 'approval',
    priority: 'high',
    defaultTimeout: 60,
    autoEscalate: true,
    escalationRules: [{ afterMinutes: 30, escalateTo: 'manager', action: 'notify' }],
    requiredApprovers: 1,
    approverTypes: ['user', 'role'],
  },
  {
    id: 'legal-review',
    name: 'Legal Review',
    description: 'Legal team review for compliance',
    nodeType: 'approval',
    priority: 'critical',
    defaultTimeout: 120,
    autoEscalate: true,
    escalationRules: [{ afterMinutes: 60, escalateTo: 'legal_head', action: 'notify' }],
    requiredApprovers: 2,
    approverTypes: ['role', 'group'],
  },
  {
    id: 'hr-approval',
    name: 'HR Approval',
    description: 'Human resources approval workflow',
    nodeType: 'approval',
    priority: 'medium',
    defaultTimeout: 240,
    autoEscalate: false,
    escalationRules: [],
    requiredApprovers: 1,
    approverTypes: ['user'],
  },
];

defaultTemplates.forEach(t => approvalTemplates.set(t.id, t));

export const createApprovalRequest = (
  workflowId: string,
  nodeId: string,
  title: string,
  description: string,
  requestedBy: string,
  context: Record<string, any>,
  options?: {
    templateId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    approverId?: string;
    approverType?: 'user' | 'role' | 'group';
    timeoutMinutes?: number;
    assigneeId?: string;
  }
): ApprovalRequest => {
  const id = `apr_${uuid()}`;
  const now = new Date().toISOString();

  const template = options?.templateId ? approvalTemplates.get(options.templateId) : undefined;

  const request: ApprovalRequest = {
    id,
    workflowId,
    nodeId,
    type: 'approve',
    status: 'pending',
    priority: options?.priority || template?.priority || 'medium',
    title,
    description,
    context,
    requestedBy,
    requestedAt: now,
    expiresAt: options?.timeoutMinutes
      ? new Date(Date.now() + options.timeoutMinutes * 60000).toISOString()
      : template?.defaultTimeout
        ? new Date(Date.now() + template.defaultTimeout * 60000).toISOString()
        : undefined,
    approverType: options?.approverType || 'user',
    approverId: options?.approverId,
    assigneeId: options?.assigneeId,
    escalationRules: template?.escalationRules || [],
    sla: {
      target: options?.timeoutMinutes || template?.defaultTimeout || 60,
      breached: false,
    },
    history: [
      {
        action: 'created',
        performedBy: requestedBy,
        performedAt: now,
        details: `Approval request created for workflow ${workflowId}`,
      },
    ],
  };

  approvalRequests.set(id, request);
  logger.info(`Approval request created: ${id} for workflow ${workflowId}`);

  return request;
};

export const getApprovalRequest = (id: string): ApprovalRequest | undefined => {
  return approvalRequests.get(id);
};

export const getApprovalsByWorkflow = (workflowId: string): ApprovalRequest[] => {
  return Array.from(approvalRequests.values()).filter(a => a.workflowId === workflowId);
};

export const getApprovalsByAssignee = (assigneeId: string): ApprovalRequest[] => {
  return Array.from(approvalRequests.values()).filter(
    a => a.assigneeId === assigneeId && a.status === 'pending'
  );
};

export const resolveApproval = (
  id: string,
  resolution: 'approved' | 'rejected' | 'modified',
  resolvedBy: string,
  details?: string,
  modifiedContext?: Record<string, any>
): ApprovalRequest | undefined => {
  const request = approvalRequests.get(id);
  if (!request) {
    logger.error(`Approval request not found: ${id}`);
    return undefined;
  }

  if (request.status !== 'pending') {
    logger.warn(`Approval request ${id} is not pending, current status: ${request.status}`);
    return undefined;
  }

  const now = new Date().toISOString();
  request.status = resolution;
  request.resolvedBy = resolvedBy;
  request.resolvedAt = now;
  request.resolution = details;

  if (modifiedContext) {
    request.context = { ...request.context, ...modifiedContext };
  }

  const historyEntry: ApprovalHistoryEntry = {
    action: 'resolved',
    performedBy: resolvedBy,
    performedAt: now,
    details: details || `Request ${resolution}`,
  };
  request.history.push(historyEntry);

  logger.info(`Approval ${id} resolved: ${resolution} by ${resolvedBy}`);
  return request;
};

export const cancelApproval = (id: string, cancelledBy: string, reason?: string): ApprovalRequest | undefined => {
  const request = approvalRequests.get(id);
  if (!request) return undefined;

  request.status = 'cancelled';
  request.resolvedBy = cancelledBy;
  request.resolvedAt = new Date().toISOString();
  request.resolution = reason || 'Cancelled by requester';

  request.history.push({
    action: 'resolved',
    performedBy: cancelledBy,
    performedAt: new Date().toISOString(),
    details: reason || 'Cancelled',
  });

  return request;
};

export const addComment = (id: string, comment: string, commentedBy: string): ApprovalRequest | undefined => {
  const request = approvalRequests.get(id);
  if (!request) return undefined;

  request.history.push({
    action: 'commented',
    performedBy: commentedBy,
    performedAt: new Date().toISOString(),
    details: comment,
  });

  return request;
};

export const reassignApproval = (
  id: string,
  newAssigneeId: string,
  newAssigneeName: string,
  reassignedBy: string
): ApprovalRequest | undefined => {
  const request = approvalRequests.get(id);
  if (!request) return undefined;

  const oldAssignee = request.assigneeName || request.assigneeId;
  request.assigneeId = newAssigneeId;
  request.assigneeName = newAssigneeName;

  request.history.push({
    action: 'assigned',
    performedBy: reassignedBy,
    performedAt: new Date().toISOString(),
    details: `Reassigned from ${oldAssignee} to ${newAssigneeName}`,
  });

  return request;
};

export const getApprovalStats = (filters?: { workflowId?: string; assigneeId?: string }): ApprovalStats => {
  let requests = Array.from(approvalRequests.values());

  if (filters?.workflowId) {
    requests = requests.filter(r => r.workflowId === filters.workflowId);
  }
  if (filters?.assigneeId) {
    requests = requests.filter(r => r.assigneeId === filters.assigneeId);
  }

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => ['approved', 'rejected', 'modified'].includes(r.status));

  const totalResolutionTime = resolved.reduce((sum, r) => {
    if (r.resolvedAt) {
      return sum + (new Date(r.resolvedAt).getTime() - new Date(r.requestedAt).getTime());
    }
    return sum;
  }, 0);

  const slaBreached = pending.filter(r => r.sla?.breached).length;

  return {
    total: requests.length,
    pending: pending.length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    modified: requests.filter(r => r.status === 'modified').length,
    expired: requests.filter(r => r.status === 'expired').length,
    avgResolutionTime: resolved.length > 0 ? totalResolutionTime / resolved.length / 60000 : 0,
    slaCompliance: pending.length > 0 ? ((pending.length - slaBreached) / pending.length) * 100 : 100,
  };
};

export const getTemplates = (): ApprovalTemplate[] => {
  return Array.from(approvalTemplates.values());
};

export const getTemplate = (id: string): ApprovalTemplate | undefined => {
  return approvalTemplates.get(id);
};
