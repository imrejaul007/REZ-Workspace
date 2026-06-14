import { ObjectId } from 'mongoose';

// =============================================================================
// Project Types
// =============================================================================

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AIRisk {
  type: 'blocked_tasks' | 'inactive_contributor' | 'dependency_issue' | 'overtime_burnout' | 'attendance_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTaskIds: string[];
  suggestedAction: string;
  detectedAt: Date;
}

export interface Project {
  _id: ObjectId;
  projectId: string;
  name: string;
  description: string;
  departmentId: string;
  managerId: string;
  teamMembers: string[];
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date;
  endDate: Date;
  budget: number;
  spentAmount: number;
  clientId?: string;
  clientName?: string;
  health: number;
  completionPercentage: number;
  aiRisks: AIRisk[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  departmentId: string;
  managerId: string;
  teamMembers?: string[];
  startDate: Date | string;
  endDate: Date | string;
  budget?: number;
  priority?: ProjectPriority;
  clientId?: string;
  clientName?: string;
  tags?: string[];
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  departmentId?: string;
  managerId?: string;
  teamMembers?: string[];
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  spentAmount?: number;
  clientId?: string;
  clientName?: string;
  tags?: string[];
}

// =============================================================================
// Milestone Types
// =============================================================================

export interface Milestone {
  _id: ObjectId;
  milestoneId: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completionPercentage: number;
  deliverables: string[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Sprint Types
// =============================================================================

export interface Sprint {
  _id: ObjectId;
  sprintId: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintCreateInput {
  projectId: string;
  name: string;
  goal?: string;
  startDate: Date | string;
  endDate: Date | string;
}

// =============================================================================
// Task Types
// =============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SubTask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Comment {
  _id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: ObjectId;
  taskId: string;
  projectId: string;
  milestoneId?: string;
  sprintId?: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number;
  actualHours: number;
  dueDate: Date;
  dependencies: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  comments: Comment[];
  completionProof?: string;
  storyPoints?: number;
  tags: string[];
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreateInput {
  projectId: string;
  milestoneId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours?: number;
  dueDate: Date | string;
  priority?: TaskPriority;
  dependencies?: string[];
  storyPoints?: number;
  tags?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date | string;
  completionProof?: string;
  storyPoints?: number;
  tags?: string[];
}

// =============================================================================
// Time Entry Types
// =============================================================================

export type TimeEntryType = 'project' | 'client' | 'meeting' | 'admin' | 'overtime';

export interface TimeEntry {
  _id: ObjectId;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  date: Date;
  hours: number;
  description: string;
  type: TimeEntryType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryCreateInput {
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  date: Date | string;
  hours: number;
  description?: string;
  type?: TimeEntryType;
}

// =============================================================================
// Work Log Types
// =============================================================================

export interface WorkLog {
  _id: ObjectId;
  employeeId: string;
  employeeName: string;
  date: Date;
  completed: string;
  blockers: string;
  tomorrowPlan: string;
  tasksWorkedOn: {
    taskId: string;
    taskTitle: string;
    status: string;
  }[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkLogCreateInput {
  employeeId: string;
  employeeName: string;
  date: Date | string;
  completed: string;
  blockers?: string;
  tomorrowPlan?: string;
  tasksWorkedOn?: {
    taskId: string;
    taskTitle: string;
    status: string;
  }[];
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface DelayPrediction {
  projectId: string;
  willDelay: boolean;
  estimatedDelayDays: number;
  confidence: number;
  reasons: string[];
  suggestions: string[];
}

export interface DeliveryForecast {
  projectId: string;
  expectedCompletionDate: Date;
  originalEndDate: Date;
  riskScore: number;
  confidenceScore: number;
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
}

export interface Bottleneck {
  type: 'task' | 'person' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntity: string;
  suggestedResolution: string;
}

export interface EmployeeProductivity {
  employeeId: string;
  employeeName: string;
  totalTasksAssigned: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
  completionRate: number;
  averageHoursPerTask: number;
  overtimeHours: number;
  utilizationRate: number;
  weeklyData: {
    week: string;
    tasksCompleted: number;
    hoursLogged: number;
  }[];
}

export interface TeamUtilization {
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  allocatedHours: number;
  loggedHours: number;
  utilization: number;
  taskCount: number;
  activeTaskCount: number;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface ManagerDashboard {
  activeProjects: number;
  delayedProjects: number;
  atRiskProjects: number;
  completedThisMonth: number;
  totalTeamMembers: number;
  averageProjectHealth: number;
  totalBudget: number;
  totalSpent: number;
  upcomingDeadlines: {
    projectId: string;
    projectName: string;
    deadline: Date;
    daysRemaining: number;
  }[];
  recentCompletions: {
    projectId: string;
    projectName: string;
    completedAt: Date;
  }[];
  aiAlerts: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    projectId: string;
  }[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Query Filters
// =============================================================================

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  departmentId?: string;
  managerId?: string;
  teamMemberId?: string;
  clientId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sprintId?: string;
  search?: string;
  overdue?: boolean;
}

export interface SprintFilters {
  projectId?: string;
  status?: 'planning' | 'active' | 'completed';
}

export interface TimeEntryFilters {
  employeeId?: string;
  projectId?: string;
  taskId?: string;
  type?: TimeEntryType;
  startDate?: Date;
  endDate?: Date;
}
