/**
 * CAPITAL SERVICE API SERVICE
 * Integration with REZ Capital Service
 *
 * Service: REZ-capital-service
 * URL: https://REZ-capital-service.onrender.com
 *
 * Features:
 * - Restaurant lending
 * - Business loans
 * - Credit assessment
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface LoanApplication {
  id: string;
  amount: number;
  purpose: string;
  tenure: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  interestRate?: number;
  emi?: number;
  createdAt: string;
}

export interface CreditScore {
  userId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  limit?: number;
  utilization?: number;
}

/**
 * Get credit score
 */
export async function getCreditScore(): Promise<ApiResponse<CreditScore>> {
  try {
    return await apiClient.get('/capital/credit-score');
  } catch (error) {
    logger.error('capitalApi.getCreditScore', { error });
    throw error;
  }
}

/**
 * Apply for loan
 */
export async function applyForLoan(application: {
  amount: number;
  purpose: string;
  tenure: number;
  businessId: string;
}): Promise<ApiResponse<LoanApplication>> {
  try {
    return await apiClient.post('/capital/loans/apply', application);
  } catch (error) {
    logger.error('capitalApi.apply', { error });
    throw error;
  }
}

/**
 * Get loan applications
 */
export async function getLoanApplications(): Promise<ApiResponse<LoanApplication[]>> {
  try {
    return await apiClient.get('/capital/loans');
  } catch (error) {
    logger.error('capitalApi.getApplications', { error });
    throw error;
  }
}

/**
 * Get loan by ID
 */
export async function getLoan(loanId: string): Promise<ApiResponse<LoanApplication>> {
  try {
    return await apiClient.get(`/capital/loans/${loanId}`);
  } catch (error) {
    logger.error('capitalApi.getLoan', { loanId, error });
    throw error;
  }
}

/**
 * Get repayment schedule
 */
export async function getRepaymentSchedule(loanId: string): Promise<ApiResponse<Array<{ dueDate: string; amount: number; status: 'pending' | 'paid' }>>> {
  try {
    return await apiClient.get(`/capital/loans/${loanId}/schedule`);
  } catch (error) {
    logger.error('capitalApi.getSchedule', { loanId, error });
    throw error;
  }
}

/**
 * Make repayment
 */
export async function makeRepayment(loanId: string, amount: number): Promise<ApiResponse<{ success: boolean; transactionId: string }>> {
  try {
    return await apiClient.post(`/capital/loans/${loanId}/repay`, { amount });
  } catch (error) {
    logger.error('capitalApi.repay', { loanId, amount, error });
    throw error;
  }
}

export default {
  getCreditScore,
  applyForLoan,
  getLoanApplications,
  getLoan,
  getRepaymentSchedule,
  makeRepayment,
};
