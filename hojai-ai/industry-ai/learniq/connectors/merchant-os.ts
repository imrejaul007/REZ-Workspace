/**
 * Merchant OS Connector
 * Connects LEARNIQ to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  async processPayment(studentId: string, amount: number, courseId: string): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/payments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentId, amount, courseId, type: 'enrollment' })
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        transactionId: data.transactionId,
        message: data.message || 'Payment processed'
      };
    } catch {
      return { success: false, message: 'Payment processing failed' };
    }
  }

  async getPaymentHistory(studentId: string): Promise<{
    payments: { amount: number; courseId: string; date: string; status: string }[];
    totalPaid: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/payments/student/${studentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return { payments: [], totalPaid: 0 };
      return await response.json();
    } catch {
      return { payments: [], totalPaid: 0 };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;