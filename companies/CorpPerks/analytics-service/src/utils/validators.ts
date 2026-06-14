import { z } from 'zod';

// Report schemas
export const ReportTypeSchema = z.enum([
  'dashboard',
  'employees',
  'attendance',
  'payroll',
  'performance',
  'custom',
]);

export const ReportFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
});

export const CreateReportSchema = z.object({
  name: z.string().min(1).max(200),
  type: ReportTypeSchema,
  data: z.record(z.unknown()),
  generatedBy: z.string().optional(),
  filters: ReportFiltersSchema.optional(),
});

export const GetReportSchema = z.object({
  type: ReportTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// Scheduled Report schemas
export const ScheduleFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly']);
export const ReportFormatSchema = z.enum(['pdf', 'csv', 'excel', 'json']);

export const RecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const CreateScheduledReportSchema = z.object({
  reportId: z.string().min(1),
  reportName: z.string().min(1).max(200),
  reportType: ReportTypeSchema,
  schedule: z.object({
    frequency: ScheduleFrequencySchema,
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
    timezone: z.string().default('Asia/Kolkata'),
  }),
  recipients: z.array(RecipientSchema).min(1),
  format: ReportFormatSchema.default('pdf'),
  filters: ReportFiltersSchema.optional(),
});

export const UpdateScheduledReportSchema = CreateScheduledReportSchema.partial();

// Dashboard query schema
export const DashboardQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
});

// Analytics query schemas
export const EmployeeMetricsQuerySchema = z.object({
  department: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeInactive: z.string().transform(s => s === 'true').optional(),
});

export const AttendanceQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export const PayrollQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  includeDeductions: z.string().transform(s => s === 'true').optional(),
});

export const PerformanceQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
  metric: z.string().optional(),
  sortBy: z.enum(['score', 'name', 'date']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
