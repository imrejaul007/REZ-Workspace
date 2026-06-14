import { Types } from 'mongoose';

// ShiftTemplate - Reusable shift definitions
export interface IShiftTemplate {
  _id: Types.ObjectId;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  duration: number;  // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Shift status enum
export enum ShiftStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Shift - A scheduled shift for a specific date
export interface IShift {
  _id: Types.ObjectId;
  date: string;           // YYYY-MM-DD format
  templateId: Types.ObjectId;
  employees: string[];    // Array of employee IDs
  status: ShiftStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ShiftSwap status
export enum SwapStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// ShiftSwap - Request to swap shifts between employees
export interface IShiftSwap {
  _id: Types.ObjectId;
  requesterId: string;
  targetId: string;
  shiftId: Types.ObjectId;
  status: SwapStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ShiftRequest type
export enum ShiftRequestType {
  TIME_OFF = 'time_off',
  SWAP = 'swap',
  COVERAGE = 'coverage',
  MODIFY = 'modify'
}

// ShiftRequest status
export enum ShiftRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// ShiftRequest - Employee requests for shifts
export interface IShiftRequest {
  _id: Types.ObjectId;
  employeeId: string;
  date: string;          // YYYY-MM-DD format
  type: ShiftRequestType;
  reason?: string;
  status: ShiftRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ShiftCoverage - Required coverage for a shift
export interface IShiftCoverage {
  _id: Types.ObjectId;
  shiftId: Types.ObjectId;
  date: string;           // YYYY-MM-DD format
  required: number;       // Number of employees required
  assigned: number;       // Number of employees assigned
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
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
