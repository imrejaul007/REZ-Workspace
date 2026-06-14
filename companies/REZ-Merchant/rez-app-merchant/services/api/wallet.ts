import { apiClient } from './client';

export interface WalletBalance {
  total: number;
  available: number;
  pending: number;
  withdrawn: number;
  held: number;
}

export interface WalletStatistics {
  totalSales: number;
  totalPlatformFees: number;
  netSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalRefunds: number;
  totalWithdrawals: number;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName?: string;
  upiId?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit' | 'withdrawal' | 'refund' | 'adjustment';
  amount: number;
  platformFee?: number;
  netAmount?: number;
  orderId?: string;
  orderNumber?: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface WalletSummary {
  balance: WalletBalance;
  statistics: WalletStatistics;
  bankDetails?: BankDetails | null;
  settlementCycle: 'instant' | 'daily' | 'weekly' | 'monthly';
  /** True when bank details have been saved and verified by the platform. */
  bankDetailsConfigured: boolean;
  /** ISO date string of the last settlement run, if unknown. */
  lastSettlementAt?: string;
  minWithdrawalAmount: number;
  isActive: boolean;
}

export interface TransactionHistoryResponse {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class WalletService {
  // Get wallet summary
  async getWalletSummary(): Promise<WalletSummary> {
    try {
      const response = await apiClient.get<WalletSummary>('merchant/wallet');

      if (!response.success || !response.data) {
        throw new Error(
          response.error ||
          "Oops! We couldn't load your wallet. Please try again."
        );
      }

      // Validate response structure to prevent crashes from malformed data (MA-API-022)
      const data = response.data;
      if (!data.balance || typeof data.balance.total !== 'number') {
        throw new Error(
          "We couldn't load your wallet balance. Please try again."
        );
      }

      return data;
    } catch (error) {
      if (__DEV__) console.error('Get wallet summary error:', error?.message || error);
      throw new Error(
        error?.message ||
        "We couldn't load your wallet. Please check your connection and try again."
      );
    }
  }

  // Get transaction history
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: 'credit' | 'debit' | 'withdrawal' | 'refund' | 'adjustment'
  ): Promise<TransactionHistoryResponse> {
    try {
      // Validate inputs to prevent invalid API calls (MA-PAY-031)
      if (page < 1) {
        throw new Error('Page number must be >= 1');
      }
      if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }
      // Validate transaction type filter (MA-PAY-031)
      const validTypes = ['credit', 'debit', 'withdrawal', 'refund', 'adjustment'];
      if (type && !validTypes.includes(type)) {
        throw new Error(`Invalid transaction type: ${type}`);
      }

      let url = `merchant/wallet/transactions?page=${page}&limit=${limit}`;
      if (type) {
        url += `&type=${type}`;
      }

      const response = await apiClient.get<{
        transactions: WalletTransaction[];
        pagination: TransactionHistoryResponse['pagination'];
      }>(url);

      if (!response.success) {
        throw new Error(
          response.message ||
          response.error ||
          "We couldn't load your transaction history. Please try again."
        );
      }

      return {
        transactions: response.data?.transactions || [],
        pagination: response.data?.pagination || { page, limit, total: 0, totalPages: 0 },
      };
    } catch (error) {
      // Use logger instead of __DEV__ console.error to avoid leaking sensitive data in prod (MA-PAY-024)
      if (__DEV__) console.error('Get transactions error:', error?.message || error);
      throw new Error(
        error?.message ||
        "We couldn't load your transactions. Please check your connection and try again."
      );
    }
  }

  // Request withdrawal
  async requestWithdrawal(
    amount: number
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    // G-MA-H01: Validate amount BEFORE hitting the wire so we never pass NaN,
    // Infinity, negative, or absurdly large values to the backend.
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Please enter a valid withdrawal amount.');
    }
    if (amount > 1_000_000) {
      throw new Error(
        'This amount exceeds our maximum withdrawal limit. Please try a smaller amount.'
      );
    }
    try {
      // Generate an idempotency key so double-tap / retry cannot issue a duplicate withdrawal
      const cryptoGlobal = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
      const idempotencyKey = cryptoGlobal?.randomUUID
        ? cryptoGlobal.randomUUID()
        : (await import('uuid')).v4();

      const response = await apiClient.post<{ transactionId?: string }>(
        'merchant/wallet/withdraw',
        { amount },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );

      return {
        success: response.success,
        message: response.message || 'Withdrawal requested successfully',
        transactionId: response.data?.transactionId,
      };
    } catch (error) {
      if (__DEV__) console.error('Request withdrawal error:', error);
      throw new Error(
        error.message ||
        "Your withdrawal request couldn't be processed. Please try again."
      );
    }
  }

  // Update bank details
  async updateBankDetails(
    bankDetails: Omit<BankDetails, 'isVerified' | 'verifiedAt'>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<void>('merchant/wallet/bank-details', bankDetails);

      return {
        success: response.success,
        message: response.message || 'Bank details updated successfully',
      };
    } catch (error) {
      if (__DEV__) console.error('Update bank details error:', error);
      throw new Error(
        error.message ||
        "Your bank details couldn't be saved. Please check your information and try again."
      );
    }
  }

  // Get wallet stats
  async getStats(): Promise<WalletStatistics> {
    try {
      const response = await apiClient.get<WalletStatistics>('merchant/wallet/stats');

      if (!response.success || !response.data) {
        throw new Error(
          response.error ||
          "We couldn't load your wallet statistics. Please try again."
        );
      }

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Get wallet stats error:', error);
      throw new Error(
        error.message ||
        "We couldn't load your statistics. Please check your connection and try again."
      );
    }
  }
}

// Create and export singleton instance
export const walletService = new WalletService();
export default walletService;
