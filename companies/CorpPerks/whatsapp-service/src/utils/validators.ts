import { z } from 'zod';

// Subscription schemas
export const SubscribeEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  language: z.string().default('en'),
  notificationPreferences: z.object({
    leaveApproval: z.boolean().optional(),
    attendance: z.boolean().optional(),
    payroll: z.boolean().optional(),
    general: z.boolean().optional(),
  }).optional(),
});

export const UpdateSubscriptionSchema = z.object({
  notificationPreferences: z.object({
    leaveApproval: z.boolean().optional(),
    attendance: z.boolean().optional(),
    payroll: z.boolean().optional(),
    general: z.boolean().optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'paused']).optional(),
  language: z.string().optional(),
});

// Message schemas
export const SendMessageSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['text', 'template', 'interactive']).default('text'),
  content: z.object({
    body: z.string().min(1).max(4096),
    header: z.string().max(60).optional(),
    footer: z.string().max(60).optional(),
    buttons: z.array(z.object({
      id: z.string(),
      title: z.string().max(25),
    })).max(3).optional(),
    mediaUrl: z.string().url().optional(),
    mediaCaption: z.string().max(300).optional(),
  }),
  templateName: z.string().optional(),
  notificationCategory: z.enum([
    'leave_approval',
    'leave_rejection',
    'attendance_checkin',
    'attendance_reminder',
    'payroll_credit',
    'general',
    'hr_notice',
    'bot_command',
  ]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const SendBulkMessageSchema = z.object({
  employeeIds: z.array(z.string()).min(1).max(100),
  type: z.enum(['text', 'template']).default('text'),
  content: z.object({
    body: z.string().min(1).max(4096),
    header: z.string().max(60).optional(),
    footer: z.string().max(60).optional(),
  }),
  templateName: z.string().optional(),
  notificationCategory: z.enum([
    'leave_approval',
    'leave_rejection',
    'attendance_checkin',
    'attendance_reminder',
    'payroll_credit',
    'general',
    'hr_notice',
  ]).optional(),
});

// Webhook schemas
export const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string(),
          }),
          wa_id: z.string(),
        })).optional(),
        messages: z.array(z.unknown()).optional(),
      }),
      field: z.string(),
    })),
  })),
});

// Leave notification schemas
export const LeaveApprovalNotificationSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['approved', 'rejected', 'pending']),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Attendance notification schemas
export const AttendanceNotificationSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  type: z.enum(['checkin_reminder', 'checkout_reminder', 'late_alert', 'absent_alert']),
  date: z.string(),
  time: z.string().optional(),
});

// Payroll notification schemas
export const PayrollNotificationSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['salary_credit', 'bonus_credit', 'deduction_notice', 'payslip_available']),
  transactionId: z.string().optional(),
  description: z.string().optional(),
});

// Query schemas
export const MessageQuerySchema = z.object({
  employeeId: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(['queued', 'sent', 'delivered', 'read', 'failed']).optional(),
  notificationCategory: z.enum([
    'leave_approval',
    'leave_rejection',
    'attendance_checkin',
    'attendance_reminder',
    'payroll_credit',
    'general',
    'hr_notice',
    'bot_command',
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('50'),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
});

export const SubscriptionQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'paused']).optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
});
