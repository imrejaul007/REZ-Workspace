/**
 * REZ Workspace - Mongoose Models
 * Production-ready MongoDB schemas with indexes
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: Date;
  workspaces: mongoose.Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  owner_id: mongoose.Types.ObjectId;
  team_ids: string[];
  members: mongoose.Types.ObjectId[];
  avatar?: string;
  cover_image?: string;
  settings: {
    allow_guest_access: boolean;
    default_channel_visibility: 'public' | 'private';
    notification_preferences: {
      email: boolean;
      push: boolean;
      desktop: boolean;
      mentions_only: boolean;
    };
    branding?: {
      logo?: string;
      colors?: string[];
    };
  };
  created_at: Date;
  updated_at: Date;
}

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;
  workspace_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct' | 'announcement';
  members: mongoose.Types.ObjectId[];
  created_by: mongoose.Types.ObjectId;
  topic?: string;
  purpose?: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  channel_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  edited_at?: Date;
  reactions: Array<{
    emoji: string;
    user_ids: mongoose.Types.ObjectId[];
    count: number;
  }>;
  thread_id?: mongoose.Types.ObjectId;
  attachments: Array<{
    id: string;
    type: 'file' | 'image' | 'link' | 'code';
    url: string;
    name: string;
    size?: number;
    mime_type?: string;
    preview?: string;
  }>;
  is_pinned: boolean;
  is_deleted: boolean;
  reply_count: number;
  metadata?: Record<string, unknown>;
}

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  host_id: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  duration: number;
  attendee_ids: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_link?: string;
  recording_url?: string;
  notes?: {
    summary?: string;
    action_items: Array<{
      id: string;
      title: string;
      assignee_id?: mongoose.Types.ObjectId;
      due_date?: Date;
      status: 'pending' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high';
    }>;
    key_decisions: string[];
    topics_discussed: string[];
    generated_by_ai: boolean;
    last_edited?: Date;
  };
  transcript?: string;
  calendar_event_id?: mongoose.Types.ObjectId;
  is_recurring: boolean;
  recurrence_rule?: string;
  timezone: string;
  workspace_id?: mongoose.Types.ObjectId;
  settings: {
    is_public: boolean;
    allow_recording: boolean;
    waiting_room_enabled: boolean;
    mute_on_entry: boolean;
    video_enabled: boolean;
    screen_share_enabled: boolean;
    chat_enabled: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content?: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'file' | 'folder';
  workspace_id: mongoose.Types.ObjectId;
  channel_id?: mongoose.Types.ObjectId;
  created_by: mongoose.Types.ObjectId;
  parent_folder_id?: mongoose.Types.ObjectId;
  current_version: number;
  versions: Array<{
    version: number;
    created_by: mongoose.Types.ObjectId;
    created_at: Date;
    content_snapshot?: string;
    change_summary?: string;
  }>;
  tags: string[];
  is_starred: boolean;
  is_archived: boolean;
  shared_with: Array<{
    user_id: mongoose.Types.ObjectId;
    permission: 'view' | 'comment' | 'edit' | 'admin';
    granted_by: mongoose.Types.ObjectId;
    granted_at: Date;
  }>;
  permissions: {
    public: boolean;
    allow_download: boolean;
    allow_print: boolean;
    require_signatures: boolean;
    editable_by: mongoose.Types.ObjectId[];
    viewable_by: mongoose.Types.ObjectId[];
  };
  last_edited_by?: mongoose.Types.ObjectId;
  word_count?: number;
  embedding_id?: string;
  analysis?: {
    sentiment?: string;
    key_topics?: string[];
    readability_score?: number;
    suggested_categories?: string[];
    similar_documents?: string[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  workspace_id: mongoose.Types.ObjectId;
  channel_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  assignee_id?: mongoose.Types.ObjectId;
  reporter_id: mongoose.Types.ObjectId;
  due_date?: Date;
  start_date?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  labels: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  dependencies: mongoose.Types.ObjectId[];
  time_estimate?: number;
  time_spent?: number;
  attachments: Array<{
    id: string;
    type: 'file' | 'image' | 'link' | 'code';
    url: string;
    name: string;
    size?: number;
    mime_type?: string;
  }>;
  comments: Array<{
    id: string;
    user_id: mongoose.Types.ObjectId;
    content: string;
    created_at: Date;
    edited_at?: Date;
  }>;
  meeting_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  workspace_id: mongoose.Types.ObjectId;
  channel_id?: mongoose.Types.ObjectId;
  owner_id: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  start_date?: Date;
  target_date?: Date;
  budget?: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'meeting' | 'task_due' | 'reminder' | 'out_of_office' | 'other';
  user_id: mongoose.Types.ObjectId;
  workspace_id?: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  recurrence?: string;
  attendees?: mongoose.Types.ObjectId[];
  location?: string;
  meeting_id?: mongoose.Types.ObjectId;
  task_id?: mongoose.Types.ObjectId;
  reminder?: number;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IWorkflow extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  trigger: {
    type: 'event' | 'schedule' | 'manual';
    event?: string;
    schedule?: string;
  };
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  workspace_id: mongoose.Types.ObjectId;
  created_by: mongoose.Types.ObjectId;
  is_active: boolean;
  last_run?: Date;
  run_count: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SCHEMAS
// ============================================

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['online', 'away', 'busy', 'offline'], default: 'offline' },
  last_seen: { type: Date, default: Date.now },
  workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team_ids: [{ type: String }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  avatar: { type: String },
  cover_image: { type: String },
  settings: {
    allow_guest_access: { type: Boolean, default: true },
    default_channel_visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    notification_preferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      mentions_only: { type: Boolean, default: false },
    },
    branding: {
      logo: { type: String },
      colors: [{ type: String }],
    },
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const channelSchema = new Schema<IChannel>({
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  type: { type: String, enum: ['public', 'private', 'direct', 'announcement'], default: 'public' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, maxlength: 200 },
  purpose: { type: String },
  is_archived: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const messageSchema = new Schema<IMessage>({
  channel_id: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 10000 },
  timestamp: { type: Date, default: Date.now },
  edited_at: { type: Date },
  reactions: [{
    emoji: { type: String, required: true },
    user_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    count: { type: Number, default: 1 },
  }],
  thread_id: { type: Schema.Types.ObjectId, ref: 'Message' },
  attachments: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['file', 'image', 'link', 'code'] },
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
    mime_type: { type: String },
    preview: { type: String },
  }],
  is_pinned: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  reply_count: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const meetingSchema = new Schema<IMeeting>({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  host_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  duration: { type: Number, required: true },
  attendee_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  meeting_link: { type: String },
  recording_url: { type: String },
  notes: {
    summary: { type: String },
    action_items: [{
      id: { type: String },
      title: { type: String },
      assignee_id: { type: Schema.Types.ObjectId, ref: 'User' },
      due_date: { type: Date },
      status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    }],
    key_decisions: [{ type: String }],
    topics_discussed: [{ type: String }],
    generated_by_ai: { type: Boolean, default: false },
    last_edited: { type: Date },
  },
  transcript: { type: String },
  calendar_event_id: { type: Schema.Types.ObjectId, ref: 'CalendarEvent' },
  is_recurring: { type: Boolean, default: false },
  recurrence_rule: { type: String },
  timezone: { type: String, default: 'Asia/Kolkata' },
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  settings: {
    is_public: { type: Boolean, default: true },
    allow_recording: { type: Boolean, default: true },
    waiting_room_enabled: { type: Boolean, default: false },
    mute_on_entry: { type: Boolean, default: false },
    video_enabled: { type: Boolean, default: true },
    screen_share_enabled: { type: Boolean, default: true },
    chat_enabled: { type: Boolean, default: true },
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const documentSchema = new Schema<IDocument>({
  title: { type: String, required: true, maxlength: 500 },
  content: { type: String },
  type: { type: String, enum: ['document', 'spreadsheet', 'presentation', 'file', 'folder'], default: 'document' },
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  channel_id: { type: Schema.Types.ObjectId, ref: 'Channel' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parent_folder_id: { type: Schema.Types.ObjectId, ref: 'Document' },
  current_version: { type: Number, default: 1 },
  versions: [{
    version: { type: Number },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date },
    content_snapshot: { type: String },
    change_summary: { type: String },
  }],
  tags: [{ type: String, maxlength: 50 }],
  is_starred: { type: Boolean, default: false },
  is_archived: { type: Boolean, default: false },
  shared_with: [{
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'comment', 'edit', 'admin'] },
    granted_by: { type: Schema.Types.ObjectId, ref: 'User' },
    granted_at: { type: Date },
  }],
  permissions: {
    public: { type: Boolean, default: false },
    allow_download: { type: Boolean, default: true },
    allow_print: { type: Boolean, default: true },
    require_signatures: { type: Boolean, default: false },
    editable_by: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewable_by: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  last_edited_by: { type: Schema.Types.ObjectId, ref: 'User' },
  word_count: { type: Number },
  embedding_id: { type: String },
  analysis: {
    sentiment: { type: String },
    key_topics: [{ type: String }],
    readability_score: { type: Number },
    suggested_categories: [{ type: String }],
    similar_documents: [{ type: String }],
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, maxlength: 500 },
  description: { type: String, maxlength: 5000 },
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  channel_id: { type: Schema.Types.ObjectId, ref: 'Channel' },
  project_id: { type: Schema.Types.ObjectId, ref: 'Project' },
  assignee_id: { type: Schema.Types.ObjectId, ref: 'User' },
  reporter_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  due_date: { type: Date },
  start_date: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'], default: 'todo' },
  labels: [{ type: String, maxlength: 50 }],
  subtasks: [{
    id: { type: String },
    title: { type: String },
    completed: { type: Boolean, default: false },
  }],
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  time_estimate: { type: Number },
  time_spent: { type: Number },
  attachments: [{
    id: { type: String },
    type: { type: String, enum: ['file', 'image', 'link', 'code'] },
    url: { type: String },
    name: { type: String },
    size: { type: Number },
    mime_type: { type: String },
  }],
  comments: [{
    id: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    created_at: { type: Date },
    edited_at: { type: Date },
  }],
  meeting_id: { type: Schema.Types.ObjectId, ref: 'Meeting' },
  completed_at: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  channel_id: { type: Schema.Types.ObjectId, ref: 'Channel' },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'archived'], default: 'planning' },
  start_date: { type: Date },
  target_date: { type: Date },
  budget: { type: Number, min: 0 },
  tags: [{ type: String, maxlength: 50 }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const calendarEventSchema = new Schema<ICalendarEvent>({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  type: { type: String, enum: ['meeting', 'task_due', 'reminder', 'out_of_office', 'other'], default: 'other' },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  all_day: { type: Boolean, default: false },
  recurrence: { type: String },
  attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  location: { type: String, maxlength: 500 },
  meeting_id: { type: Schema.Types.ObjectId, ref: 'Meeting' },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task' },
  reminder: { type: Number },
  color: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const workflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  trigger: {
    type: { type: String, enum: ['event', 'schedule', 'manual'], required: true },
    event: { type: String },
    schedule: { type: String },
  },
  actions: [{
    type: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
  }],
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  is_active: { type: Boolean, default: true },
  last_run: { type: Date },
  run_count: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ============================================
// INDEXES
// ============================================

// User indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ workspaces: 1 });

// Workspace indexes
workspaceSchema.index({ owner_id: 1 });
workspaceSchema.index({ members: 1 });

// Channel indexes
channelSchema.index({ workspace_id: 1 });
channelSchema.index({ workspace_id: 1, name: 1 });
channelSchema.index({ members: 1 });

// Message indexes
messageSchema.index({ channel_id: 1, timestamp: -1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ thread_id: 1 });

// Meeting indexes
meetingSchema.index({ host_id: 1 });
meetingSchema.index({ attendee_ids: 1 });
meetingSchema.index({ start_time: 1 });
meetingSchema.index({ workspace_id: 1 });

// Document indexes
documentSchema.index({ workspace_id: 1 });
documentSchema.index({ created_by: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ title: 'text', content: 'text' });

// Task indexes
taskSchema.index({ workspace_id: 1 });
taskSchema.index({ assignee_id: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ due_date: 1 });

// Project indexes
projectSchema.index({ workspace_id: 1 });
projectSchema.index({ owner_id: 1 });

// Calendar event indexes
calendarEventSchema.index({ user_id: 1 });
calendarEventSchema.index({ workspace_id: 1 });
calendarEventSchema.index({ start_time: 1 });

// Workflow indexes
workflowSchema.index({ workspace_id: 1 });
workflowSchema.index({ is_active: 1 });

// ============================================
// EXPORTS
// ============================================

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
export const Channel: Model<IChannel> = mongoose.model<IChannel>('Channel', channelSchema);
export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
export const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', meetingSchema);
export const Document: Model<IDocument> = mongoose.model<IDocument>('Document', documentSchema);
export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
export const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);
export const CalendarEvent: Model<ICalendarEvent> = mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
export const Workflow: Model<IWorkflow> = mongoose.model<IWorkflow>('Workflow', workflowSchema);

export default {
  User,
  Workspace,
  Channel,
  Message,
  Meeting,
  Document,
  Task,
  Project,
  CalendarEvent,
  Workflow,
};