/**
 * REZ Workspace - Request Validation Middleware
 *
 * Uses Zod for schema validation with detailed error messages
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// ============================================
// CUSTOM ERROR CLASS
// ============================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// User schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  settings: z.object({
    allow_guest_access: z.boolean().optional(),
    default_channel_visibility: z.enum(['public', 'private']).optional(),
    notification_preferences: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      desktop: z.boolean().optional(),
      mentions_only: z.boolean().optional(),
    }).optional(),
    branding: z.object({
      logo: z.string().optional(),
      colors: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  cover_image: z.string().url().optional(),
  settings: z.object({
    allow_guest_access: z.boolean().optional(),
    default_channel_visibility: z.enum(['public', 'private']).optional(),
    notification_preferences: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      desktop: z.boolean().optional(),
      mentions_only: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

// Channel schemas
export const createChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).regex(/^[a-z0-9-]+$/, 'Name must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private', 'direct', 'announcement']).optional(),
  members: z.array(z.string()).optional(),
  topic: z.string().max(200).optional(),
});

// Message schemas
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['file', 'image', 'link', 'code']),
    url: z.string(),
    name: z.string(),
    size: z.number().optional(),
    mime_type: z.string().optional(),
  })).optional(),
  thread_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Meeting schemas
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  attendee_ids: z.array(z.string()).optional(),
  workspace_id: z.string().optional(),
  recurring: z.boolean().optional(),
  recurrence_rule: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.object({
    is_public: z.boolean().optional(),
    allow_recording: z.boolean().optional(),
    waiting_room_enabled: z.boolean().optional(),
    mute_on_entry: z.boolean().optional(),
    video_enabled: z.boolean().optional(),
    screen_share_enabled: z.boolean().optional(),
    chat_enabled: z.boolean().optional(),
  }).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  attendee_ids: z.array(z.string()).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  settings: z.object({
    is_public: z.boolean().optional(),
    allow_recording: z.boolean().optional(),
    waiting_room_enabled: z.boolean().optional(),
    mute_on_entry: z.boolean().optional(),
    video_enabled: z.boolean().optional(),
    screen_share_enabled: z.boolean().optional(),
    chat_enabled: z.boolean().optional(),
  }).optional(),
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().optional(),
  type: z.enum(['document', 'spreadsheet', 'presentation', 'file', 'folder']).optional(),
  workspace_id: z.string().optional(),
  channel_id: z.string().optional(),
  parent_folder_id: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  is_starred: z.boolean().optional(),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  workspace_id: z.string().optional(),
  channel_id: z.string().optional(),
  project_id: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  labels: z.array(z.string().max(50)).max(10).optional(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    completed: z.boolean().optional(),
  })).max(50).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  assignee_id: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_date: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  labels: z.array(z.string().max(50)).max(10).optional(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    completed: z.boolean(),
  })).max(50).optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  workspace_id: z.string().optional(),
  members: z.array(z.string()).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  target_date: z.string().datetime().optional(),
  budget: z.number().min(0).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Workflow schemas
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  trigger: z.object({
    type: z.enum(['event', 'schedule', 'manual']),
    event: z.string().optional(),
    schedule: z.string().optional(),
  }),
  actions: z.array(z.object({
    type: z.string(),
    config: z.record(z.unknown()),
  })).min(1, 'At least one action is required'),
  workspace_id: z.string().optional(),
});

// Calendar event schemas
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['meeting', 'task_due', 'reminder', 'out_of_office', 'other']).optional(),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format').optional(),
  all_day: z.boolean().optional(),
  attendees: z.array(z.string()).optional(),
  location: z.string().max(500).optional(),
  reminder: z.number().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.parse(data);

      // Replace with validated and parsed data
      if (source === 'body') {
        req.body = result;
      } else if (source === 'query') {
        req.query = result as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }
      next(error);
    }
  };
}

// ============================================
// PRESET VALIDATION MIDDLEWARES
// ============================================

// Auth validation
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);

// Workspace validation
export const validateCreateWorkspace = validate(createWorkspaceSchema);
export const validateUpdateWorkspace = validate(updateWorkspaceSchema);

// Channel validation
export const validateCreateChannel = validate(createChannelSchema);

// Message validation
export const validateCreateMessage = validate(createMessageSchema);

// Meeting validation
export const validateCreateMeeting = validate(createMeetingSchema);
export const validateUpdateMeeting = validate(updateMeetingSchema);

// Document validation
export const validateCreateDocument = validate(createDocumentSchema);
export const validateUpdateDocument = validate(updateDocumentSchema);

// Task validation
export const validateCreateTask = validate(createTaskSchema);
export const validateUpdateTask = validate(updateTaskSchema);

// Project validation
export const validateCreateProject = validate(createProjectSchema);

// Workflow validation
export const validateCreateWorkflow = validate(createWorkflowSchema);

// Calendar validation
export const validateCreateCalendarEvent = validate(createCalendarEventSchema);

export default {
  validate,
  ValidationError,
  // Schemas
  registerSchema,
  loginSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createChannelSchema,
  createMessageSchema,
  createMeetingSchema,
  updateMeetingSchema,
  createDocumentSchema,
  updateDocumentSchema,
  createTaskSchema,
  updateTaskSchema,
  createProjectSchema,
  createWorkflowSchema,
  createCalendarEventSchema,
  // Middlewares
  validateRegister,
  validateLogin,
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateCreateChannel,
  validateCreateMessage,
  validateCreateMeeting,
  validateUpdateMeeting,
  validateCreateDocument,
  validateUpdateDocument,
  validateCreateTask,
  validateUpdateTask,
  validateCreateProject,
  validateCreateWorkflow,
  validateCreateCalendarEvent,
};