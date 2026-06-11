/**
 * Merchant OS Connector
 * Connects TRIPMIND to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface BookingRecord {
  id: string;
  type: string;
  customerId: string;
  amount: number;
  status: string;
  date: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  async syncBookings(bookings: BookingRecord[]): Promise<{ synced: number; failed: number }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bookings })
        }
      );

      if (!response.ok) return { synced: 0, failed: bookings.length };
      const data = await response.json();
      return { synced: data.synced || 0, failed: data.failed || 0 };
    } catch {
      return { synced: 0, failed: bookings.length };
    }
  }

  async getCustomerBookingHistory(customerId: string): Promise<BookingRecord[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings/customer/${customerId}`,
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