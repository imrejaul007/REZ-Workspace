/**
 * Merchant OS Connector
 * Connects GLAMAI to Merchant OS (REZ or Standalone)
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
  skinType?: string;
  hairType?: string;
  preferences?: string[];
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

export interface ServiceBooking {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
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
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}`,
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
      console.error('Merchant OS: Failed to get customer by ID');
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
   * Update customer preferences
   */
  async updateCustomerPreferences(
    customerId: string,
    preferences: Partial<Customer>
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferences)
        }
      );

      return response.ok;
    } catch {
      console.error('Merchant OS: Failed to update customer preferences');
      return false;
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
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(
    customerId: string,
    points: number
  ): Promise<{ success: boolean; remainingPoints: number }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}/loyalty/redeem`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ points })
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        remainingPoints: data.remainingPoints || 0
      };
    } catch {
      return { success: false, remainingPoints: 0 };
    }
  }

  /**
   * Get service catalog
   */
  async getServices(): Promise<ServiceBooking[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/services`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.services || [];
    } catch {
      return [];
    }
  }

  /**
   * Book a service
   */
  async bookService(booking: Omit<ServiceBooking, 'id'>): Promise<ServiceBooking | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(booking)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to book service');
      return null;
    }
  }

  /**
   * Get customer bookings
   */
  async getCustomerBookings(customerId: string): Promise<ServiceBooking[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings?customerId=${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.bookings || [];
    } catch {
      return [];
    }
  }

  /**
   * Get products
   */
  async getProducts(category?: string): Promise<Product[]> {
    try {
      const url = category
        ? `${this.config.baseUrl}/api/products?category=${category}`
        : `${this.config.baseUrl}/api/products`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.products || [];
    } catch {
      return [];
    }
  }

  /**
   * Update product stock
   */
  async updateProductStock(
    productId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/products/${productId}/stock`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quantity })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get staff list
   */
  async getStaff(): Promise<{ id: string; name: string; role: string }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/staff`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.staff || [];
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
