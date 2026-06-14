/**
 * SUPPORT TOOLS HUB API SERVICE
 * Integration with RABTUL Support Tools Hub
 *
 * Service: REZ-support-tools-hub
 * Port: 4057
 * URL: https://REZ-support-tools-hub.onrender.com
 *
 * Features:
 * - Unified ticket management
 * - Multi-channel support (Zendesk, Freshdesk, Intercom)
 * - Knowledge base integration
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export type TicketStatus = 'open' | 'pending' | 'on_hold' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'payment' | 'refund' | 'product' | 'delivery' | 'account' | 'technical' | 'feedback';

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerId: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  type: 'reply' | 'note' | 'system';
  author: { name: string; type: 'customer' | 'agent' | 'bot' };
  body: string;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  views: number;
}

/**
 * Get tickets
 */
export async function getTickets(params?: { status?: TicketStatus; page?: number }): Promise<ApiResponse<{ tickets: Ticket[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/tickets${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('supportToolsApi.getTickets', { error });
    throw error;
  }
}

/**
 * Get ticket by ID
 */
export async function getTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
  try {
    return await apiClient.get(`/tickets/${ticketId}`);
  } catch (error) {
    logger.error('supportToolsApi.getTicket', { ticketId, error });
    throw error;
  }
}

/**
 * Create ticket
 */
export async function createTicket(ticket: { subject: string; description: string; priority?: TicketPriority; category: TicketCategory; customerId: string; customerName: string; customerEmail: string }): Promise<ApiResponse<Ticket>> {
  try {
    return await apiClient.post('/tickets', ticket);
  } catch (error) {
    logger.error('supportToolsApi.createTicket', { subject: ticket.subject, error });
    throw error;
  }
}

/**
 * Update ticket
 */
export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<ApiResponse<Ticket>> {
  try {
    return await apiClient.patch(`/tickets/${ticketId}`, updates);
  } catch (error) {
    logger.error('supportToolsApi.updateTicket', { ticketId, error });
    throw error;
  }
}

/**
 * Close ticket
 */
export async function closeTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
  try {
    return await apiClient.post(`/tickets/${ticketId}/close`, {});
  } catch (error) {
    logger.error('supportToolsApi.closeTicket', { ticketId, error });
    throw error;
  }
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(ticketId: string): Promise<ApiResponse<TicketMessage[]>> {
  try {
    return await apiClient.get(`/tickets/${ticketId}/messages`);
  } catch (error) {
    logger.error('supportToolsApi.getMessages', { ticketId, error });
    throw error;
  }
}

/**
 * Reply to ticket
 */
export async function replyToTicket(ticketId: string, body: string): Promise<ApiResponse<TicketMessage>> {
  try {
    return await apiClient.post(`/tickets/${ticketId}/reply`, { body });
  } catch (error) {
    logger.error('supportToolsApi.replyToTicket', { ticketId, error });
    throw error;
  }
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: string): Promise<ApiResponse<KnowledgeArticle[]>> {
  try {
    return await apiClient.get(`/knowledge/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    logger.error('supportToolsApi.searchKnowledge', { query, error });
    throw error;
  }
}

/**
 * Get knowledge article
 */
export async function getArticle(articleId: string): Promise<ApiResponse<KnowledgeArticle>> {
  try {
    return await apiClient.get(`/knowledge/${articleId}`);
  } catch (error) {
    logger.error('supportToolsApi.getArticle', { articleId, error });
    throw error;
  }
}

export default {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  closeTicket,
  getTicketMessages,
  replyToTicket,
  searchKnowledge,
  getArticle,
};
