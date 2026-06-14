import { Request } from 'express';

// Base Types
export interface IBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant Types
export interface ITenant extends IBase {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  settings: ITenantSettings;
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: Date;
}

export interface ITenantSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  weekStartsOn: 0 | 1;
  allowSelfRegistration: boolean;
}

// User Types
export interface IUser extends IBase {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  tenantId: string;
  employeeId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'hr_manager'
  | 'manager'
  | 'employee';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

// Employee Types
export interface IEmployee extends IBase {
  tenantId: string;
  userId?: string;
  employeeId: string;
  corpId?: string;                    // CorpID v2.0: Links to CorpID Identity (CI-IND-XXXXX)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  joiningDate: Date;
  department: string;
  designation: string;
  managerId?: string;
  corpIdManager?: string;            // CorpID v2.0: Manager's CorpID for graph relationships
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';

  // Leave balances
  leaveBalance: ILeaveBalance;

  // Attendance
  attendanceEnabled: boolean;
  geoFenceEnabled: boolean;
  geoFenceRadius?: number;

  // CorpID v2.0: Linked assertions from CorpID
  corpIdSyncStatus?: 'synced' | 'pending' | 'error';
  lastSyncedAt?: Date;

  // Meta
  isDeleted: boolean;
  terminatedAt?: Date;
}

export interface ILeaveBalance {
  sick: number;
  casual: number;
  earned: number;
  wfh: number;
  annual?: number;
}

// Leave Types
export interface ILeaveRequest extends IBase {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
}

export type LeaveType = 'sick' | 'casual' | 'earned' | 'wfh' | 'annual' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Attendance Types
export interface IAttendance extends IBase {
  tenantId: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  checkInLocation?: IGeoLocation;
  checkOutLocation?: IGeoLocation;
  status: AttendanceStatus;
  remarks?: string;
  isRemote: boolean;
  hoursWorked?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

// Shift Types
export interface IShift extends IBase {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status: ShiftStatus;
  checkIn?: Date;
  checkOut?: Date;
}

export type ShiftStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'absent';

export interface IShiftTemplate extends IBase {
  tenantId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isActive: boolean;
}

// Department Types
export interface IDepartment extends IBase {
  tenantId: string;
  name: string;
  code: string;
  headId?: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
}

// Request with user context
export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
  tenantId?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Filter types
export interface IQueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
