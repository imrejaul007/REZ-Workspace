/**
 * Merchant OS Connector
 * Connects LEDGERAI to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface TransactionRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: 'upi' | 'card' | 'cash' | 'bank';
  reference?: string;
  linkedInvoiceId?: string;
}

export interface PaymentRequest {
  amount: number;
  method: 'upi' | 'card' | 'cash' | 'bank' | 'wallet';
  description?: string;
  reference?: string;
  linkedInvoiceId?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  async getTransactions(startDate?: string, endDate?: string): Promise<TransactionRecord[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${this.config.baseUrl}/api/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.transactions || [];
    } catch {
      console.error('Merchant OS: Failed to get transactions');
      return [];
    }
  }

  async recordPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/payments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payment)
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        transactionId: data.transactionId,
        message: data.message || (response.ok ? 'Payment recorded' : 'Payment failed')
      };
    } catch {
      return { success: false, message: 'Payment recording failed' };
    }
  }

  async reconcileAccounts(externalTransactions: TransactionRecord[]): Promise<{
    matched: TransactionRecord[];
    unmatched: TransactionRecord[];
    discrepancy: number;
  }> {
    const internalTransactions = await this.getTransactions();
    const matched: TransactionRecord[] = [];
    const unmatched: TransactionRecord[] = [];

    for (const ext of externalTransactions) {
      const found = internalTransactions.find(
        t => t.reference === ext.reference || t.amount === ext.amount && t.date === ext.date
      );
      if (found) {
        matched.push(ext);
      } else {
        unmatched.push(ext);
      }
    }

    const totalExternal = externalTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalMatched = matched.reduce((sum, t) => sum + t.amount, 0);

    return {
      matched,
      unmatched,
      discrepancy: totalExternal - totalMatched
    };
  }

  async getBalance(): Promise<{ balance: number; lastUpdated: string } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/balance`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
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