import { z } from 'zod';

// Project Types
export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  clientName?: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Task Types
export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description?: string;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Time Entry Types
export interface TimeEntry {
  id: string;
  tenantId: string;
  userId: string;
  projectId: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isBillable: boolean;
  isManual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Active Timer
export interface ActiveTimer {
  id: string;
  tenantId: string;
  userId: string;
  projectId: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  isBillable: boolean;
}

// Report Types
export interface TimeReport {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  entries: TimeEntry[];
  totalMinutes: number;
  totalBillableMinutes: number;
  byProject: Record<string, ProjectSummary>;
  byUser: Record<string, UserSummary>;
  byDate: Record<string, number>;
}

export interface ProjectSummary {
  projectName: string;
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
  amount: number;
}

export interface UserSummary {
  userName: string;
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
  amount: number;
}

// Zod Schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  clientName: z.string().max(100).optional(),
  hourlyRate: z.number().nonnegative().default(0),
  isActive: z.boolean().optional().default(true),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  estimatedHours: z.number().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isBillable: z.boolean().optional().default(true),
  isManual: z.boolean().optional().default(true),
});

export const StartTimerSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  isBillable: z.boolean().optional().default(true),
});

export const UpdateTimeEntrySchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isBillable: z.boolean().optional(),
}).refine(data => {
  // Either both startTime and endTime should be provided, or neither
  return (data.startTime && data.endTime) || (!data.startTime && !data.endTime);
}, {
  message: 'Both startTime and endTime must be provided together',
});

// API Response Types
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
