/**
 * CRM HUB API SERVICE
 * Integration with RABTUL CRM Hub Service
 *
 * Service: REZ-crm-hub
 * Port: 4056
 * URL: https://REZ-crm-hub.onrender.com
 *
 * Features:
 * - HubSpot integration
 * - Zoho CRM integration
 * - Contact management
 * - Deal tracking
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export type ContactStatus = 'lead' | 'qualified' | 'customer' | 'churned';
export type DealStage = 'inquiry' | 'negotiation' | 'won' | 'lost';
export type CRMProvider = 'hubspot' | 'zoho';

export interface Contact {
  id: string;
  crmId: string;
  provider: CRMProvider;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: ContactStatus;
}

export interface Deal {
  id: string;
  title: string;
  stage: DealStage;
  amount: number;
  contactId: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  createdAt: string;
}

/**
 * Get contacts
 */
export async function getContacts(params?: { status?: ContactStatus; page?: number }): Promise<ApiResponse<{ contacts: Contact[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/contacts${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('crmApi.getContacts', { error });
    throw error;
  }
}

/**
 * Get contact by ID
 */
export async function getContact(contactId: string): Promise<ApiResponse<Contact>> {
  try {
    return await apiClient.get(`/contacts/${contactId}`);
  } catch (error) {
    logger.error('crmApi.getContact', { contactId, error });
    throw error;
  }
}

/**
 * Create contact
 */
export async function createContact(contact: { email: string; firstName: string; lastName: string; phone?: string }): Promise<ApiResponse<Contact>> {
  try {
    return await apiClient.post('/contacts', contact);
  } catch (error) {
    logger.error('crmApi.createContact', { email: contact.email, error });
    throw error;
  }
}

/**
 * Update contact
 */
export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<ApiResponse<Contact>> {
  try {
    return await apiClient.patch(`/contacts/${contactId}`, updates);
  } catch (error) {
    logger.error('crmApi.updateContact', { contactId, error });
    throw error;
  }
}

/**
 * Get deals
 */
export async function getDeals(params?: { stage?: DealStage; page?: number }): Promise<ApiResponse<{ deals: Deal[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.stage) query.set('stage', params.stage);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/deals${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('crmApi.getDeals', { error });
    throw error;
  }
}

/**
 * Create deal
 */
export async function createDeal(deal: { title: string; amount: number; contactId: string; stage?: DealStage }): Promise<ApiResponse<Deal>> {
  try {
    return await apiClient.post('/deals', deal);
  } catch (error) {
    logger.error('crmApi.createDeal', { title: deal.title, error });
    throw error;
  }
}

/**
 * Update deal stage
 */
export async function updateDealStage(dealId: string, stage: DealStage): Promise<ApiResponse<Deal>> {
  try {
    return await apiClient.patch(`/deals/${dealId}/stage`, { stage });
  } catch (error) {
    logger.error('crmApi.updateDealStage', { dealId, stage, error });
    throw error;
  }
}

/**
 * Get contact activities
 */
export async function getContactActivities(contactId: string): Promise<ApiResponse<Activity[]>> {
  try {
    return await apiClient.get(`/contacts/${contactId}/activities`);
  } catch (error) {
    logger.error('crmApi.getActivities', { contactId, error });
    throw error;
  }
}

/**
 * Log activity
 */
export async function logActivity(activity: { contactId: string; type: Activity['type']; title: string; description?: string }): Promise<ApiResponse<Activity>> {
  try {
    return await apiClient.post('/activities', activity);
  } catch (error) {
    logger.error('crmApi.logActivity', { contactId: activity.contactId, error });
    throw error;
  }
}

export default {
  getContacts,
  getContact,
  createContact,
  updateContact,
  getDeals,
  createDeal,
  updateDealStage,
  getContactActivities,
  logActivity,
};
