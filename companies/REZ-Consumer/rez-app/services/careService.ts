/**
 * CARE SERVICE
 * Integration with REZ-care-service (REZ-Intelligence)
 *
 * Service: REZ-care-service
 * Port: 4055
 * URL: https://REZ-care-service.onrender.com
 *
 * Features:
 * - Customer 360 View
 * - CSAT + Sentiment Analysis
 * - Proactive Issue Detection
 * - Self-Service Recovery
 * - Auto-Ticket Generation
 * - WhatsApp Support
 * - AI Agent Summary
 * - Real-time WebSocket updates
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

// Customer 360
export interface Customer360 {
  customerId: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    tier: 'basic' | 'silver' | 'gold' | 'platinum';
    memberSince: string;
    lastActive: string;
  };
  summary: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lifetimeValue: number;
    churnRisk: 'low' | 'medium' | 'high' | 'critical';
    npsScore: number;
    lastOrderDate: string;
    lastReviewDate?: string;
  };
  interactions: {
    totalTickets: number;
    openTickets: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    lastInteraction: string;
  };
  engagement: {
    appFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
    pushOptIn: boolean;
    emailOptIn: boolean;
    whatsappOptIn: boolean;
    referralCount: number;
  };
}

// CSAT & Sentiment
export interface CSATResponse {
  customerId: string;
  ticketId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  submittedAt: string;
}

export interface SentimentAnalysis {
  customerId: string;
  overallScore: number; // -100 to 100
  trend: 'improving' | 'stable' | 'declining';
  emotions: {
    angry: number;
    frustrated: number;
    neutral: number;
    satisfied: number;
    delighted: number;
  };
  keyPhrases: string[];
  riskIndicators: string[];
}

// Self-Service
export interface SelfServiceAction {
  actionId: string;
  type: 'refund' | 'cancel' | 'reorder' | 'track' | 'update' | 'support';
  title: string;
  description: string;
  eligibility: 'eligible' | 'pending' | 'not_eligible';
  estimatedTime?: string;
  icon?: string;
  deepLink?: string;
}

export interface SelfServiceExecution {
  actionId: string;
  customerId: string;
  parameters?: Record<string, unknown>;
  executedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    message: string;
    nextSteps?: string[];
    referenceId?: string;
  };
  error?: {
    code: string;
    message: string;
    recoveryOptions?: string[];
  };
}

// Tickets
export interface Ticket {
  id: string;
  customerId: string;
  type: 'support' | 'complaint' | 'billing' | 'technical' | 'feedback';
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags: string[];
  conversation: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'bot';
  senderName: string;
  content: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
  createdAt: string;
}

// Proactive Alerts
export interface ProactiveAlert {
  id: string;
  customerId: string;
  type: 'delivery_delay' | 'payment_issue' | 'refund_pending' | 'expiring_offer' | 'low_stock' | 'price_change';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  actionTaken?: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  createdAt: string;
  expiresAt?: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const CARE_SERVICE_URL = process.env.EXPO_PUBLIC_CARE_SERVICE_URL || 'https://REZ-care-service.onrender.com';
const CARE_API_VERSION = 'v1';
const CARE_BASE_URL = `${CARE_SERVICE_URL}/api/${CARE_API_VERSION}`;

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get complete Customer 360 view
 * Aggregates data from all services for support agents
 */
export async function getCustomer360(customerId: string): Promise<ApiResponse<Customer360>> {
  try {
    const response = await apiClient.get(`${CARE_BASE_URL}/customer/${customerId}/360`);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to get customer 360:', error);
    return { success: false, error: 'Failed to load customer profile' };
  }
}

/**
 * Submit CSAT response after ticket resolution
 */
export async function submitCSAT(response: CSATResponse): Promise<ApiResponse<{ submitted: boolean }>> {
  try {
    const result = await apiClient.post(`${CARE_BASE_URL}/csat/respond`, response);
    return result;
  } catch (error) {
    logger.error('[CareService] Failed to submit CSAT:', error);
    return { success: false, error: 'Failed to submit rating' };
  }
}

/**
 * Analyze sentiment from text or feedback
 */
export async function analyzeSentiment(
  customerId: string,
  text: string
): Promise<ApiResponse<SentimentAnalysis>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/sentiment/analyze`, {
      customerId,
      text,
    });
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to analyze sentiment:', error);
    return { success: false, error: 'Failed to analyze feedback' };
  }
}

/**
 * Get available self-service actions for a customer
 */
export async function getSelfServiceActions(
  customerId: string
): Promise<ApiResponse<SelfServiceAction[]>> {
  try {
    const response = await apiClient.get(`${CARE_BASE_URL}/self-service/${customerId}/actions`);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to get self-service actions:', error);
    return { success: false, error: 'Failed to load support options' };
  }
}

/**
 * Execute a self-service action
 */
export async function executeSelfService(
  execution: SelfServiceExecution
): Promise<ApiResponse<SelfServiceExecution>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/self-service/execute`, execution);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to execute self-service:', error);
    return { success: false, error: 'Failed to process request' };
  }
}

/**
 * Quick retry failed payment via self-service
 */
export async function selfServiceCashbackRetry(
  customerId: string,
  transactionId: string
): Promise<ApiResponse<{ initiated: boolean; estimatedTime: string }>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/self-service/cashback-retry`, {
      customerId,
      transactionId,
    });
    return response;
  } catch (error) {
    logger.error('[CareService] Cashback retry failed:', error);
    return { success: false, error: 'Failed to initiate refund' };
  }
}

/**
 * Sync wallet for self-service recovery
 */
export async function selfServiceWalletSync(
  customerId: string
): Promise<ApiResponse<{ synced: boolean; balance?: number }>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/self-service/wallet-sync`, {
      customerId,
    });
    return response;
  } catch (error) {
    logger.error('[CareService] Wallet sync failed:', error);
    return { success: false, error: 'Failed to sync wallet' };
  }
}

/**
 * Get proactive alerts for a customer
 */
export async function getProactiveAlerts(
  customerId: string
): Promise<ApiResponse<ProactiveAlert[]>> {
  try {
    const response = await apiClient.get(`${CARE_BASE_URL}/alerts/${customerId}`);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to get alerts:', error);
    return { success: false, error: 'Failed to load alerts' };
  }
}

/**
 * Create a new support ticket
 */
export async function createTicket(
  ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'conversation'>
): Promise<ApiResponse<Ticket>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/tickets`, ticket);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to create ticket:', error);
    return { success: false, error: 'Failed to create support ticket' };
  }
}

/**
 * Add message to existing ticket
 */
export async function addTicketMessage(
  ticketId: string,
  message: Omit<TicketMessage, 'id' | 'createdAt'>
): Promise<ApiResponse<TicketMessage>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/tickets/${ticketId}/messages`, message);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to add message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Send WhatsApp message via support
 */
export async function sendWhatsAppMessage(
  customerId: string,
  message: string
): Promise<ApiResponse<{ sent: boolean; messageId: string }>> {
  try {
    const response = await apiClient.post(`${CARE_BASE_URL}/whatsapp/send`, {
      customerId,
      message,
    });
    return response;
  } catch (error) {
    logger.error('[CareService] WhatsApp send failed:', error);
    return { success: false, error: 'Failed to send WhatsApp message' };
  }
}

/**
 * Get AI summary for support agent
 */
export async function getAgentSummary(
  customerId: string
): Promise<ApiResponse<{
  summary: string;
  recentHistory: string[];
  suggestedResponses: string[];
  escalationRecommended: boolean;
}>> {
  try {
    const response = await apiClient.get(`${CARE_BASE_URL}/agent/summary/${customerId}`);
    return response;
  } catch (error) {
    logger.error('[CareService] Failed to get agent summary:', error);
    return { success: false, error: 'Failed to load agent summary' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if customer needs immediate attention
 */
export function needsAttention(customer360: Customer360): boolean {
  return (
    customer360.summary.churnRisk === 'critical' ||
    customer360.interactions.openTickets > 0 ||
    customer360.summary.npsScore < 4
  );
}

/**
 * Get customer health score (0-100)
 */
export function getHealthScore(customer360: Customer360): number {
  const churnPenalty = {
    low: 0,
    medium: 20,
    high: 40,
    critical: 60,
  }[customer360.summary.churnRisk];

  const ticketPenalty = Math.min(20, customer360.interactions.openTickets * 5);

  const npsContribution = (customer360.summary.npsScore / 10) * 10;

  const engagementBonus = {
    daily: 20,
    weekly: 15,
    monthly: 10,
    rarely: 0,
  }[customer360.engagement.appFrequency];

  return Math.max(0, Math.min(100, 100 - churnPenalty - ticketPenalty + npsContribution + engagementBonus));
}

/**
 * Get recommended next action based on customer state
 */
export function getRecommendedAction(customer360: Customer360): string | null {
  if (customer360.summary.churnRisk === 'critical') {
    return 'offer_loyalty_discount';
  }
  if (customer360.interactions.openTickets > 0) {
    return 'resolve_open_tickets';
  }
  if (customer360.summary.npsScore < 5) {
    return 'request_feedback';
  }
  if (customer360.engagement.appFrequency === 'rarely') {
    return 'send_reengagement_offer';
  }
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const careService = {
  // Customer
  getCustomer360,
  getHealthScore,
  needsAttention,
  getRecommendedAction,

  // CSAT & Sentiment
  submitCSAT,
  analyzeSentiment,

  // Self-Service
  getSelfServiceActions,
  executeSelfService,
  selfServiceCashbackRetry,
  selfServiceWalletSync,

  // Proactive
  getProactiveAlerts,

  // Tickets
  createTicket,
  addTicketMessage,

  // WhatsApp
  sendWhatsAppMessage,

  // Agent
  getAgentSummary,
};

export default careService;
