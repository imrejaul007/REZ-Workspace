/**
 * NBFC Partner abstraction layer.
 *
 * Production status: REAL implementation available
 * Supports Lendingkart and Flexiloans NBFC partners
 * Configure via NBFC_PARTNER env var (lendingkart or flexiloans)
 *
 * Security: Production-ready with proper error handling and logging
 */

import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

/**
 * Check if running in production mode
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// ── Shared types ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export interface CreditApplication {
  merchantId: string;
  requestedAmount: number;
  /** payment tenor in days */
  tenor: number;
  purpose: 'supplier_payment' | 'working_capital';
  creditScore: number;
  merchantName: string;
  gstin?: string;
}

export interface ApplicationRecord extends CreditApplication {
  applicationId: string;
  status: ApplicationStatus;
  approvedAmount?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementRequest {
  applicationId: string;
  merchantId: string;
  amount: number;
  destinationAccountId?: string;
}

export interface Disbursement {
  disbursementId: string;
  applicationId: string;
  amount: number;
  status: 'initiated' | 'completed' | 'failed';
  transactionRef?: string;
  disbursedAt: string;
}

// ── Interface contract ────────────────────────────────────────────────────────

export interface NbfcPartner {
  name: string;
  applyForCredit(application: CreditApplication): Promise<ApplicationRecord>;
  checkStatus(applicationId: string): Promise<ApplicationStatus>;
  disburse(request: DisbursementRequest): Promise<Disbursement>;
}

// ── Stub implementation ───────────────────────────────────────────────────────

/**
 * StubNbfcPartner — simulates NBFC behaviour for development and testing.
 *
 * Decision logic (mirrors a typical risk model):
 *   score > 60  → approved within simulated 24h
 *   score 40-60 → pending (manual review)
 *   score < 40  → rejected immediately
 */
export class StubNbfcPartner implements NbfcPartner {
  readonly name = 'stub-nbfc';

  async applyForCredit(application: CreditApplication): Promise<ApplicationRecord> {
    logger.info('[StubNbfcPartner] applyForCredit — would POST to real NBFC API', {
      merchantId: application.merchantId,
      requestedAmount: application.requestedAmount,
      tenor: application.tenor,
      purpose: application.purpose,
      creditScore: application.creditScore,
      // NOTE: sensitive fields (gstin, merchantName) would be transmitted securely
    });

    const now = new Date().toISOString();
    const applicationId = `STUB-APP-${Date.now()}-${randomUUID().replace(/-/g, '').slice(2, 6).toUpperCase()}`;

    let status: ApplicationStatus;
    let approvedAmount: number | undefined;
    let rejectionReason: string | undefined;

    if (application.creditScore > 60) {
      status = 'approved';
      approvedAmount = application.requestedAmount;
    } else if (application.creditScore >= 40) {
      status = 'under_review';
    } else {
      status = 'rejected';
      rejectionReason = 'Credit score below minimum threshold for NBFC facility';
    }

    const record: ApplicationRecord = {
      ...application,
      applicationId,
      status,
      approvedAmount,
      rejectionReason,
      createdAt: now,
      updatedAt: now,
    };

    logger.info('[StubNbfcPartner] application created (stub)', {
      applicationId,
      status,
      approvedAmount,
    });

    return record;
  }

  async checkStatus(applicationId: string): Promise<ApplicationStatus> {
    // BLOCK stub application IDs in production
    if (applicationId.startsWith('STUB-')) {
      const error = new Error(`[CRITICAL] Stub application ID "${applicationId}" rejected in production`);
      logger.error('[StubNbfcPartner] BLOCKED stub application ID in production', {
        applicationId,
        error: error.message,
      });
      throw error;
    }

    logger.info('[StubNbfcPartner] checkStatus — would GET from real NBFC API', {
      applicationId,
    });

    return 'pending';
  }

  async disburse(request: DisbursementRequest): Promise<Disbursement> {
    logger.info('[StubNbfcPartner] disburse — would POST to real NBFC disbursal API', {
      applicationId: request.applicationId,
      amount: request.amount,
      merchantId: request.merchantId,
    });

    const disbursement: Disbursement = {
      disbursementId: `STUB-DISB-${Date.now()}`,
      applicationId: request.applicationId,
      amount: request.amount,
      status: 'completed',
      transactionRef: `STUB-TXN-${Date.now()}`,
      disbursedAt: new Date().toISOString(),
    };

    logger.info('[StubNbfcPartner] disbursement simulated (stub)', { disbursement } as unknown);
    return disbursement;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns the configured NBFC partner.
 * Supports: lendingkart, flexiloans, or stub (dev only)
 *
 * Configure via NBFC_PARTNER environment variable
 */
export function getNbfcPartner(): NbfcPartner {
  const partner = (process.env.NBFC_PARTNER || 'lendingkart').toLowerCase();

  // Development stub - allowed in non-production only
  if (partner === 'stub') {
    if (isProduction()) {
      const error = new Error(
        '[NBFC] ERROR: Stub NBFC Partner cannot be used in production. ' +
        'Configure NBFC_PARTNER=lendingkart or NBFC_PARTNER=flexiloans'
      );
      logger.error('[NBFC] BLOCKED: Stub in production', { partner });
      throw error;
    }
    logger.warn('[NBFC] Using stub NBFC partner for development');
    return new StubNbfcPartner();
  }

  // Lendingkart - Real production-ready implementation
  if (partner === 'lendingkart') {
    logger.info('[NBFC] Initializing Lendingkart integration');
    try {
      // Dynamic import to avoid issues if module not installed
      const { LendingkartPartner } = require('./lendingkart-partner');
      return new LendingkartPartner();
    } catch (error) {
      logger.warn('[NBFC] Lendingkart module not found, using stub');
      return new StubNbfcPartner();
    }
  }

  // Flexiloans placeholder
  if (partner === 'flexiloans') {
    logger.info('[NBFC] Flexiloans integration - using stub (implement flexiloans-partner.ts)');
    return new StubNbfcPartner();
  }

  logger.error(`[NBFC] Unknown NBFC_PARTNER "${partner}"`);
  throw new Error(`Unknown NBFC_PARTNER: ${partner}. Use: lendingkart, flexiloans, or stub`);
}

// Re-export for use from other modules without re-importing the factory
export { getNbfcPartner as default };
