export interface ApprovalRequest {
  id: string;
  workflowId: string;
  nodeId: string;
  type: 'approve' | 'reject' | 'modify';
  status: 'pending' | 'approved' | 'rejected' | 'modified' | 'expired' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  context: Record<string, any>;
  requestedBy: string;
  requestedAt: string;
  expiresAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  assigneeId?: string;
  assigneeName?: string;
  approverType: 'user' | 'role' | 'group';
  approverId?: string;
  escalationRules?: EscalationRule[];
  sla?: {
    target: number;
    warning?: number;
    breached: boolean;
  };
  history: ApprovalHistoryEntry[];
}

export interface ApprovalHistoryEntry {
  action: 'created' | 'assigned' | 'escalated' | 'commented' | 'resolved';
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface EscalationRule {
  afterMinutes: number;
  escalateTo: string;
  action: 'notify' | 'assign' | 'auto_approve' | 'auto_reject';
  reason?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string;
  nodeType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  defaultTimeout: number;
  autoEscalate: boolean;
  escalationRules: EscalationRule[];
  requiredApprovers: number;
  approverTypes: ('user' | 'role' | 'group')[];
  customFields?: Record<string, any>;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
  expired: number;
  avgResolutionTime: number;
  slaCompliance: number;
}
