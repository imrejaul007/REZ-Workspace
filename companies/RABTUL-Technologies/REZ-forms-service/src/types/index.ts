/**
 * REZ Forms - Type Definitions
 * AI-Powered Form Builder (Tally Competitor)
 */

// Field Types (matching Tally's field types)
export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'number'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'url'
  | 'file_upload'
  | 'multiple_choice'
  | 'dropdown'
  | 'checkbox'
  | 'yes_no'
  | 'rating'
  | 'scale'
  | 'signature'
  | 'payment'
  | 'calculation'
  | 'hidden';

// Field Definition
export interface FormField {
  id: string;
  type: FieldType;
  question: string;
  description?: string;
  required: boolean;
  placeholder?: string;

  // Options (for choice fields)
  options?: string[];

  // Validation
  min?: number;
  max?: number;
  pattern?: string;

  // Conditional Logic
  conditions?: FieldCondition[];

  // Appearance
  emoji?: boolean;
  randomize?: boolean;

  // Calculation
  calculationExpression?: string;

  // File upload
  allowedFileTypes?: string[];
  maxFileSize?: number; // in MB
}

// Conditional Logic
export interface FieldCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'require';
}

// Form Layout (like Tally's blocks)
export type BlockType = 'field' | 'heading' | 'paragraph' | 'divider' | 'spacer' | 'column_start' | 'column_end';

export interface FormBlock {
  id: string;
  type: BlockType;
  fieldId?: string; // Links to FormField if type is 'field'
  content?: string; // For heading, paragraph
  columns?: number; // For columns layout
}

// Main Form Structure
export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;

  // Owner
  userId: string;
  workspaceId?: string;

  // Content
  blocks: FormBlock[];
  fields: FormField[];

  // Settings
  settings: FormSettings;

  // Branding
  branding: FormBranding;

  // QR
  qrEnabled: boolean;
  qrSettings?: QRConfig;

  // Workflows
  workflows: WorkflowTrigger[];

  // Stats
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  submissionCount: number;

  // AI
  aiGenerated: boolean;
  aiPrompt?: string;
}

export interface FormSettings {
  // Submission
  allowAnonymous: boolean;
  oneSubmissionPerUser: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;

  // Notifications
  notifyOnSubmission: boolean;
  notificationEmails: string[];
  confirmationMessage: string;

  // Scheduling
  scheduleStart?: Date;
  scheduleEnd?: Date;

  // Limits
  maxSubmissions?: number;
  closedMessage?: string;

  // Privacy
  requireCorpID: boolean;
  storeResponses: boolean;
}

export interface FormBranding {
  logo?: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
  hidePoweredBy: boolean;
}

export interface QRConfig {
  size: number;
  color: string;
  logo?: string;
  offlineMode: boolean;
}

// Form Submission
export interface Submission {
  id: string;
  formId: string;
  userId?: string;
  answers: Answer[];

  // Meta
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;

  // Calculated fields
  calculatedValues?: Record<string, number>;

  // Workflow status
  workflowTriggered: boolean;
  workflowResults?: WorkflowResult[];

  // Analytics
  completionTime?: number; // in seconds
}

export interface Answer {
  fieldId: string;
  value: string | string[] | number | boolean | FileUpload | null;
  type: FieldType;
}

export interface FileUpload {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
}

// Workflow Triggers
export interface WorkflowTrigger {
  id: string;
  name: string;
  enabled: boolean;
  type: WorkflowTriggerType;
  config: WorkflowConfig;
}

export type WorkflowTriggerType =
  | 'on_submission'
  | 'on_condition'
  | 'on_schedule'
  | 'on_payment';

export interface WorkflowConfig {
  // Conditions
  conditions?: WorkflowCondition[];

  // Actions
  actions: WorkflowAction[];

  // Integration
  integrationType?: 'lead' | 'crm' | 'notification' | 'webhook' | 'ai_agent' | 'safe_qr';
}

export interface WorkflowCondition {
  fieldId: string;
  operator: string;
  value: any;
}

export interface WorkflowAction {
  type: 'create_lead' | 'add_to_list' | 'send_email' | 'send_sms' | 'send_webhook' | 'trigger_genie' | 'create_safe_qr' | 'add_to_crm';
  config: Record<string, any>;
}

export interface WorkflowResult {
  triggerId: string;
  status: 'success' | 'failed' | 'pending';
  result?: any;
  error?: string;
  executedAt: Date;
}

// AI Form Generation
export interface AIGeneratedForm {
  blocks: FormBlock[];
  fields: FormField[];
  suggestedSettings: Partial<FormSettings>;
  suggestedWorkflows: Partial<WorkflowTrigger>[];
}

// Webhooks
export interface Webhook {
  id: string;
  formId: string;
  url: string;
  events: ('submission' | 'start' | 'end')[];
  secret: string;
  enabled: boolean;
}

// API Response Types
export interface FormListResponse {
  forms: Form[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubmissionListResponse {
  submissions: Submission[];
  total: number;
  page: number;
  pageSize: number;
}