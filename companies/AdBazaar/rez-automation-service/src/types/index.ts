// Automation Types for SMS/Email Service

export type ChannelType = 'email' | 'sms';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';

export type ABTestStatus = 'running' | 'completed' | 'cancelled';

export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';

export type TriggerType =
  | 'immediate'
  | 'scheduled'
  | 'time_delay'
  | 'event_based'
  | 'drip_day';

export interface ContactInfo {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  variantId: string;
  name: string;
  templateId: string;
  subject?: string; // For email
  content: string;
  sendPercentage: number;
  sentCount: number;
  deliveredCount: number;
  openedCount?: number; // For email
  clickedCount?: number; // For email
}

export interface ABTest {
  id: string;
  name: string;
  campaignId: string;
  channel: ChannelType;
  variants: ABTestVariant[];
  status: ABTestStatus;
  startDate: Date;
  endDate?: Date;
  winningVariantId?: string;
  metrics?: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceStep {
  stepId: string;
  order: number;
  channel: ChannelType;
  templateId: string;
  delayMinutes: number; // Delay from previous step (0 for first step, or use scheduledTime)
  delayDays?: number;
  delayHours?: number;
  triggerType: TriggerType;
  scheduledTime?: string; // HH:mm format for time-based triggers
  condition?: SequenceCondition;
}

export interface SequenceCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  trigger: {
    type: TriggerType;
    eventName?: string;
    timeDelay?: number;
  };
  status: 'active' | 'paused' | 'completed' | 'archived';
  totalContacts: number;
  completedContacts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  channel: ChannelType;
  templateId: string;
  subject?: string; // For email
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount?: number; // For email
  clickedCount?: number; // For email
  respondedCount: number;
  failedCount: number;
  abTest?: ABTest;
  createdAt: Date;
  updatedAt: Date;
}

export interface DripCampaign extends Omit<Campaign, 'channel'> {
  channel: ChannelType;
  sequences: Sequence[];
  enrollmentCriteria?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  };
  exitCriteria?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  };
  reEnrollmentEnabled: boolean;
  reEnrollmentDelayDays?: number;
}

export interface DeliveryRecord {
  id: string;
  campaignId?: string;
  sequenceId?: string;
  stepId?: string;
  contact: ContactInfo;
  channel: ChannelType;
  templateId: string;
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date; // For email
  clickedAt?: Date; // For email
  failedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnsubscribeRecord {
  id: string;
  contact: ContactInfo;
  channel: ChannelType;
  reason?: string;
  source: 'link_click' | 'reply' | 'manual' | 'bounce';
  campaignId?: string;
  unsubscribedAt: Date;
}

export interface AutomationEvent {
  id: string;
  type: string;
  contact: ContactInfo;
  payload?: Record<string, unknown>;
  triggeredAt: Date;
  processed: boolean;
  processedAt?: Date;
}

export interface QueuedMessage {
  id: string;
  contact: ContactInfo;
  channel: ChannelType;
  templateId: string;
  subject?: string;
  content: string;
  variables?: TemplateVariables;
  scheduledFor?: Date;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
}

// API Request/Response Types
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  channel: ChannelType;
  templateId: string;
  subject?: string;
  scheduledAt?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  scheduledAt?: string;
}

export interface CreateSequenceRequest {
  name: string;
  description?: string;
  steps: Omit<SequenceStep, 'stepId'>[];
  trigger: Sequence['trigger'];
}

export interface CreateTemplateRequest {
  name: string;
  channel: ChannelType;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  content?: string;
  variables?: string[];
}

export interface SendMessageRequest {
  contact: ContactInfo;
  channel: ChannelType;
  templateId: string;
  subject?: string;
  content?: string;
  variables?: TemplateVariables;
  scheduledFor?: string;
}

export interface CreateABTestRequest {
  name: string;
  campaignId: string;
  channel: ChannelType;
  variants: Omit<ABTestVariant, 'sentCount' | 'deliveredCount' | 'openedCount' | 'clickedCount'>[];
}

export interface UnsubscribeRequest {
  email?: string;
  phone?: string;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CampaignStats {
  total: number;
  byStatus: Record<CampaignStatus, number>;
  byChannel: Record<ChannelType, number>;
}

export interface DeliveryStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  openRate?: number;
  clickRate?: number;
  unsubscribeRate: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
