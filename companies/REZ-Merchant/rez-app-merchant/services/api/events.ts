import { apiClient } from './client';

// Event Slot Interface
export interface EventSlot {
  id: string;
  time: string;
  maxCapacity: number;
  bookedCount: number;
  available: boolean;
}

// Event Location Interface
export interface EventLocation {
  name: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOnline: boolean;
  meetingUrl?: string;
}

// Event Organizer Interface
export interface EventOrganizer {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
}

// Event Price Interface
export interface EventPrice {
  amount: number;
  currency: string;
  isFree: boolean;
  originalPrice?: number;
  discount?: number;
}

// Event Analytics Interface
export interface EventAnalytics {
  views: number;
  bookings: number;
  shares: number;
  favorites: number;
  lastViewed?: string;
}

// Event Schedule Item
export interface EventScheduleItem {
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
}

// Event Ticket Type
export interface EventTicketType {
  name: string;
  price: number;
  currency?: string;
  maxQuantity: number;
  soldCount?: number;
  description?: string;
}

// Event Sponsor
export interface EventSponsor {
  name: string;
  logo?: string;
}

// Event Categories
export type EventCategory =
  | 'Music'
  | 'Technology'
  | 'Wellness'
  | 'Sports'
  | 'Education'
  | 'Business'
  | 'Arts'
  | 'Food'
  | 'Entertainment'
  | 'Other';

// Event Status
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'sold_out';

// Main Event Interface
export interface Event {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  images?: string[];
  price: EventPrice;
  location: EventLocation;
  date: string;
  time: string;
  endTime?: string;
  category: EventCategory;
  subcategory?: string;
  organizer: EventOrganizer;
  merchantId: string;
  isOnline: boolean;
  registrationRequired: boolean;
  bookingUrl?: string;
  availableSlots?: EventSlot[];
  status: EventStatus;
  tags: string[];
  maxCapacity?: number;
  minAge?: number;
  requirements?: string[];
  includes?: string[];
  refundPolicy?: string;
  cancellationPolicy?: string;
  analytics: EventAnalytics;
  featured: boolean;
  priority: number;
  schedule?: EventScheduleItem[];
  ticketTypes?: EventTicketType[];
  sponsors?: EventSponsor[];
  rewardConfigId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
}

// Create Event Data
export interface CreateEventData {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  images?: string[];
  price: {
    amount: number;
    currency?: string;
    isFree?: boolean;
    originalPrice?: number;
    discount?: number;
  };
  location: {
    name: string;
    address: string;
    city: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    isOnline?: boolean;
    meetingUrl?: string;
  };
  date: string;
  time: string;
  endTime?: string;
  category: EventCategory;
  subcategory?: string;
  organizer: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    logo?: string;
  };
  isOnline?: boolean;
  registrationRequired?: boolean;
  bookingUrl?: string;
  availableSlots?: Array<{
    id?: string;
    time: string;
    maxCapacity: number;
  }>;
  maxCapacity?: number;
  minAge?: number;
  requirements?: string[];
  includes?: string[];
  refundPolicy?: string;
  cancellationPolicy?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  featured?: boolean;
  priority?: number;
  schedule?: EventScheduleItem[];
  ticketTypes?: Array<{
    name: string;
    price: number;
    currency?: string;
    maxQuantity: number;
    description?: string;
  }>;
  sponsors?: Array<{
    name: string;
    logo?: string;
  }>;
}

// Update Event Data
export interface UpdateEventData extends Partial<CreateEventData> {}

// Event Booking Interface
export interface EventBooking {
  id: string;
  bookingReference: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  slotId?: string;
  bookingDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentStatus:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired'
    | 'refund_initiated'
    | 'refund_processing'
    | 'refunded'
    | 'refund_failed'
    | 'partially_refunded';
  amount: number;
  currency: string;
  attendeeInfo: {
    name: string;
    email: string;
    phone?: string;
    age?: number;
    specialRequirements?: string;
  };
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
}

// Event Booking Stats
export interface EventBookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  totalRevenue: number;
}

// Event Analytics Extended
export interface EventAnalyticsExtended {
  views: number;
  bookings: number;
  shares: number;
  favorites: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  currency: string;
  capacityUtilization: number;
  conversionRate: number;
}

// List Events Params
export interface ListEventsParams {
  status?: EventStatus;
  category?: EventCategory;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'date_asc' | 'date_desc' | 'popular';
}

// Pagination Interface
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

class EventService {
  /**
   * Get all events for the merchant
   */
  async getEvents(params?: ListEventsParams): Promise<{ events: Event[]; pagination: Pagination }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.featured !== undefined)
        queryParams.append('featured', params.featured.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sort) queryParams.append('sort', params.sort);

      const queryString = queryParams.toString();
      const url = queryString ? `merchant/events?${queryString}` : 'merchant/events';

      const response = await apiClient.get<unknown>(url);

      // Backend returns: { success: true, message: '...', data: { events: [], pagination: {} } }
      if (response.data && response.data.events) {
        return {
          events: response.data.events,
          pagination: response.data.pagination,
        };
      }

      return {
        events: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get events');
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    try {
      const response = await apiClient.get<unknown>(`merchant/events/${eventId}`);
      if (!response.data) {
        throw new Error('Event not found');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get event');
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventData): Promise<Event> {
    try {
      const response = await apiClient.post<unknown>('merchant/events', eventData);
      if (!response.data) {
        throw new Error('Failed to create event');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create event');
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, eventData: UpdateEventData): Promise<Event> {
    try {
      const response = await apiClient.put<unknown>(`merchant/events/${eventId}`, eventData);
      if (!response.data) {
        throw new Error('Failed to update event');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update event');
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await apiClient.delete(`merchant/events/${eventId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete event');
    }
  }

  /**
   * Publish event (change status from draft to published)
   */
  async publishEvent(eventId: string): Promise<Event> {
    try {
      const response = await apiClient.post<unknown>(`merchant/events/${eventId}/publish`);
      if (!response.data) {
        throw new Error('Failed to publish event');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to publish event');
    }
  }

  /**
   * Cancel event
   */
  async cancelEvent(
    eventId: string,
    reason?: string
  ): Promise<{ event: Event; cancelledBookings: number }> {
    try {
      const response = await apiClient.post<unknown>(`merchant/events/${eventId}/cancel`, { reason });
      if (!response.data) {
        throw new Error('Failed to cancel event');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to cancel event');
    }
  }

  /**
   * Get event bookings
   */
  async getEventBookings(
    eventId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<{ bookings: EventBooking[]; stats: EventBookingStats; pagination: Pagination }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/events/${eventId}/bookings?${queryString}`
        : `merchant/events/${eventId}/bookings`;

      const response = await apiClient.get<unknown>(url);

      // Backend returns: { success: true, data: { bookings, stats, pagination } }
      if (response.data) {
        return {
          bookings: response.data.bookings || [],
          stats: response.data.stats || {
            total: 0,
            confirmed: 0,
            pending: 0,
            cancelled: 0,
            completed: 0,
            totalRevenue: 0,
          },
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      return {
        bookings: [],
        stats: {
          total: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          completed: 0,
          totalRevenue: 0,
        },
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get event bookings'
      );
    }
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string): Promise<EventAnalyticsExtended> {
    try {
      const response = await apiClient.get<unknown>(`merchant/events/${eventId}/analytics`);

      if (response.data) {
        return response.data;
      }

      return {
        views: 0,
        bookings: 0,
        shares: 0,
        favorites: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        currency: '₹',
        capacityUtilization: 0,
        conversionRate: 0,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get event analytics'
      );
    }
  }

  /**
   * Get event categories from backend
   */
  async getEventCategories(): Promise<
    { name: string; slug: string; icon?: string; _id: string }[]
  > {
    try {
      const response = await apiClient.get<unknown>('events/categories');
      return response.data?.categories || [];
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch event categories:', error.message);
      return [];
    }
  }

  /**
   * Check in a booking
   */
  async checkInBooking(
    eventId: string,
    bookingId: string
  ): Promise<{ booking: { id: string; bookingReference: string; checkInTime: string } }> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/events/${eventId}/bookings/${bookingId}/checkin`
      );
      if (!response.data) {
        throw new Error('Failed to check in booking');
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to check in booking'
      );
    }
  }
}

export const eventService = new EventService();
export default eventService;
