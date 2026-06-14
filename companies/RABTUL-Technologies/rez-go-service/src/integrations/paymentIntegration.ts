import { config } from '../config/index.js';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface WalletBalanceResponse {
  balance: number;
  currency: string;
}

interface ApiError {
  message?: string;
}

interface ApiResponse {
  razorpayOrderId?: string;
  transactionId?: string;
  status?: string;
}

class PaymentIntegration {
  private walletServiceUrl: string;
  private paymentServiceUrl: string;
  private internalToken: string;

  constructor() {
    this.walletServiceUrl = config.WALLET_SERVICE_URL;
    this.paymentServiceUrl = config.PAYMENT_SERVICE_URL;
    this.internalToken = config.INTERNAL_SERVICE_TOKEN;
  }

  /**
   * Initiate UPI payment
   */
  async initiateUPI(sessionId: string, amount: number): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.paymentServiceUrl}/pay/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          orderId: `GO-${sessionId}`,
          amount: Math.round(amount * 100), // Convert to paise
          paymentMethod: 'upi',
          purpose: 'rez-go-checkout',
        }),
      });

      if (!response.ok) {
        const err = await response.json() as ApiError;
        return { success: false, error: err.message || 'Payment initiation failed' };
      }

      const data = await response.json() as ApiResponse;
      return {
        success: true,
        paymentId: data.razorpayOrderId,
      };
    } catch (error) {
      console.error('UPI payment error:', error);
      return { success: false, error: 'Payment service unavailable' };
    }
  }

  /**
   * Process wallet payment
   */
  async processWalletPayment(
    sessionId: string,
    userId: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.walletServiceUrl}/internal/wallet/debit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          userId,
          amount: Math.round(amount * 100), // Convert to coins (1 coin = 1 rupee)
          source: 'rez-go-checkout',
          referenceId: sessionId,
        }),
      });

      if (!response.ok) {
        const err = await response.json() as ApiError;
        return { success: false, error: err.message || 'Wallet debit failed' };
      }

      const data = await response.json() as ApiResponse;
      return {
        success: true,
        paymentId: data.transactionId,
      };
    } catch (error) {
      console.error('Wallet payment error:', error);
      return { success: false, error: 'Wallet service unavailable' };
    }
  }

  /**
   * Initiate card payment
   */
  async initiateCardPayment(sessionId: string, amount: number): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.paymentServiceUrl}/pay/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          orderId: `GO-${sessionId}`,
          amount: Math.round(amount * 100),
          paymentMethod: 'card',
          purpose: 'rez-go-checkout',
        }),
      });

      if (!response.ok) {
        const err = await response.json() as ApiError;
        return { success: false, error: err.message || 'Payment initiation failed' };
      }

      const data = await response.json() as ApiResponse;
      return {
        success: true,
        paymentId: data.razorpayOrderId,
      };
    } catch (error) {
      console.error('Card payment error:', error);
      return { success: false, error: 'Payment service unavailable' };
    }
  }

  /**
   * Process split payment (wallet + UPI)
   */
  async processSplitPayment(
    sessionId: string,
    userId: string,
    walletAmount: number,
    upiAmount: number
  ): Promise<PaymentResult> {
    try {
      // Debit wallet first
      if (walletAmount > 0) {
        const walletResult = await this.processWalletPayment(sessionId, userId, walletAmount);
        if (!walletResult.success) {
          return walletResult;
        }
      }

      // Then initiate UPI for remaining amount
      if (upiAmount > 0) {
        const upiResult = await this.initiateUPI(sessionId, upiAmount);
        if (!upiResult.success) {
          // Rollback wallet if UPI fails
          if (walletAmount > 0) {
            await this.refundToWallet(userId, walletAmount, sessionId);
          }
          return upiResult;
        }

        return {
          success: true,
          paymentId: `SPLIT-${walletAmount}-${upiAmount}-${sessionId}`,
        };
      }

      return {
        success: true,
        paymentId: `WALLET-${sessionId}`,
      };
    } catch (error) {
      console.error('Split payment error:', error);
      return { success: false, error: 'Split payment failed' };
    }
  }

  /**
   * Refund to wallet (rollback)
   */
  private async refundToWallet(userId: string, amount: number, sessionId: string): Promise<void> {
    try {
      await fetch(`${this.walletServiceUrl}/internal/wallet/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          userId,
          amount,
          coinType: 'cashback',
          source: 'rez-go-refund',
          description: `Refund for failed split payment - ${sessionId}`,
        }),
      });
    } catch (error) {
      console.error('Wallet refund error:', error);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.paymentServiceUrl}/pay/${paymentId}`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.internalToken,
        },
      });

      if (!response.ok) {
        return { status: 'failed', error: 'Payment not found' };
      }

      const data = await response.json() as ApiResponse;
      return {
        status: data.status === 'captured' ? 'completed' : 'pending',
      };
    } catch (error) {
      return { status: 'failed', error: 'Verification failed' };
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(paymentId: string, amount: number): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.paymentServiceUrl}/pay/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
        }),
      });

      if (!response.ok) {
        const err = await response.json() as ApiError;
        return { success: false, error: err.message || 'Refund failed' };
      }

      return { success: true, paymentId };
    } catch (error) {
      return { success: false, error: 'Refund service unavailable' };
    }
  }
}

export const paymentIntegration = new PaymentIntegration();
