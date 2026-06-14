// Events customer 360 extends CustomerService
import { CustomerService } from '@rez/base-services/customer';

export interface PurchaseRecord {
  purchaseId: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  tickets: number;
  totalAmount: number;
  purchaseDate: Date;
  status: 'completed' | 'refunded' | 'cancelled';
}

export interface CustomerPreference {
  category: string[];
  genres: string[];
  artists: string[];
  venues: string[];
  priceRange: {
    min: number;
    max: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface AttendanceRecord {
  eventId: string;
  eventName: string;
  customerId: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  attended: boolean;
  rating?: number;
}

export class EventsCustomerService extends CustomerService {
  /**
   * Get customer's event purchase history
   */
  async getPurchaseHistory(customerId: string): Promise<PurchaseRecord[]> {
    const purchases = await this.getOrders(customerId);

    return purchases.map((order) => ({
      purchaseId: order.id,
      eventId: order.eventId,
      eventName: order.eventName,
      eventDate: new Date(order.eventDate),
      tickets: order.tickets || order.quantity,
      totalAmount: order.total,
      purchaseDate: new Date(order.createdAt),
      status: order.status || 'completed',
    }));
  }

  /**
   * Get customer preferences for events
   */
  async getPreferences(customerId: string): Promise<CustomerPreference> {
    const profile = await this.getProfile(customerId);
    const preferences = profile?.preferences || {};

    return {
      category: preferences.category || ['concerts', 'sports', 'theater'],
      genres: preferences.genres || [],
      artists: preferences.artists || [],
      venues: preferences.venues || [],
      priceRange: preferences.priceRange || { min: 0, max: 500 },
      notifications: preferences.notifications || {
        email: true,
        sms: false,
        push: true,
      },
    };
  }

  /**
   * Get attendance record for specific event
   */
  async getAttendanceRecord(
    eventId: string,
    customerId: string
  ): Promise<AttendanceRecord | null> {
    const attendance = await this.getActivity(customerId, 'attendance');

    const record = attendance?.find(
      (a) => a.eventId === eventId
    );

    if (!record) {
      return null;
    }

    return {
      eventId: record.eventId,
      eventName: record.eventName,
      customerId,
      checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
      attended: record.attended || false,
      rating: record.rating,
    };
  }
}
