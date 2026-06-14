/**
 * LEAD INTELLIGENCE API SERVICE
 * Integration with REZ Lead Intelligence
 *
 * Service: REZ-lead-intelligence
 * URL: https://REZ-lead-intelligence.onrender.com
 *
 * Features:
 * - Lead scoring
 * - Lead qualification
 * - Lead routing
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface Lead {
  id: string;
  email: string;
  name: string;
  phone?: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost';
  source: string;
  createdAt: string;
}

export interface LeadScore {
  leadId: string;
  score: number;
  grade: Lead['grade'];
  factors: Array<{ factor: string; score: number }>;
}

/**
 * Get leads
 */
export async function getLeads(params?: { status?: Lead['status']; grade?: Lead['grade']; page?: number }): Promise<ApiResponse<{ leads: Lead[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.grade) query.set('grade', params.grade);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/leads${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('leadIntelligenceApi.getLeads', { error });
    throw error;
  }
}

/**
 * Get lead by ID
 */
export async function getLead(leadId: string): Promise<ApiResponse<Lead>> {
  try {
    return await apiClient.get(`/leads/${leadId}`);
  } catch (error) {
    logger.error('leadIntelligenceApi.getLead', { leadId, error });
    throw error;
  }
}

/**
 * Get lead score
 */
export async function getLeadScore(leadId: string): Promise<ApiResponse<LeadScore>> {
  try {
    return await apiClient.get(`/leads/${leadId}/score`);
  } catch (error) {
    logger.error('leadIntelligenceApi.getScore', { leadId, error });
    throw error;
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(leadId: string, status: Lead['status']): Promise<ApiResponse<Lead>> {
  try {
    return await apiClient.patch(`/leads/${leadId}`, { status });
  } catch (error) {
    logger.error('leadIntelligenceApi.updateStatus', { leadId, status, error });
    throw error;
  }
}

/**
 * Convert lead
 */
export async function convertLead(leadId: string): Promise<ApiResponse<{ success: boolean; customerId: string }>> {
  try {
    return await apiClient.post(`/leads/${leadId}/convert`, {});
  } catch (error) {
    logger.error('leadIntelligenceApi.convert', { leadId, error });
    throw error;
  }
}

export default {
  getLeads,
  getLead,
  getLeadScore,
  updateLeadStatus,
  convertLead,
};
