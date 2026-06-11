/**
 * Merchant OS Connector
 * Connects WAITRON to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
}

export interface PaymentRequest {
  amount: number;
  method: 'upi' | 'card' | 'cash' | 'wallet';
  orderId: string;
  customerId?: string;
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

  /**
   * Get customer by phone
   */
  async getCustomer(phone: string): Promise<Customer | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/phone/${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get customer');
      return null;
    }
  }

  /**
   * Create or update customer
   */
  async upsertCustomer(customer: Omit<Customer, 'id'>): Promise<Customer | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customer)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert customer');
      return null;
    }
  }

  /**
   * Process payment
   */
  async processPayment(payment: PaymentRequest): Promise<PaymentResponse> {
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
        message: data.message || (response.ok ? 'Payment successful' : 'Payment failed')
      };
    } catch (error) {
      console.error('Merchant OS: Payment processing failed');
      return {
        success: false,
        message: 'Payment processing failed. Please try again.'
      };
    }
  }

  /**
   * Get customer loyalty points
   */
  async getLoyaltyPoints(customerId: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}/loyalty`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return 0;
      const data = await response.json();
      return data.points || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(customerId: string, points: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}/loyalty`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ points })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(customerId: string, limit: number = 10): Promise<unknown[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/orders?customerId=${customerId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.orders || [];
    } catch {
      return [];
    }
  }

  /**
   * Check connectivity
   */
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
