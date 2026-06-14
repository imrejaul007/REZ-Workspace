// Core entity types for CorpPerks Admin Dashboard

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: Department;
  designation: string;
  manager?: Employee;
  joinDate: string;
  status: EmployeeStatus;
  location: string;
  employmentType: EmploymentType;
  salary?: Compensation;
  skills: string[];
  certifications: Certification[];
  performance?: PerformanceReview;
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'probation' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

export interface Department {
  id: string;
  name: string;
  code: string;
  head?: Employee;
  parent?: Department;
  employeeCount: number;
}

export interface Compensation {
  base: number;
  currency: string;
  bonus?: number;
  stock?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export interface PerformanceReview {
  cycle: string;
  rating: number;
  feedback: string;
  goals: Goal[];
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
}

// Analytics types
export interface AnalyticsOverview {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  departures: number;
  averageTenure: number;
  retentionRate: number;
  employeeGrowth: number;
}

export interface ModuleMetrics {
  attendance: AttendanceMetrics;
  leave: LeaveMetrics;
  payroll: PayrollMetrics;
  performance: PerformanceMetrics;
  training: TrainingMetrics;
}

export interface AttendanceMetrics {
  present: number;
  absent: number;
  late: number;
  remote: number;
  onTime: number;
  rate: number;
}

export interface LeaveMetrics {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  typesBreakdown: Record<string, number>;
}

export interface PayrollMetrics {
  totalAmount: number;
  processed: number;
  pending: number;
  failed: number;
  averageSalary: number;
}

export interface PerformanceMetrics {
  submitted: number;
  pending: number;
  averageRating: number;
  goalsCompleted: number;
  goalsAtRisk: number;
}

export interface TrainingMetrics {
  enrolled: number;
  completed: number;
  inProgress: number;
  completionRate: number;
}

// Audit types
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: AuditAction;
  module: Module;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, unknown>;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'submit';

export type Module =
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'performance'
  | 'training'
  | 'documents'
  | 'settings'
  | 'auth';

// Dashboard widget types
export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  data?: unknown;
}

export type WidgetType =
  | 'stat'
  | 'chart'
  | 'table'
  | 'list'
  | 'activity'
  | 'health';

// Quick action types
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

// System health types
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: ServiceHealth[];
  uptime: number;
  lastChecked: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  lastPing: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
