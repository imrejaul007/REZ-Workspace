/**
 * WhatsApp Campaign Type Definitions
 */

export type TemplateType = 'promotional' | 'transactional' | 'reengagement' | 'welcome';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
export type AudienceType = 'all_customers' | 'segment' | 'custom';
export type SchedulingType = 'immediate' | 'scheduled' | 'automated';

export interface TemplateButton {
  text: string;
  action: string;
}

export interface CampaignTemplate {
  type: TemplateType;
  header?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  mediaUrl?: string;
}

export interface AudienceFilters {
  lastPurchaseDays?: number;
  cartAbandoners?: boolean;
  minOrderValue?: number;
  lastVisitDays?: number;
  tags?: string[];
}

export interface CampaignAudience {
  type: AudienceType;
  segmentId?: string;
  userIds?: string[];
  filters?: AudienceFilters;
}

export interface CampaignScheduling {
  type: SchedulingType;
  scheduledTime?: Date;
  optimalTimeEnabled: boolean;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  responded: number;
  optOut: number;
  failed: number;
}

export interface WhatsAppCampaign {
  campaignId: string;
  merchantId: string;
  name: string;
  template: CampaignTemplate;
  audience: CampaignAudience;
  scheduling: CampaignScheduling;
  metrics: CampaignMetrics;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
}

export interface CampaignMessage {
  messageId: string;
  campaignId: string;
  userId: string;
  phoneNumber: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'opt_out';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  createdAt: Date;
}

// API Request/Response types
export interface CreateCampaignRequest {
  name: string;
  merchantId: string;
  template: CampaignTemplate;
  audience: CampaignAudience;
  scheduling: CampaignScheduling;
}

export interface UpdateCampaignRequest {
  name?: string;
  template?: CampaignTemplate;
  audience?: CampaignAudience;
  scheduling?: CampaignScheduling;
}

export interface CampaignListQuery {
  merchantId?: string;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CampaignStatsResponse {
  campaignId: string;
  metrics: CampaignMetrics;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  optOutRate: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  merchantId: string;
  role: 'admin' | 'merchant' | 'user';
  iat?: number;
  exp?: number;
}

// WhatsApp API types
export interface WhatsAppSendRequest {
  to: string;
  template: CampaignTemplate;
}

export interface WhatsAppSendResponse {
  messagingProduct: string;
  contacts: { input: string; waId: string }[];
  messages: { id: string }[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: { wa_id: string; profile: { name: string } }[];
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          button?: { text: string; payload: string };
        }[];
        statuses?: {
          id: string;
          recipient_id: string;
          status: string;
          timestamp: string;
          conversation?: { id: string; origin: { type: string } };
          pricing?: { billable: boolean; category: string; pricing_model: string };
        }[];
      };
      field: string;
    }[];
  }[];
}