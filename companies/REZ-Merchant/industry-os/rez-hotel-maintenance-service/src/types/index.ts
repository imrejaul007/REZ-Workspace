/**
 * Hotel Maintenance Service Types
 */

export type IssueStatus = 'reported' | 'in_progress' | 'pending_parts' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 'appliance' | 'structural' | 'cleaning' | 'other';

export interface IMaintenanceIssue {
  issueId: string;
  hotelId: string;
  roomId?: string;
  roomNumber?: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string;
  images?: string[];
  notes: string[];
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceLog {
  logId: string;
  issueId: string;
  action: string;
  performedBy: string;
  details?: string;
  createdAt: Date;
}

export interface CreateIssueInput {
  roomId?: string;
  roomNumber?: string;
  category: IssueCategory;
  priority: IssuePriority;
  title: string;
  description: string;
  reportedBy: string;
  images?: string[];
}

export interface UpdateIssueInput {
  status?: IssueStatus;
  priority?: IssuePriority;
  assignedTo?: string;
  notes?: string;
}
