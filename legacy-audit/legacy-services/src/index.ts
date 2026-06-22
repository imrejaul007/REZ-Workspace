import { logger } from '../../shared/logger';
/**
 * REZ Workspace - Work & Productivity Platform
 * Port: 4300
 *
 * Complete implementation for:
 * - Workspace Management
 * - Team Collaboration
 * - Meeting Scheduling & AI Notes
 * - Document Intelligence
 * - Real-time Collaboration (WebSocket)
 * - Task Management
 * - Authentication
 * - Workflow Automation
 * - CorpPerks HRMS Integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { rezWorkspaceHub } from './hub-client';
import {
  format,
  parseISO,
  addHours,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';

// Import routes
import authRoutes from './routes/auth';
import workflowRoutes from './routes/workflow';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  team_ids: string[];
  members: string[];
  created_at: string;
  updated_at: string;
  settings: WorkspaceSettings;
  avatar?: string;
  cover_image?: string;
}

interface WorkspaceSettings {
  allow_guest_access: boolean;
  default_channel_visibility: 'public' | 'private';
  notification_preferences: NotificationPreferences;
  branding?: {
    logo?: string;
    colors?: string[];
  };
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  desktop: boolean;
  mentions_only: boolean;
}

interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct' | 'announcement';
  members: string[];
  created_by: string;
  created_at: string;
  is_archived: boolean;
  topic?: string;
  purpose?: string;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  edited_at?: string;
  reactions: Reaction[];
  thread_id?: string;
  attachments: Attachment[];
  is_pinned: boolean;
  is_deleted: boolean;
  reply_count: number;
  metadata?: Record<string, unknown>;
}

interface Reaction {
  emoji: string;
  user_ids: string[];
  count: number;
}

interface Attachment {
  id: string;
  type: 'file' | 'image' | 'link' | 'code';
  url: string;
  name: string;
  size?: number;
  mime_type?: string;
  preview?: string;
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  attendee_ids: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_link?: string;
  recording_url?: string;
  notes?: MeetingNotes;
  transcript?: string;
  calendar_event_id?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  settings: MeetingSettings;
  workspace_id?: string;
}

interface MeetingNotes {
  summary?: string;
  action_items: ActionItem[];
  key_decisions: string[];
  topics_discussed: string[];
  generated_by_ai: boolean;
  last_edited?: string;
}

interface ActionItem {
  id: string;
  title: string;
  assignee_id?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface MeetingSettings {
  is_public: boolean;
  allow_recording: boolean;
  waiting_room_enabled: boolean;
  mute_on_entry: boolean;
  video_enabled: boolean;
  screen_share_enabled: boolean;
  chat_enabled: boolean;
}

interface Document {
  id: string;
  title: string;
  content?: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'file' | 'folder';
  workspace_id: string;
  channel_id?: string;
  created_by: string;
  parent_folder_id?: string;
  current_version: number;
  versions: DocumentVersion[];
  tags: string[];
  is_starred: boolean;
  is_archived: boolean;
  shared_with: SharedAccess[];
  permissions: DocumentPermissions;
  created_at: string;
  updated_at: string;
  last_edited_by?: string;
  word_count?: number;
  embedding_id?: string;
  analysis?: DocumentAnalysis;
}

interface DocumentVersion {
  version: number;
  created_by: string;
  created_at: string;
  content_snapshot?: string;
  change_summary?: string;
}

interface SharedAccess {
  user_id: string;
  permission: 'view' | 'comment' | 'edit' | 'admin';
  granted_by: string;
  granted_at: string;
}

interface DocumentPermissions {
  public: boolean;
  allow_download: boolean;
  allow_print: boolean;
  require_signatures: boolean;
  editable_by: string[];
  viewable_by: string[];
}

interface DocumentAnalysis {
  sentiment?: string;
  key_topics?: string[];
  readability_score?: number;
  suggested_categories?: string[];
  similar_documents?: string[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  workspace_id: string;
  channel_id?: string;
  project_id?: string;
  assignee_id?: string;
  reporter_id: string;
  due_date?: string;
  start_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  labels: string[];
  subtasks: SubTask[];
  dependencies: string[];
  time_estimate?: number;
  time_spent?: number;
  attachments: Attachment[];
  comments: TaskComment[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  meeting_id?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  channel_id?: string;
  owner_id: string;
  members: string[];
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  start_date?: string;
  target_date?: string;
  budget?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'task_due' | 'reminder' | 'out_of_office' | 'other';
  user_id: string;
  workspace_id?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  recurrence?: string;
  attendees?: string[];
  location?: string;
  meeting_id?: string;
  task_id?: string;
  reminder?: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface CollaborationSession {
  id: string;
  document_id: string;
  type: 'document' | 'spreadsheet' | 'whiteboard';
  participants: string[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
  changes: DocumentChange[];
  started_at: string;
  ended_at?: string;
}

interface CursorPosition {
  user_id: string;
  position: { line: number; column: number };
  timestamp: string;
}

interface SelectionRange {
  user_id: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  timestamp: string;
}

interface DocumentChange {
  id: string;
  user_id: string;
  type: 'insert' | 'delete' | 'update' | 'format';
  position: { line: number; column: number };
  content?: string;
  timestamp: string;
}

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  user_id?: string;
  workspace_id?: string;
  channel_id?: string;
  subscribed_to: string[];
  last_ping: string;
}

// ============================================
// IN-MEMORY DATA STORE
// ============================================

class WorkspaceDataStore {
  workspaces: Map<string, Workspace> = new Map();
  channels: Map<string, Channel> = new Map();
  messages: Map<string, Message[]> = new Map();
  meetings: Map<string, Meeting> = new Map();
  documents: Map<string, Document> = new Map();
  tasks: Map<string, Task> = new Map();
  projects: Map<string, Project> = new Map();
  calendarEvents: Map<string, CalendarEvent> = new Map();
  users: Map<string, User> = new Map();
  collaborationSessions: Map<string, CollaborationSession> = new Map();
  wsClients: Map<string, WebSocketClient> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed demo users
    const demoUsers: User[] = [
      { id: 'user-1', name: 'Alice Chen', email: 'alice@rtnm.digital', status: 'online', last_seen: new Date().toISOString() },
      { id: 'user-2', name: 'Bob Smith', email: 'bob@rtnm.digital', status: 'away', last_seen: new Date().toISOString() },
      { id: 'user-3', name: 'Carol Davis', email: 'carol@rtnm.digital', status: 'busy', last_seen: new Date().toISOString() },
    ];
    demoUsers.forEach(u => this.users.set(u.id, u));

    // Seed demo workspace
    const demoWorkspace: Workspace = {
      id: 'ws-1',
      name: 'RTNM Digital',
      description: 'Main workspace for RTNM Digital ecosystem',
      owner_id: 'user-1',
      team_ids: ['team-engineering', 'team-product', 'team-design'],
      members: ['user-1', 'user-2', 'user-3'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: {
        allow_guest_access: true,
        default_channel_visibility: 'public',
        notification_preferences: { email: true, push: true, desktop: true, mentions_only: false },
        branding: { colors: ['#6366f1', '#8b5cf6'] },
      },
    };
    this.workspaces.set(demoWorkspace.id, demoWorkspace);

    // Seed demo channels
    const demoChannels: Channel[] = [
      { id: 'ch-1', workspace_id: 'ws-1', name: 'general', description: 'General discussions', type: 'public', members: ['user-1', 'user-2', 'user-3'], created_by: 'user-1', created_at: new Date().toISOString(), is_archived: false, topic: 'Company-wide announcements' },
      { id: 'ch-2', workspace_id: 'ws-1', name: 'engineering', description: 'Engineering team discussions', type: 'public', members: ['user-1', 'user-2'], created_by: 'user-1', created_at: new Date().toISOString(), is_archived: false, topic: 'Technical discussions' },
      { id: 'ch-3', workspace_id: 'ws-1', name: 'product', description: 'Product team channel', type: 'public', members: ['user-1', 'user-3'], created_by: 'user-3', created_at: new Date().toISOString(), is_archived: false },
      { id: 'ch-4', workspace_id: 'ws-1', name: 'leadership', description: 'Leadership discussions', type: 'private', members: ['user-1'], created_by: 'user-1', created_at: new Date().toISOString(), is_archived: false },
    ];
    demoChannels.forEach(c => this.channels.set(c.id, c));

    // Seed demo messages
    const demoMessages: Message[] = [
      { id: 'msg-1', channel_id: 'ch-1', sender_id: 'user-1', content: 'Welcome to REZ Workspace!', timestamp: new Date().toISOString(), reactions: [], attachments: [], is_pinned: true, is_deleted: false, reply_count: 2 },
      { id: 'msg-2', channel_id: 'ch-1', sender_id: 'user-2', content: 'Excited to be here!', timestamp: new Date().toISOString(), reactions: [{ emoji: '🎉', user_ids: ['user-1'], count: 1 }], attachments: [], is_pinned: false, is_deleted: false, reply_count: 0 },
    ];
    this.messages.set('ch-1', demoMessages);

    // Seed demo meetings
    const now = new Date();
    const demoMeetings: Meeting[] = [
      {
        id: 'mtg-1',
        title: 'Weekly Team Standup',
        description: 'Regular weekly standup meeting',
        host_id: 'user-1',
        start_time: addHours(now, 2).toISOString(),
        end_time: addHours(now, 3).toISOString(),
        duration: 60,
        attendee_ids: ['user-1', 'user-2', 'user-3'],
        status: 'scheduled',
        meeting_link: 'https://meet.rtnm.digital/weekly-standup',
        is_recurring: true,
        recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: { is_public: true, allow_recording: true, waiting_room_enabled: false, mute_on_entry: false, video_enabled: true, screen_share_enabled: true, chat_enabled: true },
        notes: { summary: 'Discussed sprint progress', action_items: [], key_decisions: [], topics_discussed: [], generated_by_ai: false },
      },
      {
        id: 'mtg-2',
        title: 'Product Review',
        description: 'Q2 Product roadmap review',
        host_id: 'user-3',
        start_time: addDays(now, 1).toISOString(),
        end_time: addHours(addDays(now, 1), 2).toISOString(),
        duration: 120,
        attendee_ids: ['user-1', 'user-3'],
        status: 'scheduled',
        meeting_link: 'https://meet.rtnm.digital/product-review',
        is_recurring: false,
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: { is_public: false, allow_recording: true, waiting_room_enabled: true, mute_on_entry: true, video_enabled: true, screen_share_enabled: true, chat_enabled: true },
      },
    ];
    demoMeetings.forEach(m => this.meetings.set(m.id, m));

    // Seed demo documents
    const demoDocuments: Document[] = [
      { id: 'doc-1', title: 'Q2 Product Roadmap', content: '# Q2 Product Roadmap\n\n## Goals\n- Launch new features\n- Improve user experience', type: 'document', workspace_id: 'ws-1', created_by: 'user-3', current_version: 3, versions: [{ version: 1, created_by: 'user-3', created_at: new Date().toISOString(), change_summary: 'Initial draft' }, { version: 2, created_by: 'user-1', created_at: new Date().toISOString(), change_summary: 'Added goals' }, { version: 3, created_by: 'user-3', created_at: new Date().toISOString(), change_summary: 'Updated timeline' }], tags: ['product', 'roadmap', 'q2'], is_starred: true, is_archived: false, shared_with: [{ user_id: 'user-1', permission: 'edit', granted_by: 'user-3', granted_at: new Date().toISOString() }], permissions: { public: false, allow_download: true, allow_print: true, require_signatures: false, editable_by: ['user-1', 'user-3'], viewable_by: ['user-1', 'user-2', 'user-3'] }, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), word_count: 45, analysis: { sentiment: 'positive', key_topics: ['product', 'launch', 'features'], readability_score: 75, suggested_categories: ['Product Management'] } },
      { id: 'doc-2', title: 'Engineering Best Practices', content: '# Engineering Best Practices\n\n## Code Review\n- All PRs require at least 2 approvals\n- Use descriptive commit messages', type: 'document', workspace_id: 'ws-1', created_by: 'user-1', current_version: 1, versions: [{ version: 1, created_by: 'user-1', created_at: new Date().toISOString() }], tags: ['engineering', 'best-practices'], is_starred: false, is_archived: false, shared_with: [], permissions: { public: true, allow_download: true, allow_print: true, require_signatures: false, editable_by: ['user-1'], viewable_by: ['user-1', 'user-2', 'user-3'] }, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), word_count: 38 },
    ];
    demoDocuments.forEach(d => this.documents.set(d.id, d));

    // Seed demo tasks
    const demoTasks: Task[] = [
      { id: 'task-1', title: 'Implement user authentication', description: 'Add OAuth2 support to the platform', workspace_id: 'ws-1', channel_id: 'ch-2', project_id: 'proj-1', assignee_id: 'user-2', reporter_id: 'user-1', due_date: addDays(now, 7).toISOString(), priority: 'high', status: 'in_progress', labels: ['backend', 'security'], subtasks: [{ id: 'st-1', title: 'Setup OAuth2 provider', completed: true }, { id: 'st-2', title: 'Implement callback handler', completed: false }], dependencies: [], time_estimate: 480, time_spent: 120, attachments: [], comments: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'task-2', title: 'Design new dashboard UI', description: 'Create wireframes for the analytics dashboard', workspace_id: 'ws-1', channel_id: 'ch-3', assignee_id: 'user-3', reporter_id: 'user-1', due_date: addDays(now, 3).toISOString(), priority: 'medium', status: 'todo', labels: ['design', 'ui'], subtasks: [], dependencies: [], attachments: [], comments: [{ id: 'comment-1', user_id: 'user-1', content: 'Please check the Figma file for reference', created_at: new Date().toISOString() }], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    demoTasks.forEach(t => this.tasks.set(t.id, t));

    // Seed demo projects
    const demoProjects: Project[] = [
      { id: 'proj-1', name: 'Platform v2.0', description: 'Next generation platform development', workspace_id: 'ws-1', owner_id: 'user-1', members: ['user-1', 'user-2', 'user-3'], status: 'active', start_date: startOfDay(now).toISOString(), target_date: addDays(now, 90).toISOString(), budget: 500000, tags: ['platform', 'major'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    demoProjects.forEach(p => this.projects.set(p.id, p));
  }

  // Get next ID
  nextId(prefix: string): string {
    return `${prefix}-${uuidv4().slice(0, 8)}`;
  }
}

const store = new WorkspaceDataStore();

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = parseInt(process.env.PORT || '4300', 10);
const httpServer = createServer(app);

// ============================================
// MIDDLEWARE
// ============================================

interface AuthenticatedRequest extends Request {
  user?: User;
  workspace?: Workspace;
}

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const userId = req.headers['x-user-id'] as string;

  if (userId) {
    const user = store.users.get(userId);
    if (user) {
      req.user = user;
    }
  }

  // For demo purposes, set a default user if none provided
  if (!req.user) {
    req.user = store.users.get('user-1');
  }

  next();
};

const workspaceMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const workspaceId = req.headers['x-workspace-id'] as string || req.body?.workspace_id;

  if (workspaceId) {
    const workspace = store.workspaces.get(workspaceId);
    if (workspace) {
      req.workspace = workspace;
    }
  }

  // Default to first workspace
  if (!req.workspace) {
    const firstWorkspace = Array.from(store.workspaces.values())[0];
    req.workspace = firstWorkspace;
  }

  next();
};

app.use(authMiddleware);
app.use(workspaceMiddleware);

// ============================================
// API ROUTES
// ============================================

// Auth routes
app.use('/api/auth', authRoutes);

// Workflow routes
app.use('/api/workflows', workflowRoutes);

// ============================================
// HEALTH CHECK ROUTES
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-Workspace',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await rezWorkspaceHub.getWalletBalance('health-check');
    res.json({
      status: 'ready',
      unifiedHub: true,
      workspace: store.workspaces.size,
      channels: store.channels.size,
      meetings: store.meetings.size,
      documents: store.documents.size,
      tasks: store.tasks.size,
    });
  } catch {
    res.json({ status: 'ready', unifiedHub: false });
  }
});

app.get('/health/metrics', (req: Request, res: Response) => {
  res.json({
    workspaces: store.workspaces.size,
    channels: store.channels.size,
    messages: Array.from(store.messages.values()).reduce((acc, msgs) => acc + msgs.length, 0),
    meetings: store.meetings.size,
    documents: store.documents.size,
    tasks: store.tasks.size,
    projects: store.projects.size,
    users: store.users.size,
    wsClients: store.wsClients.size,
  });
});

// ============================================
// WORKSPACE MANAGEMENT ROUTES
// ============================================

// List all workspaces
app.get('/api/workspaces', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const workspaces = Array.from(store.workspaces.values())
    .filter(ws => ws.members.includes(userId || ''))
    .map(ws => ({
      ...ws,
      member_count: ws.members.length,
      channel_count: Array.from(store.channels.values()).filter(c => c.workspace_id === ws.id).length,
    }));

  res.json({ success: true, workspaces });
});

// Get workspace by ID
app.get('/api/workspaces/:id', (req: Request, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  const channels = Array.from(store.channels.values()).filter(c => c.workspace_id === workspace.id);
  const members = workspace.members.map(id => store.users.get(id)).filter(Boolean);

  res.json({ success: true, workspace, channels, members });
});

// Create workspace
app.post('/api/workspaces', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, settings } = req.body;
    const ownerId = req.user?.id;

    if (!name || !ownerId) {
      return res.status(400).json({ success: false, error: 'Name and owner are required' });
    }

    const workspace: Workspace = {
      id: store.nextId('ws'),
      name,
      description,
      owner_id: ownerId,
      team_ids: [],
      members: [ownerId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: settings || {
        allow_guest_access: true,
        default_channel_visibility: 'public',
        notification_preferences: { email: true, push: true, desktop: true, mentions_only: false },
      },
    };

    // Create workspace twin via HOJAI
    await rezWorkspaceHub.createWorkspace({ name, description, owner_id: ownerId });

    // Track event
    await rezWorkspaceHub.trackEvent(ownerId, 'workspace.created', { workspace_id: workspace.id });

    store.workspaces.set(workspace.id, workspace);

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update workspace
app.patch('/api/workspaces/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspace = store.workspaces.get(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    if (workspace.owner_id !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'Only owner can update workspace' });
    }

    const { name, description, settings, avatar, cover_image } = req.body;
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    if (avatar) workspace.avatar = avatar;
    if (cover_image) workspace.cover_image = cover_image;
    workspace.updated_at = new Date().toISOString();

    await rezWorkspaceHub.updateWorkspace(workspace.id, { name, description });

    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete workspace
app.delete('/api/workspaces/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  if (workspace.owner_id !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Only owner can delete workspace' });
  }

  store.workspaces.delete(req.params.id);
  res.json({ success: true, message: 'Workspace deleted' });
});

// Add member to workspace
app.post('/api/workspaces/:id/members', (req: AuthenticatedRequest, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  const { user_id, role } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  if (!workspace.members.includes(user_id)) {
    workspace.members.push(user_id);
    workspace.updated_at = new Date().toISOString();
  }

  res.json({ success: true, workspace });
});

// Remove member from workspace
app.delete('/api/workspaces/:id/members/:userId', (req: AuthenticatedRequest, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  const memberIndex = workspace.members.indexOf(req.params.userId);
  if (memberIndex === -1) {
    return res.status(404).json({ success: false, error: 'Member not found' });
  }

  workspace.members.splice(memberIndex, 1);
  workspace.updated_at = new Date().toISOString();

  res.json({ success: true, workspace });
});

// Get workspace analytics
app.get('/api/workspaces/:id/analytics', async (req: Request, res: Response) => {
  try {
    const workspace = store.workspaces.get(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const channels = Array.from(store.channels.values()).filter(c => c.workspace_id === workspace.id);
    const messages = channels.reduce((acc, ch) => acc + (store.messages.get(ch.id)?.length || 0), 0);
    const meetings = Array.from(store.meetings.values()).filter(m => m.workspace_id === workspace.id);
    const documents = Array.from(store.documents.values()).filter(d => d.workspace_id === workspace.id);
    const tasks = Array.from(store.tasks.values()).filter(t => t.workspace_id === workspace.id);

    // Get AI-powered insights
    const insights = await rezWorkspaceHub.getWorkspaceAnalytics(workspace.id);

    res.json({
      success: true,
      analytics: {
        workspace_id: workspace.id,
        member_count: workspace.members.length,
        channel_count: channels.length,
        message_count: messages,
        meeting_count: meetings.length,
        document_count: documents.length,
        task_count: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'done').length,
        pending_tasks: tasks.filter(t => t.status !== 'done').length,
        upcoming_meetings: meetings.filter(m => m.status === 'scheduled').length,
      },
      insights,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// CHANNEL MANAGEMENT ROUTES
// ============================================

// List channels in workspace
app.get('/api/workspaces/:id/channels', (req: Request, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  const channels = Array.from(store.channels.values())
    .filter(c => c.workspace_id === workspace.id && !c.is_archived)
    .map(c => ({
      ...c,
      member_count: c.members.length,
      message_count: store.messages.get(c.id)?.length || 0,
    }));

  res.json({ success: true, channels });
});

// Create channel
app.post('/api/workspaces/:id/channels', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspace = store.workspaces.get(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const { name, description, type, members, topic } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Channel name is required' });
    }

    const channel: Channel = {
      id: store.nextId('ch'),
      workspace_id: workspace.id,
      name,
      description,
      type: type || 'public',
      members: members || [req.user?.id],
      created_by: req.user?.id || '',
      created_at: new Date().toISOString(),
      is_archived: false,
      topic,
    };

    store.channels.set(channel.id, channel);
    store.messages.set(channel.id, []);

    await rezWorkspaceHub.trackEvent(req.user?.id || 'unknown', 'channel.created', { channel_id: channel.id });

    res.status(201).json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get channel
app.get('/api/channels/:id', (req: Request, res: Response) => {
  const channel = store.channels.get(req.params.id);
  if (!channel) {
    return res.status(404).json({ success: false, error: 'Channel not found' });
  }

  const messages = store.messages.get(channel.id) || [];

  res.json({ success: true, channel, messages });
});

// Update channel
app.patch('/api/channels/:id', (req: AuthenticatedRequest, res: Response) => {
  const channel = store.channels.get(req.params.id);
  if (!channel) {
    return res.status(404).json({ success: false, error: 'Channel not found' });
  }

  const { name, description, topic, members } = req.body;
  if (name) channel.name = name;
  if (description !== undefined) channel.description = description;
  if (topic !== undefined) channel.topic = topic;
  if (members) channel.members = members;

  res.json({ success: true, channel });
});

// Archive channel
app.post('/api/channels/:id/archive', (req: Request, res: Response) => {
  const channel = store.channels.get(req.params.id);
  if (!channel) {
    return res.status(404).json({ success: false, error: 'Channel not found' });
  }

  channel.is_archived = true;
  res.json({ success: true, channel });
});

// ============================================
// MESSAGING ROUTES
// ============================================

// Get messages in channel
app.get('/api/channels/:id/messages', (req: Request, res: Response) => {
  const channel = store.channels.get(req.params.id);
  if (!channel) {
    return res.status(404).json({ success: false, error: 'Channel not found' });
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const messages = store.messages.get(channel.id) || [];

  res.json({
    success: true,
    messages: messages.slice(offset, offset + limit),
    total: messages.length,
    has_more: offset + limit < messages.length,
  });
});

// Send message
app.post('/api/channels/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const channel = store.channels.get(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    const { content, attachments, thread_id, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const message: Message = {
      id: store.nextId('msg'),
      channel_id: channel.id,
      sender_id: req.user?.id || '',
      content,
      timestamp: new Date().toISOString(),
      reactions: [],
      thread_id,
      attachments: attachments || [],
      is_pinned: false,
      is_deleted: false,
      reply_count: 0,
      metadata,
    };

    const messages = store.messages.get(channel.id) || [];
    messages.push(message);
    store.messages.set(channel.id, messages);

    // Broadcast via WebSocket
    broadcastToChannel(channel.id, { type: 'new_message', message });

    // Track event
    await rezWorkspaceHub.trackEvent(req.user?.id || 'unknown', 'message.sent', {
      channel_id: channel.id,
      message_id: message.id,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update message
app.patch('/api/messages/:id', (req: AuthenticatedRequest, res: Response) => {
  const { content } = req.body;
  let targetMessage: Message | undefined;
  let targetChannel: string | undefined;

  for (const [channelId, messages] of store.messages.entries()) {
    const msg = messages.find(m => m.id === req.params.id);
    if (msg) {
      targetMessage = msg;
      targetChannel = channelId;
      break;
    }
  }

  if (!targetMessage) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  if (targetMessage.sender_id !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Can only edit your own messages' });
  }

  targetMessage.content = content;
  targetMessage.edited_at = new Date().toISOString();

  if (targetChannel) {
    broadcastToChannel(targetChannel, { type: 'message_updated', message: targetMessage });
  }

  res.json({ success: true, message: targetMessage });
});

// Delete message
app.delete('/api/messages/:id', (req: AuthenticatedRequest, res: Response) => {
  let targetMessage: Message | undefined;
  let targetChannel: string | undefined;

  for (const [channelId, messages] of store.messages.entries()) {
    const msg = messages.find(m => m.id === req.params.id);
    if (msg) {
      targetMessage = msg;
      targetChannel = channelId;
      break;
    }
  }

  if (!targetMessage) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  targetMessage.is_deleted = true;
  targetMessage.content = '[deleted]';

  if (targetChannel) {
    broadcastToChannel(targetChannel, { type: 'message_deleted', message_id: req.params.id });
  }

  res.json({ success: true, message: targetMessage });
});

// Add reaction to message
app.post('/api/messages/:id/reactions', (req: AuthenticatedRequest, res: Response) => {
  const { emoji } = req.body;
  let targetMessage: Message | undefined;
  let targetChannel: string | undefined;

  for (const [channelId, messages] of store.messages.entries()) {
    const msg = messages.find(m => m.id === req.params.id);
    if (msg) {
      targetMessage = msg;
      targetChannel = channelId;
      break;
    }
  }

  if (!targetMessage) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  const existingReaction = targetMessage.reactions.find(r => r.emoji === emoji);
  if (existingReaction) {
    if (!existingReaction.user_ids.includes(req.user?.id || '')) {
      existingReaction.user_ids.push(req.user?.id || '');
      existingReaction.count++;
    }
  } else {
    targetMessage.reactions.push({ emoji, user_ids: [req.user?.id || ''], count: 1 });
  }

  if (targetChannel) {
    broadcastToChannel(targetChannel, { type: 'reaction_added', message: targetMessage });
  }

  res.json({ success: true, message: targetMessage });
});

// Pin message
app.post('/api/messages/:id/pin', (req: Request, res: Response) => {
  let targetMessage: Message | undefined;

  for (const messages of store.messages.values()) {
    const msg = messages.find(m => m.id === req.params.id);
    if (msg) {
      targetMessage = msg;
      break;
    }
  }

  if (!targetMessage) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  targetMessage.is_pinned = true;
  res.json({ success: true, message: targetMessage });
});

// ============================================
// MEETING ROUTES
// ============================================

// List meetings
app.get('/api/meetings', (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;
  const userId = req.query.user_id as string;
  const status = req.query.status as string;

  let meetings = Array.from(store.meetings.values());

  if (workspaceId) {
    meetings = meetings.filter(m => m.workspace_id === workspaceId);
  }

  if (userId) {
    meetings = meetings.filter(m => m.host_id === userId || m.attendee_ids.includes(userId));
  }

  if (status) {
    meetings = meetings.filter(m => m.status === status);
  }

  // Sort by start time
  meetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  res.json({ success: true, meetings });
});

// Get meeting by ID
app.get('/api/meetings/:id', (req: Request, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  res.json({ success: true, meeting });
});

// Create meeting
app.post('/api/meetings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      attendee_ids,
      workspace_id,
      recurring,
      recurrence_rule,
      settings,
      timezone,
    } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Title, start time, and end time are required' });
    }

    const hostId = req.user?.id;
    const startDate = parseISO(start_time);
    const endDate = parseISO(end_time);

    if (isAfter(startDate, endDate)) {
      return res.status(400).json({ success: false, error: 'End time must be after start time' });
    }

    const meeting: Meeting = {
      id: store.nextId('mtg'),
      title,
      description,
      host_id: hostId || '',
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration: Math.round((endDate.getTime() - startDate.getTime()) / 60000),
      attendee_ids: attendee_ids || [],
      status: 'scheduled',
      meeting_link: `https://meet.rtnm.digital/${store.nextId('meet')}`,
      is_recurring: recurring || false,
      recurrence_rule,
      timezone: timezone || 'Asia/Kolkata',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: settings || {
        is_public: true,
        allow_recording: true,
        waiting_room_enabled: false,
        mute_on_entry: false,
        video_enabled: true,
        screen_share_enabled: true,
        chat_enabled: true,
      },
    };

    if (workspace_id) {
      meeting.workspace_id = workspace_id;
    }

    // Create calendar event
    const calendarEvent: CalendarEvent = {
      id: store.nextId('evt'),
      title: meeting.title,
      description: meeting.description,
      type: 'meeting',
      user_id: meeting.host_id,
      workspace_id,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      all_day: false,
      meeting_id: meeting.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.calendarEvents.set(calendarEvent.id, calendarEvent);

    store.meetings.set(meeting.id, meeting);

    // Track event
    await rezWorkspaceHub.trackEvent(hostId, 'meeting.created', { meeting_id: meeting.id });

    res.status(201).json({ success: true, meeting, calendar_event: calendarEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update meeting
app.patch('/api/meetings/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const meeting = store.meetings.get(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    if (meeting.host_id !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'Only host can update meeting' });
    }

    const { title, description, start_time, end_time, attendee_ids, status, settings } = req.body;

    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (start_time) {
      meeting.start_time = start_time;
      const startDate = parseISO(start_time);
      const endDate = parseISO(meeting.end_time);
      meeting.duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    }
    if (end_time) {
      meeting.end_time = end_time;
      const startDate = parseISO(meeting.start_time);
      const endDate = parseISO(end_time);
      meeting.duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    }
    if (attendee_ids) meeting.attendee_ids = attendee_ids;
    if (status) meeting.status = status;
    if (settings) meeting.settings = { ...meeting.settings, ...settings };
    meeting.updated_at = new Date().toISOString();

    // Update calendar event
    const calendarEvent = Array.from(store.calendarEvents.values())
      .find(e => e.meeting_id === meeting.id);
    if (calendarEvent) {
      calendarEvent.title = meeting.title;
      calendarEvent.start_time = meeting.start_time;
      calendarEvent.end_time = meeting.end_time;
      calendarEvent.updated_at = new Date().toISOString();
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Cancel meeting
app.post('/api/meetings/:id/cancel', (req: AuthenticatedRequest, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Only host can cancel meeting' });
  }

  meeting.status = 'cancelled';
  meeting.updated_at = new Date().toISOString();

  res.json({ success: true, meeting });
});

// Start meeting
app.post('/api/meetings/:id/start', (req: AuthenticatedRequest, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Only host can start meeting' });
  }

  meeting.status = 'in_progress';
  meeting.updated_at = new Date().toISOString();

  res.json({ success: true, meeting });
});

// End meeting
app.post('/api/meetings/:id/end', async (req: AuthenticatedRequest, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  meeting.status = 'completed';
  meeting.updated_at = new Date().toISOString();

  res.json({ success: true, meeting });
});

// AI Meeting Notes
app.post('/api/meetings/:id/notes/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const meeting = store.meetings.get(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const { transcript } = req.body;

    if (transcript) {
      meeting.transcript = transcript;

      // Generate AI summary and action items
      const aiResult = await rezWorkspaceHub.processMeetingWithAI(meeting.id, transcript);

      meeting.notes = {
        summary: aiResult.summary?.summary || 'Summary generated from transcript',
        action_items: aiResult.action_items?.items || [],
        key_decisions: aiResult.action_items?.decisions || [],
        topics_discussed: aiResult.summary?.topics || [],
        generated_by_ai: true,
        last_edited: new Date().toISOString(),
      };

      // Create tasks from action items
      for (const item of meeting.notes.action_items) {
        const task: Task = {
          id: store.nextId('task'),
          title: item.title,
          workspace_id: meeting.workspace_id || 'ws-1',
          assignee_id: item.assignee_id,
          due_date: item.due_date,
          priority: item.priority,
          status: 'todo',
          labels: ['meeting-action'],
          subtasks: [],
          dependencies: [],
          attachments: [],
          comments: [],
          reporter_id: meeting.host_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          meeting_id: meeting.id,
        };
        store.tasks.set(task.id, task);
      }
    }

    meeting.updated_at = new Date().toISOString();

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get meeting notes
app.get('/api/meetings/:id/notes', (req: Request, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  res.json({ success: true, notes: meeting.notes });
});

// Update meeting notes
app.patch('/api/meetings/:id/notes', (req: AuthenticatedRequest, res: Response) => {
  const meeting = store.meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Only host can update notes' });
  }

  const { summary, action_items, key_decisions, topics_discussed } = req.body;

  if (!meeting.notes) {
    meeting.notes = { summary: '', action_items: [], key_decisions: [], topics_discussed: [], generated_by_ai: false };
  }

  if (summary !== undefined) meeting.notes.summary = summary;
  if (action_items !== undefined) meeting.notes.action_items = action_items;
  if (key_decisions !== undefined) meeting.notes.key_decisions = key_decisions;
  if (topics_discussed !== undefined) meeting.notes.topics_discussed = topics_discussed;
  meeting.notes.last_edited = new Date().toISOString();
  meeting.notes.generated_by_ai = false;

  meeting.updated_at = new Date().toISOString();

  res.json({ success: true, meeting });
});

// ============================================
// DOCUMENT ROUTES
// ============================================

// List documents
app.get('/api/documents', (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;
  const type = req.query.type as string;
  const starred = req.query.starred === 'true';

  let documents = Array.from(store.documents.values());

  if (workspaceId) {
    documents = documents.filter(d => d.workspace_id === workspaceId);
  }

  if (type) {
    documents = documents.filter(d => d.type === type);
  }

  if (starred) {
    documents = documents.filter(d => d.is_starred);
  }

  documents = documents.filter(d => !d.is_archived);

  res.json({ success: true, documents });
});

// Get document by ID
app.get('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    const document = store.documents.get(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Get AI analysis if available
    let analysis = document.analysis;
    if (!analysis && document.content) {
      const aiResult = await rezWorkspaceHub.analyzeDocumentWithAI(document.id, document.content);
      document.analysis = aiResult.analysis;
      analysis = document.analysis;
    }

    res.json({ success: true, document, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create document
app.post('/api/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, type, workspace_id, channel_id, parent_folder_id, tags } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const document: Document = {
      id: store.nextId('doc'),
      title,
      content,
      type: type || 'document',
      workspace_id: workspace_id || req.workspace?.id || 'ws-1',
      channel_id,
      created_by: req.user?.id || '',
      parent_folder_id,
      current_version: 1,
      versions: [{
        version: 1,
        created_by: req.user?.id || '',
        created_at: new Date().toISOString(),
        content_snapshot: content?.slice(0, 500),
        change_summary: 'Initial version',
      }],
      tags: tags || [],
      is_starred: false,
      is_archived: false,
      shared_with: [],
      permissions: {
        public: false,
        allow_download: true,
        allow_print: true,
        require_signatures: false,
        editable_by: [req.user?.id || ''],
        viewable_by: [req.user?.id || ''],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      word_count: content?.split(/\s+/).length || 0,
    };

    // Generate AI embedding
    if (content) {
      const embedding = await rezWorkspaceHub.generateDocumentEmbedding(document.id, content);
      document.embedding_id = embedding?.embedding_id;
    }

    // Store in memory
    if (content) {
      await rezWorkspaceHub.storeWorkspaceMemory(document.id, content);
    }

    store.documents.set(document.id, document);

    await rezWorkspaceHub.trackEvent(req.user?.id || 'unknown', 'document.created', { document_id: document.id });

    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update document
app.patch('/api/documents/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const document = store.documents.get(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { title, content, tags, is_starred } = req.body;

    if (title) document.title = title;
    if (tags) document.tags = tags;
    if (is_starred !== undefined) document.is_starred = is_starred;
    if (content && content !== document.content) {
      // Create new version
      document.current_version++;
      document.versions.push({
        version: document.current_version,
        created_by: req.user?.id || '',
        created_at: new Date().toISOString(),
        content_snapshot: content.slice(0, 500),
        change_summary: 'Content updated',
      });
      document.content = content;
      document.word_count = content.split(/\s+/).length;
      document.last_edited_by = req.user?.id;

      // Update AI embedding
      const embedding = await rezWorkspaceHub.generateDocumentEmbedding(document.id, content);
      document.embedding_id = embedding?.embedding_id;

      // Store updated content in memory
      await rezWorkspaceHub.storeWorkspaceMemory(document.id, content);
    }

    document.updated_at = new Date().toISOString();

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete document (soft delete)
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const document = store.documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  document.is_archived = true;
  document.updated_at = new Date().toISOString();

  res.json({ success: true, message: 'Document archived' });
});

// Get document version
app.get('/api/documents/:id/versions/:version', (req: Request, res: Response) => {
  const document = store.documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  const version = document.versions.find(v => v.version === parseInt(req.params.version));
  if (!version) {
    return res.status(404).json({ success: false, error: 'Version not found' });
  }

  res.json({ success: true, version, document });
});

// Share document
app.post('/api/documents/:id/share', (req: AuthenticatedRequest, res: Response) => {
  const document = store.documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  const { user_id, permission } = req.body;
  if (!user_id || !permission) {
    return res.status(400).json({ success: false, error: 'User ID and permission are required' });
  }

  const existingShare = document.shared_with.find(s => s.user_id === user_id);
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.granted_at = new Date().toISOString();
  } else {
    document.shared_with.push({
      user_id,
      permission,
      granted_by: req.user?.id || '',
      granted_at: new Date().toISOString(),
    });
  }

  // Update permissions
  if (!document.permissions.editable_by.includes(user_id) && (permission === 'edit' || permission === 'admin')) {
    document.permissions.editable_by.push(user_id);
  }
  if (!document.permissions.viewable_by.includes(user_id)) {
    document.permissions.viewable_by.push(user_id);
  }

  document.updated_at = new Date().toISOString();

  res.json({ success: true, document });
});

// Intelligent document search
app.get('/api/documents/search', async (req: Request, res: Response) => {
  try {
    const { q, workspace_id } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    // Search in local documents
    const query = q.toLowerCase();
    const workspaceFilter = typeof workspace_id === 'string' ? workspace_id : undefined;
    let documents = Array.from(store.documents.values())
      .filter(d => !d.is_archived)
      .filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.content?.toLowerCase().includes(query) ||
        d.tags.some(t => t.toLowerCase().includes(query))
      );

    if (workspaceFilter) {
      documents = documents.filter(d => d.workspace_id === workspaceFilter);
    }

    // Get AI-powered search results
    const aiResults = await rezWorkspaceHub.intelligentDocumentSearch(q, workspaceFilter || 'ws-1');

    res.json({
      success: true,
      query: q,
      results: documents,
      ai_suggestions: aiResults.suggestions,
      total: documents.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Analyze document with AI
app.post('/api/documents/:id/analyze', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const document = store.documents.get(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (!document.content) {
      return res.status(400).json({ success: false, error: 'Document has no content to analyze' });
    }

    const analysis = await rezWorkspaceHub.analyzeDocumentWithAI(document.id, document.content);
    document.analysis = analysis.analysis;
    document.embedding_id = analysis.embedding?.embedding_id;

    res.json({ success: true, analysis: document.analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// TASK ROUTES
// ============================================

// List tasks
app.get('/api/tasks', (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;
  const channelId = req.query.channel_id as string;
  const assigneeId = req.query.assignee_id as string;
  const status = req.query.status as string;
  const priority = req.query.priority as string;

  let tasks = Array.from(store.tasks.values());

  if (workspaceId) tasks = tasks.filter(t => t.workspace_id === workspaceId);
  if (channelId) tasks = tasks.filter(t => t.channel_id === channelId);
  if (assigneeId) tasks = tasks.filter(t => t.assignee_id === assigneeId);
  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);

  res.json({ success: true, tasks });
});

// Get task by ID
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = store.tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  res.json({ success: true, task });
});

// Create task
app.post('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      workspace_id,
      channel_id,
      project_id,
      assignee_id,
      due_date,
      priority,
      labels,
      subtasks,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const task: Task = {
      id: store.nextId('task'),
      title,
      description,
      workspace_id: workspace_id || req.workspace?.id || 'ws-1',
      channel_id,
      project_id,
      assignee_id,
      reporter_id: req.user?.id || '',
      due_date,
      priority: priority || 'medium',
      status: 'todo',
      labels: labels || [],
      subtasks: subtasks || [],
      dependencies: [],
      attachments: [],
      comments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create goal in SUTAR
    await rezWorkspaceHub.createTaskFromGoal({
      title: task.title,
      description: task.description,
      workspace_id: task.workspace_id,
      assignee_id: task.assignee_id,
      due_date: task.due_date,
      priority: task.priority,
    });

    store.tasks.set(task.id, task);

    // Create calendar event for due date
    if (due_date) {
      const calendarEvent: CalendarEvent = {
        id: store.nextId('evt'),
        title: `Due: ${task.title}`,
        type: 'task_due',
        user_id: task.assignee_id || task.reporter_id,
        workspace_id: task.workspace_id,
        start_time: due_date,
        end_time: addHours(parseISO(due_date), 1).toISOString(),
        all_day: true,
        task_id: task.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.calendarEvents.set(calendarEvent.id, calendarEvent);
    }

    await rezWorkspaceHub.trackEvent(req.user?.id || 'unknown', 'task.created', { task_id: task.id });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update task
app.patch('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = store.tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const {
      title,
      description,
      assignee_id,
      due_date,
      priority,
      status,
      labels,
      subtasks,
    } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee_id !== undefined) task.assignee_id = assignee_id;
    if (due_date !== undefined) task.due_date = due_date;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) {
      task.status = status;
      if (status === 'done') {
        task.completed_at = new Date().toISOString();
      }
    }
    if (labels) task.labels = labels;
    if (subtasks) task.subtasks = subtasks;

    task.updated_at = new Date().toISOString();

    // Track progress in SUTAR
    const progress = task.status === 'done' ? 100 :
      task.status === 'review' ? 75 :
      task.status === 'in_progress' ? 50 :
      task.status === 'todo' ? 25 : 0;

    await rezWorkspaceHub.trackTaskProgress(task.id, progress);

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const task = store.tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  task.status = 'cancelled';
  task.updated_at = new Date().toISOString();

  res.json({ success: true, message: 'Task cancelled' });
});

// Add comment to task
app.post('/api/tasks/:id/comments', (req: AuthenticatedRequest, res: Response) => {
  const task = store.tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, error: 'Comment content is required' });
  }

  task.comments.push({
    id: store.nextId('comment'),
    user_id: req.user?.id || '',
    content,
    created_at: new Date().toISOString(),
  });

  task.updated_at = new Date().toISOString();

  res.status(201).json({ success: true, task });
});

// ============================================
// PROJECT ROUTES
// ============================================

// List projects
app.get('/api/projects', (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;

  let projects = Array.from(store.projects.values());

  if (workspaceId) {
    projects = projects.filter(p => p.workspace_id === workspaceId);
  }

  // Add task counts
  const projectsWithStats = projects.map(p => ({
    ...p,
    task_count: Array.from(store.tasks.values()).filter(t => t.project_id === p.id).length,
    completed_tasks: Array.from(store.tasks.values()).filter(t => t.project_id === p.id && t.status === 'done').length,
  }));

  res.json({ success: true, projects: projectsWithStats });
});

// Get project by ID
app.get('/api/projects/:id', (req: Request, res: Response) => {
  const project = store.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  const tasks = Array.from(store.tasks.values()).filter(t => t.project_id === project.id);

  res.json({ success: true, project, tasks });
});

// Create project
app.post('/api/projects', (req: AuthenticatedRequest, res: Response) => {
  const { name, description, workspace_id, members, status, target_date, budget, tags } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Project name is required' });
  }

  const project: Project = {
    id: store.nextId('proj'),
    name,
    description,
    workspace_id: workspace_id || req.workspace?.id || 'ws-1',
    owner_id: req.user?.id || '',
    members: members || [req.user?.id],
    status: status || 'planning',
    target_date,
    budget,
    tags: tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.projects.set(project.id, project);

  res.status(201).json({ success: true, project });
});

// Update project
app.patch('/api/projects/:id', (req: Request, res: Response) => {
  const project = store.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  const { name, description, status, target_date, budget, tags, members } = req.body;

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (status) project.status = status;
  if (target_date) project.target_date = target_date;
  if (budget !== undefined) project.budget = budget;
  if (tags) project.tags = tags;
  if (members) project.members = members;
  project.updated_at = new Date().toISOString();

  res.json({ success: true, project });
});

// ============================================
// CALENDAR ROUTES
// ============================================

// Get calendar events
app.get('/api/calendar', (req: Request, res: Response) => {
  const userId = req.query.user_id as string;
  const workspaceId = req.query.workspace_id as string;
  const startDate = req.query.start as string;
  const endDate = req.query.end as string;

  let events = Array.from(store.calendarEvents.values());

  if (userId) {
    events = events.filter(e => e.user_id === userId);
  }

  if (workspaceId) {
    events = events.filter(e => e.workspace_id === workspaceId);
  }

  if (startDate) {
    events = events.filter(e => !isBefore(parseISO(e.start_time), parseISO(startDate)));
  }

  if (endDate) {
    events = events.filter(e => !isAfter(parseISO(e.start_time), parseISO(endDate)));
  }

  events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  res.json({ success: true, events });
});

// Create calendar event
app.post('/api/calendar', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, type, start_time, end_time, all_day, attendees, location, reminder, color } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ success: false, error: 'Title and start time are required' });
  }

  const event: CalendarEvent = {
    id: store.nextId('evt'),
    title,
    description,
    type: type || 'other',
    user_id: req.user?.id || '',
    workspace_id: req.workspace?.id,
    start_time,
    end_time: end_time || addHours(parseISO(start_time), 1).toISOString(),
    all_day: all_day || false,
    attendees,
    location,
    reminder,
    color,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.calendarEvents.set(event.id, event);

  res.status(201).json({ success: true, event });
});

// ============================================
// USER ROUTES
// ============================================

// Get users
app.get('/api/users', (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;

  let users = Array.from(store.users.values());

  if (workspaceId) {
    const workspace = store.workspaces.get(workspaceId);
    if (workspace) {
      users = users.filter(u => workspace.members.includes(u.id));
    }
  }

  res.json({ success: true, users });
});

// Get user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = store.users.get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user twin from SUTAR
    const twin = await rezWorkspaceHub.getUserTwin(user.id);

    // Get productivity insights
    const insights = await rezWorkspaceHub.getProductivityInsights(user.id);

    // Get user's tasks
    const tasks = Array.from(store.tasks.values()).filter(t => t.assignee_id === user.id);

    // Get user's meetings
    const meetings = Array.from(store.meetings.values())
      .filter(m => m.attendee_ids.includes(user.id) || m.host_id === user.id);

    res.json({ success: true, user, twin, insights, tasks, meetings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update user status
app.patch('/api/users/:id/status', (req: Request, res: Response) => {
  const user = store.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { status } = req.body;
  if (status) {
    user.status = status;
    user.last_seen = new Date().toISOString();
  }

  res.json({ success: true, user });
});

// ============================================
// WEBSOCKET SERVER (Real-time Collaboration)
// ============================================

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  const clientId = store.nextId('ws-client');
  const client: WebSocketClient = {
    id: clientId,
    ws,
    subscribed_to: [],
    last_ping: new Date().toISOString(),
  };

  store.wsClients.set(clientId, client);
  logger.info(`[WS] Client connected: ${clientId}`);

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      client.last_ping = new Date().toISOString();

      switch (message.type) {
        case 'authenticate':
          client.user_id = message.user_id;
          client.workspace_id = message.workspace_id;
          ws.send(JSON.stringify({ type: 'authenticated', client_id: clientId }));
          break;

        case 'subscribe':
          if (message.channel_id) {
            client.subscribed_to.push(message.channel_id);
            client.channel_id = message.channel_id;
            ws.send(JSON.stringify({ type: 'subscribed', channel_id: message.channel_id }));
          }
          break;

        case 'unsubscribe':
          client.subscribed_to = client.subscribed_to.filter(ch => ch !== message.channel_id);
          ws.send(JSON.stringify({ type: 'unsubscribed', channel_id: message.channel_id }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        case 'cursor_update':
          if (client.channel_id) {
            broadcastToChannel(client.channel_id, {
              type: 'cursor_update',
              user_id: client.user_id,
              position: message.position,
            }, clientId);
          }
          break;

        case 'selection_update':
          if (client.channel_id) {
            broadcastToChannel(client.channel_id, {
              type: 'selection_update',
              user_id: client.user_id,
              selection: message.selection,
            }, clientId);
          }
          break;

        case 'document_change':
          handleDocumentChange(client, message);
          break;

        case 'typing_start':
          if (client.channel_id) {
            broadcastToChannel(client.channel_id, {
              type: 'user_typing',
              user_id: client.user_id,
              channel_id: client.channel_id,
            }, clientId);
          }
          break;

        case 'typing_stop':
          if (client.channel_id) {
            broadcastToChannel(client.channel_id, {
              type: 'user_stopped_typing',
              user_id: client.user_id,
              channel_id: client.channel_id,
            }, clientId);
          }
          break;

        case 'presence_update':
          updateUserPresence(client, message.status);
          break;

        case 'call_offer':
        case 'call_answer':
        case 'call ICE_candidate':
          handleSignaling(client, message);
          break;

        default:
          logger.info(`[WS] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('[WS] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    logger.info(`[WS] Client disconnected: ${clientId}`);
    store.wsClients.delete(clientId);

    // Notify others that user is offline
    if (client.channel_id) {
      broadcastToChannel(client.channel_id, {
        type: 'user_offline',
        user_id: client.user_id,
      });
    }
  });

  ws.on('error', (error) => {
    logger.error(`[WS] Client error: ${clientId}`, error);
  });
});

// Broadcast to all clients in a channel
function broadcastToChannel(channelId: string, message: object, excludeClientId?: string) {
  const payload = JSON.stringify(message);

  store.wsClients.forEach((client) => {
    if (client.id !== excludeClientId && client.subscribed_to.includes(channelId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

// Broadcast to all clients in a workspace
function broadcastToWorkspace(workspaceId: string, message: object, excludeClientId?: string) {
  const payload = JSON.stringify(message);

  store.wsClients.forEach((client) => {
    if (client.id !== excludeClientId && client.workspace_id === workspaceId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

// Handle document changes in collaboration
function handleDocumentChange(client: WebSocketClient, message: { document_id: string; change: object }) {
  const { document_id, change } = message;

  // Get or create collaboration session
  let session = store.collaborationSessions.get(document_id);
  if (!session) {
    session = {
      id: document_id,
      document_id,
      type: 'document',
      participants: [client.user_id || ''],
      cursors: new Map(),
      selections: new Map(),
      changes: [],
      started_at: new Date().toISOString(),
    };
    store.collaborationSessions.set(document_id, session);
  }

  // Add participant if not already
  if (!session.participants.includes(client.user_id || '')) {
    session.participants.push(client.user_id || '');
  }

  // Record the change
  const docChange: DocumentChange = {
    id: store.nextId('change'),
    user_id: client.user_id || '',
    type: (change as { type?: string }).type as 'insert' | 'delete' | 'update' | 'format' || 'update',
    position: (change as { position?: { line: number; column: number } }).position || { line: 0, column: 0 },
    content: (change as { content?: string }).content,
    timestamp: new Date().toISOString(),
  };
  session.changes.push(docChange);

  // Broadcast to other participants
  const document = store.documents.get(document_id);
  if (document) {
    const channelId = document.channel_id;
    if (channelId) {
      broadcastToChannel(channelId, {
        type: 'document_change',
        document_id,
        change: docChange,
        user_id: client.user_id,
        participants: session.participants,
      }, client.id);
    }
  }
}

// Update user presence
function updateUserPresence(client: WebSocketClient, status: string) {
  client.subscribed_to.forEach(channelId => {
    broadcastToChannel(channelId, {
      type: 'presence_update',
      user_id: client.user_id,
      status,
      timestamp: new Date().toISOString(),
    });
  });
}

// Handle WebRTC signaling
function handleSignaling(client: WebSocketClient, message: { type: string; target_user_id: string; [key: string]: unknown }) {
  const { target_user_id, ...signalData } = message;

  // Find target user
  let targetClient: WebSocketClient | undefined;
  store.wsClients.forEach(c => {
    if (c.user_id === target_user_id) {
      targetClient = c;
    }
  });

  if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
    targetClient.ws.send(JSON.stringify({
      ...signalData,
      from_user_id: client.user_id,
      type: signalData.type.replace('_signal', ''),
    }));
  }
}

// ============================================
// COLLABORATION API ROUTES
// ============================================

// Get active collaboration sessions
app.get('/api/collaboration/sessions', (req: Request, res: Response) => {
  const documentId = req.query.document_id as string;

  let sessions = Array.from(store.collaborationSessions.values());

  if (documentId) {
    sessions = sessions.filter(s => s.document_id === documentId);
  }

  const sessionData = sessions.map(s => ({
    id: s.id,
    document_id: s.document_id,
    type: s.type,
    participants: s.participants,
    participant_count: s.participants.length,
    started_at: s.started_at,
    change_count: s.changes.length,
  }));

  res.json({ success: true, sessions: sessionData });
});

// Get collaboration session details
app.get('/api/collaboration/sessions/:id', (req: Request, res: Response) => {
  const session = store.collaborationSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      document_id: session.document_id,
      type: session.type,
      participants: session.participants,
      cursors: Array.from(session.cursors.entries()),
      selections: Array.from(session.selections.entries()),
      changes: session.changes,
      started_at: session.started_at,
      ended_at: session.ended_at,
    },
  });
});

// Join collaboration session
app.post('/api/collaboration/sessions/:id/join', (req: AuthenticatedRequest, res: Response) => {
  const session = store.collaborationSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const userId = req.user?.id;
  if (!session.participants.includes(userId || '')) {
    session.participants.push(userId || '');
  }

  // Notify others
  const document = store.documents.get(session.document_id);
  if (document?.channel_id) {
    broadcastToChannel(document.channel_id, {
      type: 'user_joined_session',
      session_id: session.id,
      user_id: userId,
      participants: session.participants,
    });
  }

  res.json({ success: true, session: { participants: session.participants } });
});

// Leave collaboration session
app.post('/api/collaboration/sessions/:id/leave', (req: AuthenticatedRequest, res: Response) => {
  const session = store.collaborationSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const userId = req.user?.id;
  session.participants = session.participants.filter(p => p !== userId);

  // Notify others
  const document = store.documents.get(session.document_id);
  if (document?.channel_id) {
    broadcastToChannel(document.channel_id, {
      type: 'user_left_session',
      session_id: session.id,
      user_id: userId,
      participants: session.participants,
    });
  }

  res.json({ success: true });
});

// End collaboration session
app.post('/api/collaboration/sessions/:id/end', (req: Request, res: Response) => {
  const session = store.collaborationSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  session.ended_at = new Date().toISOString();

  // Notify all participants
  const document = store.documents.get(session.document_id);
  if (document?.channel_id) {
    broadcastToChannel(document.channel_id, {
      type: 'session_ended',
      session_id: session.id,
      ended_at: session.ended_at,
    });
  }

  res.json({ success: true, session: { ended_at: session.ended_at } });
});

// ============================================
// AI ASSISTANT ROUTES
// ============================================

app.post('/api/ai/assistant', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const response = await rezWorkspaceHub.getAIAssistantResponse(req.user?.id || '', message, {
      ...context,
      workspace_id: req.workspace?.id,
      service: 'REZ-Workspace',
    });

    // Store conversation in memory
    await rezWorkspaceHub.storePersonalMemory(req.user?.id || '', `User: ${message}\nAssistant: ${JSON.stringify(response)}`);

    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Daily briefing
app.get('/api/ai/briefing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get user's tasks for today
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());
    const tasks = Array.from(store.tasks.values())
      .filter(t => t.assignee_id === userId && t.due_date && isAfter(parseISO(t.due_date), today) && isBefore(parseISO(t.due_date), tomorrow));

    // Get user's meetings for today
    const meetings = Array.from(store.meetings.values())
      .filter(m => (m.attendee_ids.includes(userId || '') || m.host_id === userId) && isAfter(parseISO(m.start_time), today) && isBefore(parseISO(m.start_time), tomorrow));

    // Get AI briefing
    const briefing = await rezWorkspaceHub.generateDailyBriefing(userId || '', {
      tasks: tasks.length,
      meetings: meetings.length,
      workspace_id: req.workspace?.id,
    });

    res.json({
      success: true,
      briefing,
      summary: {
        tasks_today: tasks.length,
        meetings_today: meetings.length,
        pending_tasks: tasks,
        upcoming_meetings: meetings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// UTILITY ROUTES
// ============================================

// Search across workspace
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const { q, type, workspace_id } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const query = q.toLowerCase();
    const results: Record<string, unknown[]> = {
      messages: [],
      documents: [],
      tasks: [],
      meetings: [],
    };

    // Search messages
    for (const [channelId, messages] of store.messages.entries()) {
      const matchingMessages = messages.filter(m =>
        !m.is_deleted && m.content.toLowerCase().includes(query)
      );
      if (matchingMessages.length > 0) {
        results.messages.push(...matchingMessages.map(m => ({ ...m, channel_id: channelId })));
      }
    }

    // Search documents
    Array.from(store.documents.values())
      .filter(d => !d.is_archived && (
        d.title.toLowerCase().includes(query) ||
        d.content?.toLowerCase().includes(query) ||
        d.tags.some(t => t.toLowerCase().includes(query))
      ))
      .forEach(d => results.documents.push(d));

    // Search tasks
    Array.from(store.tasks.values())
      .filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.labels.some(l => l.toLowerCase().includes(query))
      )
      .forEach(t => results.tasks.push(t));

    // Search meetings
    Array.from(store.meetings.values())
      .filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      )
      .forEach(m => results.meetings.push(m));

    res.json({
      success: true,
      query: q,
      results,
      total: results.messages.length + results.documents.length + results.tasks.length + results.meetings.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workspace statistics
app.get('/api/workspaces/:id/stats', (req: Request, res: Response) => {
  const workspace = store.workspaces.get(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }

  const channels = Array.from(store.channels.values()).filter(c => c.workspace_id === workspace.id);
  const messages = channels.reduce((acc, ch) => acc + (store.messages.get(ch.id)?.length || 0), 0);
  const meetings = Array.from(store.meetings.values()).filter(m => m.workspace_id === workspace.id);
  const documents = Array.from(store.documents.values()).filter(d => d.workspace_id === workspace.id);
  const tasks = Array.from(store.tasks.values()).filter(t => t.workspace_id === workspace.id);
  const projects = Array.from(store.projects.values()).filter(p => p.workspace_id === workspace.id);

  res.json({
    success: true,
    stats: {
      members: workspace.members.length,
      channels: channels.length,
      messages,
      meetings,
      documents,
      tasks,
      projects,
      task_completion_rate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0,
      upcoming_meetings: meetings.filter(m => m.status === 'scheduled').length,
      completed_meetings: meetings.filter(m => m.status === 'completed').length,
    },
  });
});

// ============================================
// START SERVER
// ============================================

httpServer.listen(PORT, () => {
  logger.info(`\n========================================`);
  logger.info(`  REZ WORKSPACE - Work & Productivity`);
  logger.info(`  Port: ${PORT}`);
  logger.info(`========================================`);
  logger.info(`\nRoutes Available:`);
  logger.info(`  Health:       GET  /health`);
  logger.info(`  Metrics:      GET  /health/metrics`);
  logger.info(`\nWorkspace:`);
  logger.info(`  List:         GET  /api/workspaces`);
  logger.info(`  Get:          GET  /api/workspaces/:id`);
  logger.info(`  Create:       POST /api/workspaces`);
  logger.info(`  Update:       PATCH /api/workspaces/:id`);
  logger.info(`  Delete:       DELETE /api/workspaces/:id`);
  logger.info(`  Analytics:    GET  /api/workspaces/:id/analytics`);
  logger.info(`  Stats:        GET  /api/workspaces/:id/stats`);
  logger.info(`\nChannels:`);
  logger.info(`  List:         GET  /api/workspaces/:id/channels`);
  logger.info(`  Create:       POST /api/workspaces/:id/channels`);
  logger.info(`  Messages:     GET  /api/channels/:id/messages`);
  logger.info(`  Send:         POST /api/channels/:id/messages`);
  logger.info(`\nMeetings:`);
  logger.info(`  List:         GET  /api/meetings`);
  logger.info(`  Create:       POST /api/meetings`);
  logger.info(`  Start:        POST /api/meetings/:id/start`);
  logger.info(`  End:          POST /api/meetings/:id/end`);
  logger.info(`  AI Notes:     POST /api/meetings/:id/notes/generate`);
  logger.info(`\nDocuments:`);
  logger.info(`  List:         GET  /api/documents`);
  logger.info(`  Create:       POST /api/documents`);
  logger.info(`  Search:       GET  /api/documents/search`);
  logger.info(`  Analyze:      POST /api/documents/:id/analyze`);
  logger.info(`\nTasks:`);
  logger.info(`  List:         GET  /api/tasks`);
  logger.info(`  Create:       POST /api/tasks`);
  logger.info(`  Update:       PATCH /api/tasks/:id`);
  logger.info(`  Comments:     POST /api/tasks/:id/comments`);
  logger.info(`\nProjects:`);
  logger.info(`  List:         GET  /api/projects`);
  logger.info(`  Create:       POST /api/projects`);
  logger.info(`\nCalendar:`);
  logger.info(`  Events:       GET  /api/calendar`);
  logger.info(`  Create:       POST /api/calendar`);
  logger.info(`\nAI Assistant:`);
  logger.info(`  Chat:         POST /api/ai/assistant`);
  logger.info(`  Briefing:     GET  /api/ai/briefing`);
  logger.info(`\nCollaboration:`);
  logger.info(`  WebSocket:    WS   /ws`);
  logger.info(`  Sessions:    GET  /api/collaboration/sessions`);
  logger.info(`\n========================================\n`);
});

export { app, httpServer, store };
export default app;
