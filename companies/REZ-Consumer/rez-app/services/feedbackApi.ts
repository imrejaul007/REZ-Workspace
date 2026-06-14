/**
 * FEEDBACK COLLECTOR API SERVICE
 * Integration with REZ Feedback Collector
 *
 * Service: REZ-feedback-collector
 * URL: https://REZ-feedback-collector.onrender.com
 *
 * Features:
 * - User feedback collection
 * - Ratings & reviews
 * - NPS surveys
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface Feedback {
  id: string;
  type: 'rating' | 'review' | 'nps' | 'suggestion';
  rating?: number;
  comment?: string;
  npsScore?: number;
  entityType?: string;
  entityId?: string;
  status: 'pending' | 'reviewed' | 'actioned';
  createdAt: string;
}

/**
 * Submit feedback
 */
export async function submitFeedback(feedback: {
  type: Feedback['type'];
  rating?: number;
  comment?: string;
  npsScore?: number;
  entityType?: string;
  entityId?: string;
}): Promise<ApiResponse<Feedback>> {
  try {
    return await apiClient.post('/feedback', feedback);
  } catch (error) {
    logger.error('feedbackApi.submit', { error });
    throw error;
  }
}

/**
 * Get feedback history
 */
export async function getFeedbackHistory(params?: { type?: Feedback['type']; page?: number }): Promise<ApiResponse<{ feedback: Feedback[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/feedback${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('feedbackApi.getHistory', { error });
    throw error;
  }
}

/**
 * Get NPS surveys
 */
export async function getNPSSurveys(): Promise<ApiResponse<Array<{ id: string; title: string; npsScore: number; createdAt: string }>>> {
  try {
    return await apiClient.get('/feedback/nps');
  } catch (error) {
    logger.error('feedbackApi.getNPS', { error });
    throw error;
  }
}

/**
 * Submit NPS response
 */
export async function submitNPS(surveyId: string, score: number, comment?: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/feedback/nps/${surveyId}`, { score, comment });
  } catch (error) {
    logger.error('feedbackApi.submitNPS', { surveyId, error });
    throw error;
  }
}

export default {
  submitFeedback,
  getFeedbackHistory,
  getNPSSurveys,
  submitNPS,
};
