// Notification Types
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';

export type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'bounced'
  | 'unsubscribed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationRecipient {
  userId?: string;
  email?: string;
  phone?: string;
  deviceToken?: string;
  channels: NotificationChannel[];
}

export interface NotificationPayload {
  templateId: string;
  recipient: NotificationRecipient;
  variables: Record<string, string>;
  priority?: NotificationPriority;
  scheduledAt?: Date | string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  templateId: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  variables: Record<string, string>;
  renderedContent: string;
  metadata: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Template Types
export interface TemplateVariable {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date';
  defaultValue?: string;
}

export interface TemplateContent {
  subject?: string;
  body: string;
  htmlBody?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  category: string;
  content: TemplateContent;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Preferences Types
export interface ChannelPreference {
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyNotifications?: number;
}

export interface NotificationPreferences {
  userId: string;
  email: ChannelPreference;
  sms: ChannelPreference;
  whatsapp: ChannelPreference;
  push: ChannelPreference;
  marketingEnabled: boolean;
  transactionEnabled: boolean;
  securityEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryPreferences {
  [category: string]: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
}

// Opt-out Types
export interface OptOutRecord {
  id: string;
  userId: string;
  channel: NotificationChannel;
  reason?: string;
  optedOutAt: Date;
  source: 'user_request' | 'bounce' | 'complaint' | 'system';
}

export interface GlobalOptOut {
  userId: string;
  email?: string;
  phone?: string;
  optedOutAt: Date;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Batch Notification Types
export interface BatchNotificationPayload {
  notifications: NotificationPayload[];
  options?: {
    parallel?: boolean;
    stopOnError?: boolean;
  };
}

export interface BatchNotificationResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    recipient: NotificationRecipient;
    notificationId?: string;
    success: boolean;
    error?: string;
  }>;
}

// Analytics Types
export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  byChannel: Record<NotificationChannel, ChannelAnalytics>;
}

export interface ChannelAnalytics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  bounceRate: number;
}

// Adapter Types
export interface INotificationAdapter {
  send(notification: Notification): Promise<SendResult>;
  sendBatch(notifications: Notification[]): Promise<SendResult[]>;
  getStatus(notificationId: string): Promise<NotificationStatus>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// Webhook Types
export interface WebhookPayload {
  event: string;
  channel: NotificationChannel;
  notificationId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}
