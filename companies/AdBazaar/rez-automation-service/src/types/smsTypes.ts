// SMS types for the SMS service
export interface SMSSendOptions {
  to: string;
  content: string;
  from?: string;
  campaignId?: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  };
  templateId?: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
  statusCallback?: string;
}

export interface SMSDeliveryResult {
  success: boolean;
  messageSid: string;
  status?: string;
  segmentCount?: number;
  error?: string;
  response?: unknown;
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SMSStatusCallback {
  MessageSid: string;
  MessageStatus: 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed';
  To: string;
  From: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  DateCreated?: string;
  DateSent?: string;
}
