export type PaymentMethod = 'card' | 'upi' | 'wallet' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentRequest {
  sessionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  message: string;
  gatewayReference?: string;
  paymentDetails?: {
    last4?: string;
    cardType?: string;
    upiId?: string;
    walletName?: string;
  };
  timestamp: Date;
}

export interface PaymentConfirmation {
  transactionId: string;
  status: PaymentStatus;
  gatewayReference: string;
  confirmedAt: Date;
}

export class PaymentService {
  private gatewayUrl: string;
  private apiKey: string;

  constructor() {
    this.gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 'https://api.rezpay.example.com';
    this.apiKey = process.env.PAYMENT_API_KEY || '';
  }

  /**
   * Initiate a payment for a checkout session
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const { sessionId, amount, currency, method, customerId, metadata } = request;

    // Validate payment request
    if (amount <= 0) {
      return {
        success: false,
        status: 'failed',
        message: 'Invalid payment amount',
        timestamp: new Date(),
      };
    }

    if (!this.validatePaymentMethod(method)) {
      return {
        success: false,
        status: 'failed',
        message: 'Invalid payment method',
        timestamp: new Date(),
      };
    }

    try {
      // In production, this would call the actual payment gateway
      const transactionId = this.generateTransactionId();
      const gatewayReference = await this.callPaymentGateway({
        transactionId,
        amount,
        currency,
        method,
        customerId,
        metadata,
      });

      return {
        success: true,
        transactionId,
        status: 'processing',
        message: 'Payment initiated successfully',
        gatewayReference,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment initiation failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Confirm a payment after processing
   */
  async confirmPayment(transactionId: string): Promise<PaymentConfirmation> {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    try {
      // In production, this would verify with the payment gateway
      const confirmation = await this.verifyWithGateway(transactionId);

      return {
        transactionId,
        status: confirmation.status,
        gatewayReference: confirmation.reference,
        confirmedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Payment confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle payment failure
   */
  async handleFailure(
    transactionId: string,
    reason: string
  ): Promise<{ recorded: boolean; message: string }> {
    if (!transactionId) {
      return { recorded: false, message: 'Transaction ID is required' };
    }

    // In production, this would:
    // 1. Log the failure to the payment gateway
    // 2. Update the transaction status in the database
    // 3. Send notification to the customer
    // 4. Trigger any retry logic if applicable

    console.error(`Payment failure recorded: ${transactionId}`, {
      reason,
      timestamp: new Date().toISOString(),
    });

    return {
      recorded: true,
      message: 'Payment failure has been recorded',
    };
  }

  /**
   * Process a refund
   */
  async processRefund(
    transactionId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; message: string }> {
    if (!transactionId) {
      return { success: false, message: 'Transaction ID is required' };
    }

    try {
      // In production, this would call the payment gateway's refund API
      const refundId = await this.initiateRefund(transactionId, amount);

      return {
        success: true,
        refundId,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // In production, this would query the payment gateway
    // For now, return a mock status
    return 'completed';
  }

  /**
   * Validate payment method
   */
  private validatePaymentMethod(method: string): boolean {
    const validMethods: PaymentMethod[] = ['card', 'upi', 'wallet', 'cash'];
    return validMethods.includes(method as PaymentMethod);
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    const prefix = 'TXN';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Call the payment gateway (mock implementation)
   */
  private async callPaymentGateway(params: {
    transactionId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    customerId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    // Mock gateway call - in production, use actual payment gateway SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        const reference = `REF_${params.transactionId}`;
        resolve(reference);
      }, 100);
    });
  }

  /**
   * Verify payment with gateway (mock implementation)
   */
  private async verifyWithGateway(
    transactionId: string
  ): Promise<{ status: PaymentStatus; reference: string }> {
    // Mock verification - in production, call actual gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'completed',
          reference: `VERIFIED_${transactionId}`,
        });
      }, 50);
    });
  }

  /**
   * Initiate refund with gateway (mock implementation)
   */
  private async initiateRefund(
    transactionId: string,
    amount?: number
  ): Promise<string> {
    // Mock refund - in production, call actual gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        const refundId = `REFUND_${transactionId}_${Date.now()}`;
        resolve(refundId);
      }, 100);
    });
  }

  /**
   * Calculate payment fees based on method
   */
  calculateFees(amount: number, method: PaymentMethod): { fees: number; total: number } {
    const feesByMethod: Record<PaymentMethod, number> = {
      card: amount * 0.02, // 2% fee
      upi: 0, // No fee
      wallet: amount * 0.01, // 1% fee
      cash: 0, // No fee
    };

    const fees = feesByMethod[method] || 0;
    return {
      fees: Math.round(fees * 100) / 100,
      total: Math.round((amount + fees) * 100) / 100,
    };
  }
}

export const paymentService = new PaymentService();
