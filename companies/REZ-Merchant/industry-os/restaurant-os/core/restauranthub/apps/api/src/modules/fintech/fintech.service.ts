/**
 * FintechService — working capital and credit scoring integration.
 *
 * Orchestrates calls to:
 *   - rez-wallet-service  /credit-score/:merchantId  (score computation)
 *   - rez-wallet-service  /merchant-wallet/transactions (credit history)
 *   - rez-payment-service NBFC proxy (application lifecycle)
 *
 * Never returns raw financial data — only aggregated credit profiles,
 * application statuses, and eligibility decisions.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreditProfile,
  IneligibleProfile,
  CreditApplicationDto,
  CreditApplicationResult,
  CreditTransaction,
  SupplierPaymentDto,
  SupplierPaymentResult,
} from './fintech.dto';

@Injectable()
export class FintechService {
  private readonly logger = new Logger(FintechService.name);

  private readonly walletServiceUrl: string;
  private readonly paymentServiceUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const walletUrl = this.config.get<string>('REZ_WALLET_SERVICE_URL', 'https://rez-wallet-service-36vo.onrender.com');
    const paymentUrl = this.config.get<string>('REZ_PAYMENT_SERVICE_URL', 'https://rez-payment-service.onrender.com');

    if (!walletUrl) {
      this.logger.warn('REZ_WALLET_SERVICE_URL not set, using default');
    }
    if (!paymentUrl) {
      this.logger.warn('REZ_PAYMENT_SERVICE_URL not set, using default');
    }

    this.walletServiceUrl = walletUrl;
    this.paymentServiceUrl = paymentUrl;
    this.internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN', '');
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private internalHeaders() {
    return { 'x-internal-token': this.internalToken };
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  /**
   * Fetches the merchant's credit profile from rez-wallet-service.
   * Returns either a CreditProfile or an IneligibleProfile.
   */
  async getMerchantCreditProfile(
    rezMerchantId: string,
  ): Promise<CreditProfile | IneligibleProfile> {
    try {
      const resp = await axios.get<{
        success: boolean;
        data?: CreditProfile;
        ineligible?: boolean;
        reason?: string;
        dataMonthsAvailable?: number;
        cached?: boolean;
      }>(
        `${this.walletServiceUrl}/credit-score/${encodeURIComponent(rezMerchantId)}`,
        { headers: this.internalHeaders(), timeout: 10_000 },
      );

      if (resp.data?.ineligible) {
        return {
          ineligible: true,
          reason: resp.data.reason ?? 'Insufficient REZ data history',
          dataMonthsAvailable: resp.data.dataMonthsAvailable ?? 0,
        };
      }

      const score = resp.data?.data;
      if (!score) throw new Error('Empty response from wallet service');

      // Also fetch wallet balance to surface it in the profile
      const walletBalance = await this.fetchWalletBalance(rezMerchantId);

      return { ...score, merchantId: rezMerchantId, walletBalance };
    } catch (err: unknown) {
      this.logger.error('[FintechService] getMerchantCreditProfile failed', {
        rezMerchantId, error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /** Fetches current wallet balance from rez-wallet-service */
  private async fetchWalletBalance(rezMerchantId: string): Promise<number> {
    try {
      const resp = await axios.get<{ data?: { availableBalance?: number } }>(
        `${this.walletServiceUrl}/merchant-wallet/balance`,
        {
          headers: {
            ...this.internalHeaders(),
            'x-merchant-id': rezMerchantId,
          },
          timeout: 5000,
        },
      );
      return resp.data?.data?.availableBalance ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Submits a supplier credit application.
   * Validates eligibility before forwarding to the NBFC proxy.
   */
  async applyForSupplierCredit(
    rezMerchantId: string,
    dto: CreditApplicationDto,
  ): Promise<CreditApplicationResult> {
    // 1. Validate eligibility
    const profile = await this.getMerchantCreditProfile(rezMerchantId);

    if ('ineligible' in profile) {
      throw new BadRequestException(
        `Merchant is not eligible: ${profile.reason}`,
      );
    }

    // Type narrowing - profile is now CreditProfile
    if (!profile || typeof profile !== 'object' || !('eligibleForSupplierTerms' in profile)) {
      throw new BadRequestException('Invalid credit profile returned');
    }

    if (!profile.eligibleForSupplierTerms) {
      throw new BadRequestException(
        'Bronze tier merchants are not eligible for supplier credit. Improve your REZ score first.',
      );
    }

    if (dto.requestedAmount > profile.maxCreditLine) {
      throw new BadRequestException(
        `Requested amount exceeds your credit line of ₹${profile.maxCreditLine.toLocaleString('en-IN')}`,
      );
    }

    // 2. Forward to NBFC proxy in payment service
    try {
      const resp = await axios.post<{ data?: CreditApplicationResult }>(
        `${this.paymentServiceUrl}/internal/nbfc/apply`,
        {
          merchantId: rezMerchantId,
          requestedAmount: dto.requestedAmount,
          tenor: dto.tenor,
          purpose: dto.purpose,
          gstin: dto.gstin,
          creditScore: profile.score,
        },
        { headers: this.internalHeaders(), timeout: 12_000 },
      );

      const result = resp.data?.data;
      if (!result) throw new Error('Empty response from payment service NBFC proxy');

      // Persist to DB so getApplicationStatus works even if payment-service is slow
      await this.prisma.creditApplication.create({
        data: {
          id: result.applicationId,
          rezMerchantId,
          restauranthubUserId: rezMerchantId,
          requestedAmount: dto.requestedAmount,
          tenor: dto.tenor,
          purpose: dto.purpose,
          creditScore: profile.score,
          status: result.status.toUpperCase(),
          nbfcPartner: 'nbfc',
          approvedAmount: result.approvedAmount ?? null,
        },
      });

      return result;
    } catch (err: unknown) {
      // Fallback: create a stub result if the payment service NBFC proxy endpoint
      // doesn't exist yet (it's a stub) — this keeps the UI functional
      const axiosErr = err as { response?: { status?: number }; code?: string };
      if (axiosErr?.response?.status === 404 || axiosErr?.code === 'ECONNREFUSED') {
        this.logger.warn('[FintechService] NBFC proxy not available — creating stub application');
        return this.createStubApplication(rezMerchantId, dto, profile.score);
      }
      this.logger.error('[FintechService] applyForSupplierCredit failed', {
        rezMerchantId, error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /** Creates a local stub application when the payment-service NBFC route is unavailable */
  private async createStubApplication(
    merchantId: string,
    dto: CreditApplicationDto,
    creditScore: number,
  ): Promise<CreditApplicationResult> {
    let status: CreditApplicationResult['status'];

    if (creditScore > 60) status = 'approved';
    else if (creditScore >= 40) status = 'under_review';
    else status = 'rejected';

    this.logger.warn('[FintechService] Creating STUB credit application — NBFC proxy unavailable', {
      merchantId,
      amount: dto.requestedAmount,
      status,
      creditScore,
    });

    const record = await this.prisma.creditApplication.create({
      data: {
        rezMerchantId: merchantId,
        restauranthubUserId: merchantId,
        requestedAmount: dto.requestedAmount,
        tenor: dto.tenor,
        purpose: dto.purpose,
        creditScore,
        status: status.toUpperCase(),
        nbfcPartner: 'stub', // Clearly marked as stub
        approvedAmount: status === 'approved' ? dto.requestedAmount : null,
      },
    });

    return {
      applicationId: record.id,
      status,
      approvedAmount: record.approvedAmount ?? undefined,
      rejectionReason:
        status === 'rejected' ? 'Credit score below NBFC minimum threshold' : undefined,
      tenor: record.tenor,
      purpose: record.purpose,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /** Returns the status of a previously submitted application */
  async getApplicationStatus(applicationId: string): Promise<CreditApplicationResult> {
    // Check DB first
    const record = await this.prisma.creditApplication.findUnique({ where: { id: applicationId } });
    if (record) {
      return {
        applicationId: record.id,
        status: record.status.toLowerCase() as CreditApplicationResult['status'],
        approvedAmount: record.approvedAmount ?? undefined,
        tenor: record.tenor,
        purpose: record.purpose,
        createdAt: record.createdAt.toISOString(),
      };
    }

    // Try payment service
    try {
      const resp = await axios.get<{ data?: CreditApplicationResult }>(
        `${this.paymentServiceUrl}/internal/nbfc/applications/${encodeURIComponent(applicationId)}`,
        { headers: this.internalHeaders(), timeout: 8000 },
      );
      const result = resp.data?.data;
      if (!result) throw new Error('Application not found');
      return result;
    } catch (err: unknown) {
      this.logger.warn('[FintechService] getApplicationStatus — application not found', {
        applicationId,
      });
      throw new BadRequestException(`Application ${applicationId} not found`);
    }
  }

  /**
   * Returns transactions of type 'credit' from the merchant's wallet history.
   * Filters server-side to avoid returning all transaction types.
   */
  async getCreditHistory(rezMerchantId: string): Promise<CreditTransaction[]> {
    try {
      const resp = await axios.get<{
        data?: { transactions?: Array<{ type: string; [key: string]: unknown }> };
      }>(
        `${this.walletServiceUrl}/merchant-wallet/transactions?limit=50`,
        {
          headers: {
            ...this.internalHeaders(),
            'x-merchant-id': rezMerchantId,
          },
          timeout: 8000,
        },
      );

      const all = resp.data?.data?.transactions ?? [];
      return all
        .filter((t) => t.type === 'credit')
        .map((t) => ({
          id: t.id,
          type: 'credit' as const,
          amount: t.amount,
          currency: t.currency ?? 'INR',
          status: t.status,
          description: t.description,
          reference: t.reference,
          createdAt: t.createdAt,
        }));
    } catch (err: unknown) {
      this.logger.warn('[FintechService] getCreditHistory failed', {
        rezMerchantId, error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /**
   * Initiates a supplier payment using the merchant's approved credit line.
   * Stub: logs the intent and returns a simulated result until a real NBFC is wired.
   */
  async paySupplierWithCredit(
    rezMerchantId: string,
    dto: SupplierPaymentDto,
  ): Promise<SupplierPaymentResult> {
    // Validate payment amount
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be a positive number');
    }

    const profile = await this.getMerchantCreditProfile(rezMerchantId);

    if ('ineligible' in profile) {
      throw new BadRequestException('Merchant is not eligible to use supplier credit payment');
    }

    if (!profile || typeof profile !== 'object' || !('eligibleForSupplierTerms' in profile)) {
      throw new BadRequestException('Invalid credit profile returned');
    }

    if (!profile.eligibleForSupplierTerms) {
      throw new BadRequestException('Merchant is not eligible to use supplier credit payment');
    }

    if (dto.amount > profile.maxCreditLine) {
      throw new BadRequestException(
        `Payment amount exceeds credit line of ₹${profile.maxCreditLine.toLocaleString('en-IN')}`,
      );
    }

    this.logger.log('[FintechService] paySupplierWithCredit initiated (stub)', {
      rezMerchantId,
      supplierId: dto.supplierId,
      amount: dto.amount,
      invoiceRef: dto.invoiceRef,
    });

    // Stub result — replace with real NBFC disbursement when partner is live
    return {
      paymentId: `PAY-${Date.now()}-${crypto.randomInt(1000, 9999).toString().padStart(4, '0')}`,
      supplierId: dto.supplierId,
      amount: dto.amount,
      status: 'initiated',
      processedAt: new Date().toISOString(),
    };
  }
}
