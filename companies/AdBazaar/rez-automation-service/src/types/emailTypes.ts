// Email types for the email service
export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    contentType?: string;
    path?: string;
  }>;
  headers?: Record<string, string>;
  campaignId?: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  };
  templateId?: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId: string;
  error?: string;
  previewUrl?: string;
  response?: string;
}

export interface EmailTrackingData {
  messageId: string;
  campaignId?: string;
  templateId?: string;
  to: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  clickedUrls?: string[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}
