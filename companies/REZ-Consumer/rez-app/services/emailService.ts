/**
 * EMAIL SERVICE
 * Integration with REZ-email-service (RABTUL)
 *
 * Service: REZ-email-service
 * Port: 4015
 * URL: https://REZ-email-service.onrender.com
 *
 * Features:
 * - Transactional emails
 * - Marketing emails
 * - Email templates
 * - Unsubscribe management
 * - Email analytics
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type EmailType =
  | 'transactional'
  | 'marketing'
  | 'notification'
  | 'verification'
  | 'welcome'
  | 'reset_password'
  | 'order_confirmation'
  | 'shipping_update'
  | 'delivery_complete'
  | 'review_request'
  | 'promotional';

export interface EmailRecipient {
  email: string;
  name?: string;
  userId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailType;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  metadata?: {
    category?: string;
    tags?: string[];
    lastEdited?: string;
  };
}

export interface EmailData {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  htmlContent?: string;
  textContent?: string;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: {
    email: string;
    name?: string;
  };
  attachments?: Array<{
    filename: string;
    content: string; // base64
    type: string;
    disposition?: 'attachment' | 'inline';
  }>;
  tracking?: {
    open?: boolean;
    click?: boolean;
  };
  scheduledAt?: string; // ISO date for delayed sending
}

export interface EmailDelivery {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
  recipient: string;
  subject: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bounceReason?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailAnalytics {
  period: { start: string; end: string };
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}

export interface UnsubscribePreference {
  email: string;
  userId?: string;
  unsubscribedFrom: EmailType[];
  unsubscribedAt: string;
  reason?: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const EMAIL_SERVICE_URL = process.env.EXPO_PUBLIC_EMAIL_SERVICE_URL || 'https://REZ-email-service.onrender.com';
const EMAIL_API_VERSION = 'v1';
const EMAIL_BASE_URL = `${EMAIL_SERVICE_URL}/api/${EMAIL_API_VERSION}`;

// ============================================================================
// API METHODS - SENDING
// ============================================================================

/**
 * Send a single email
 */
export async function sendEmail(
  emailData: EmailData
): Promise<ApiResponse<EmailDelivery>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/send`, emailData);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to send email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail(
  templateId: string,
  to: EmailRecipient | EmailRecipient[],
  templateData: Record<string, unknown>,
  options?: {
    subject?: string;
    tracking?: EmailData['tracking'];
    scheduledAt?: string;
  }
): Promise<ApiResponse<EmailDelivery>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/send/template`, {
      templateId,
      to,
      templateData,
      subject: options?.subject,
      tracking: options?.tracking,
      scheduledAt: options?.scheduledAt,
    });
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to send templated email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send batch emails
 */
export async function sendBatchEmail(
  emails: EmailData[]
): Promise<ApiResponse<{ sent: number; failed: number; deliveries: EmailDelivery[] }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/send/batch`, { emails });
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to send batch emails:', error);
    return { success: false, error: 'Failed to send batch emails' };
  }
}

// ============================================================================
// API METHODS - TEMPLATES
// ============================================================================

/**
 * Get email templates
 */
export async function getTemplates(
  options?: {
    type?: EmailType;
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<EmailTemplate[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${EMAIL_BASE_URL}/templates?${params}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get templates:', error);
    return { success: false, error: 'Failed to load templates' };
  }
}

/**
 * Get template by ID
 */
export async function getTemplate(
  templateId: string
): Promise<ApiResponse<EmailTemplate>> {
  try {
    const response = await apiClient.get(`${EMAIL_BASE_URL}/templates/${templateId}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get template:', error);
    return { success: false, error: 'Failed to load template' };
  }
}

/**
 * Preview template with data
 */
export async function previewTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<ApiResponse<{
  subject: string;
  htmlContent: string;
  textContent?: string;
}>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/templates/${templateId}/preview`, { data });
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to preview template:', error);
    return { success: false, error: 'Failed to preview template' };
  }
}

// ============================================================================
// API METHODS - DELIVERY & TRACKING
// ============================================================================

/**
 * Get email delivery status
 */
export async function getDeliveryStatus(
  deliveryId: string
): Promise<ApiResponse<EmailDelivery>> {
  try {
    const response = await apiClient.get(`${EMAIL_BASE_URL}/delivery/${deliveryId}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get delivery status:', error);
    return { success: false, error: 'Failed to load delivery status' };
  }
}

/**
 * Get user's email history
 */
export async function getEmailHistory(
  email: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<EmailDelivery[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${EMAIL_BASE_URL}/history/${encodeURIComponent(email)}?${params}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get email history:', error);
    return { success: false, error: 'Failed to load email history' };
  }
}

// ============================================================================
// API METHODS - UNSUBSCRIBE MANAGEMENT
// ============================================================================

/**
 * Get unsubscribe preferences
 */
export async function getUnsubscribePreferences(
  email: string
): Promise<ApiResponse<UnsubscribePreference | null>> {
  try {
    const response = await apiClient.get(`${EMAIL_BASE_URL}/unsubscribe/${encodeURIComponent(email)}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get unsubscribe preferences:', error);
    return { success: false, error: 'Failed to load preferences' };
  }
}

/**
 * Unsubscribe from email type
 */
export async function unsubscribe(
  email: string,
  types: EmailType[],
  reason?: string
): Promise<ApiResponse<{ unsubscribed: boolean }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/unsubscribe`, {
      email,
      types,
      reason,
    });
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to unsubscribe:', error);
    return { success: false, error: 'Failed to unsubscribe' };
  }
}

/**
 * Re-subscribe
 */
export async function resubscribe(
  email: string
): Promise<ApiResponse<{ resubscribed: boolean }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/unsubscribe/resubscribe`, {
      email,
    });
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to resubscribe:', error);
    return { success: false, error: 'Failed to resubscribe' };
  }
}

// ============================================================================
// API METHODS - ANALYTICS
// ============================================================================

/**
 * Get email analytics
 */
export async function getEmailAnalytics(
  period?: { start: string; end: string }
): Promise<ApiResponse<EmailAnalytics>> {
  try {
    const params = period ? `?start=${period.start}&end=${period.end}` : '';
    const response = await apiClient.get(`${EMAIL_BASE_URL}/analytics${params}`);
    return response;
  } catch (error) {
    logger.error('[EmailService] Failed to get analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}

// ============================================================================
// CONVENIENCE METHODS - COMMON EMAIL SCENARIOS
// ============================================================================

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  name: string,
  orderData: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    storeName: string;
    estimatedDelivery?: string;
  }
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail('order_confirmation', { email, name }, orderData, {
    tracking: { open: true, click: true },
  });
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate(
  email: string,
  name: string,
  data: {
    orderId: string;
    status: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail('shipping_update', { email, name }, data, {
    tracking: { open: true },
  });
}

/**
 * Send review request email
 */
export async function sendReviewRequest(
  email: string,
  name: string,
  data: {
    orderId: string;
    storeName: string;
    productNames: string[];
    reviewUrl: string;
  }
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail('review_request', { email, name }, data, {
    tracking: { open: true, click: true },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string,
  name: string,
  resetUrl: string,
  expiresIn = '1 hour'
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail(
    'reset_password',
    { email, name },
    { resetUrl, expiresIn },
    { tracking: { open: true } }
  );
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  data?: {
    referralCode?: string;
    welcomeOffer?: string;
  }
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail('welcome', { email, name }, data || {}, {
    tracking: { open: true },
  });
}

/**
 * Send promotional email
 */
export async function sendPromotionalEmail(
  to: EmailRecipient | EmailRecipient[],
  campaignId: string,
  campaignData: Record<string, unknown>
): Promise<ApiResponse<EmailDelivery>> {
  return sendTemplatedEmail(campaignId, to, campaignData, {
    tracking: { open: true, click: true },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const emailService = {
  // Sending
  sendEmail,
  sendTemplatedEmail,
  sendBatchEmail,

  // Templates
  getTemplates,
  getTemplate,
  previewTemplate,

  // Delivery
  getDeliveryStatus,
  getEmailHistory,

  // Unsubscribe
  getUnsubscribePreferences,
  unsubscribe,
  resubscribe,

  // Analytics
  getEmailAnalytics,

  // Convenience methods
  sendOrderConfirmation,
  sendShippingUpdate,
  sendReviewRequest,
  sendPasswordReset,
  sendWelcomeEmail,
  sendPromotionalEmail,
};

export default emailService;
