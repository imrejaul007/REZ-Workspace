/**
 * Merchant OS Connector
 * Connects STAYBOT to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface GuestProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
  loyaltyTier?: 'standard' | 'silver' | 'gold' | 'platinum';
  preferences?: string[];
  idVerified?: boolean;
}

export interface BookingRequest {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  rooms: number;
  adults: number;
  children?: number;
  specialRequests?: string;
  source?: 'direct' | 'ota' | 'agent';
  otaBookingId?: string;
}

export interface PaymentRequest {
  amount: number;
  method: 'upi' | 'card' | 'cash' | 'wallet' | 'online';
  guestId: string;
  bookingId?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}

export interface RoomAvailability {
  roomType: string;
  available: number;
  rate: number;
  date: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  /**
   * Get guest profile by phone
   */
  async getGuestByPhone(phone: string): Promise<GuestProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/phone/${phone}`,
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
      console.error('Merchant OS: Failed to get guest by phone');
      return null;
    }
  }

  /**
   * Get guest profile by ID
   */
  async getGuestById(guestId: string): Promise<GuestProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/${guestId}`,
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
      console.error('Merchant OS: Failed to get guest by ID');
      return null;
    }
  }

  /**
   * Create or update guest profile
   */
  async upsertGuest(guest: Omit<GuestProfile, 'id'>): Promise<GuestProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(guest)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert guest');
      return null;
    }
  }

  /**
   * Update guest profile
   */
  async updateGuest(guestId: string, updates: Partial<GuestProfile>): Promise<GuestProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/${guestId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to update guest');
      return null;
    }
  }

  /**
   * Check room availability
   */
  async checkAvailability(
    checkIn: string,
    checkOut: string,
    roomType?: string
  ): Promise<RoomAvailability[]> {
    try {
      const params = new URLSearchParams({ checkIn, checkOut });
      if (roomType) params.append('roomType', roomType);

      const response = await fetch(
        `${this.config.baseUrl}/api/rooms/availability?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.rooms || [];
    } catch {
      console.error('Merchant OS: Failed to check availability');
      return [];
    }
  }

  /**
   * Create booking
   */
  async createBooking(booking: BookingRequest): Promise<{ bookingId: string; confirmationCode: string } | null> {
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
      console.error('Merchant OS: Failed to create booking');
      return null;
    }
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<unknown | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get booking');
      return null;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/bookings/${bookingId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      return response.ok;
    } catch {
      console.error('Merchant OS: Failed to update booking status');
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
    } catch {
      console.error('Merchant OS: Payment processing failed');
      return {
        success: false,
        message: 'Payment processing failed. Please try again.'
      };
    }
  }

  /**
   * Get guest folio/invoice
   */
  async getFolio(guestId: string): Promise<unknown | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/folios/${guestId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get folio');
      return null;
    }
  }

  /**
   * Get guest loyalty points
   */
  async getLoyaltyPoints(guestId: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/${guestId}/loyalty`,
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
  async addLoyaltyPoints(guestId: string, points: number, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/${guestId}/loyalty`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ points, reason })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get stay history
   */
  async getStayHistory(guestId: string, limit: number = 10): Promise<unknown[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/guests/${guestId}/stays?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.stays || [];
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
