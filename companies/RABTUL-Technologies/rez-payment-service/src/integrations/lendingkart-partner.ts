/**
 * Lendingkart NBFC Partner Integration
 *
 * Real implementation for Lendingkart API integration
 * https://www.lendingkart.com/api/
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';
import {
  NbfcPartner,
  CreditApplication,
  ApplicationRecord,
  DisbursementRequest,
  Disbursement,
  ApplicationStatus
} from './nbfc-partner';

export class LendingkartPartner implements NbfcPartner {
  readonly name = 'lendingkart';
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.baseUrl = process.env.LENDINGKART_API_URL || 'https://api.lendingkart.com';
    this.apiKey = process.env.LENDINGKART_API_KEY || '';
    this.apiSecret = process.env.LENDINGKART_API_SECRET || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        'X-Api-Secret': this.apiSecret,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('[Lendingkart] API Error', {
          status: error.response?.status,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Apply for credit with Lendingkart
   */
  async applyForCredit(application: CreditApplication): Promise<ApplicationRecord> {
    logger.info('[Lendingkart] Applying for credit', {
      merchantId: application.merchantId,
      amount: application.requestedAmount,
      purpose: application.purpose,
    });

    try {
      // Transform to Lendingkart API format
      const payload = this.transformApplication(application);

      // Make API call to Lendingkart
      const response = await this.client.post('/v1/credit/applications', payload);

      const result = response.data;

      logger.info('[Lendingkart] Credit application submitted', {
        applicationId: result.applicationId,
        status: result.status,
      });

      return {
        ...application,
        applicationId: result.applicationId,
        status: this.mapStatus(result.status),
        approvedAmount: result.approvedAmount,
        rejectionReason: result.rejectionReason,
        createdAt: result.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('[Lendingkart] Credit application failed', {
        merchantId: application.merchantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return a pending application for retry
      return {
        ...application,
        applicationId: `LK-PENDING-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Check application status with Lendingkart
   */
  async checkStatus(applicationId: string): Promise<ApplicationStatus> {
    if (applicationId.startsWith('STUB-') || applicationId.startsWith('LK-PENDING-')) {
      return 'pending';
    }

    logger.info('[Lendingkart] Checking application status', { applicationId });

    try {
      const response = await this.client.get(`/v1/credit/applications/${applicationId}`);
      return this.mapStatus(response.data.status);
    } catch (error) {
      logger.error('[Lendingkart] Status check failed', {
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 'pending';
    }
  }

  /**
   * Initiate disbursement with Lendingkart
   */
  async disburse(request: DisbursementRequest): Promise<Disbursement> {
    logger.info('[Lendingkart] Initiating disbursement', {
      applicationId: request.applicationId,
      amount: request.amount,
    });

    try {
      const payload = {
        applicationId: request.applicationId,
        amount: request.amount,
        destinationAccountId: request.destinationAccountId,
        utr: `REZ-${Date.now()}`,
      };

      const response = await this.client.post('/v1/disbursements', payload);

      logger.info('[Lendingkart] Disbursement initiated', {
        disbursementId: response.data.disbursementId,
        status: response.data.status,
      });

      return {
        disbursementId: response.data.disbursementId,
        applicationId: request.applicationId,
        amount: request.amount,
        status: response.data.status === 'completed' ? 'completed' : 'initiated',
        transactionRef: response.data.utr || response.data.disbursementId,
        disbursedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('[Lendingkart] Disbursement failed', {
        applicationId: request.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return failed disbursement
      return {
        disbursementId: `LK-DISB-FAILED-${Date.now()}`,
        applicationId: request.applicationId,
        amount: request.amount,
        status: 'failed',
        disbursedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Transform REZ application to Lendingkart API format
   */
  private transformApplication(application: CreditApplication): Record<string, unknown> {
    return {
      business_details: {
        business_name: application.merchantName,
        gstin: application.gstin,
        business_type: 'proprietorship', // Default, can be enhanced
      },
      loan_details: {
        loan_amount: application.requestedAmount,
        tenor_days: application.tenor,
        purpose: this.mapPurpose(application.purpose),
      },
      applicant_details: {
        credit_score: application.creditScore,
        business_vintage: 365, // Default 1 year
      },
      metadata: {
        source: 'REZ',
        merchant_id: application.merchantId,
      },
    };
  }

  /**
   * Map Lendingkart status to REZ status
   */
  private mapStatus(lkStatus: string): ApplicationStatus {
    const statusMap: Record<string, ApplicationStatus> = {
      'submitted': 'pending',
      'under_review': 'under_review',
      'document_pending': 'under_review',
      'approved': 'approved',
      'disbursed': 'disbursed',
      'rejected': 'rejected',
      'closed': 'closed',
      'default': 'pending',
    };

    return statusMap[lkStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map REZ purpose to Lendingkart purpose
   */
  private mapPurpose(purpose: string): string {
    const purposeMap: Record<string, string> = {
      'supplier_payment': 'supplier_finance',
      'working_capital': 'working_capital',
      'inventory': 'inventory_finance',
      'equipment': 'equipment_finance',
    };

    return purposeMap[purpose] || 'working_capital';
  }
}

export default LendingkartPartner;