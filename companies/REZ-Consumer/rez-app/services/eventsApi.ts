import { EventItem } from '@/types/homepage.types';
import apiClient, { ApiResponse } from './apiClient';
import { logger } from '@/utils/logger';

// Region getter - will be set by RegionContext
let getRegionFn: (() => string) | null = null;

export function setEventsApiRegionGetter(fn: (() => string) | null) {
  getRegionFn = fn;
}

// Category mapping: Frontend display categories -> Backend API categories
// Covers all 10 backend categories: Music, Tech, Wellness, Sports, Education,
// Business, Arts, Food, Entertainment, Gaming — plus legacy slugs
const CATEGORY_MAP: Record<string, string> = {
  // Backend slugs (pass-through)
  music: 'music',
  tech: 'tech',
  technology: 'tech',
  wellness: 'wellness',
  sports: 'sports',
  education: 'education',
  business: 'business',
  arts: 'arts',
  food: 'food',
  entertainment: 'entertainment',
  gaming: 'gaming',
  // Legacy slugs (kept for backward compatibility)
  movies: 'entertainment',
  concerts: 'music',
  parks: 'wellness',
  workshops: 'education',
  fitness: 'wellness',
};

// Reverse mapping for display purposes: Backend -> Frontend display name
const REVERSE_CATEGORY_MAP: Record<string, string> = {
  music: 'Music',
  tech: 'Tech',
  wellness: 'Wellness',
  sports: 'Sports',
  education: 'Education',
  business: 'Business',
  arts: 'Arts',
  food: 'Food',
  entertainment: 'Entertainment',
  gaming: 'Gaming',
  // Legacy
  movies: 'Entertainment',
  concerts: 'Music',
  parks: 'Wellness',
  workshops: 'Education',
  fitness: 'Wellness',
};

// Helper function to map frontend category to backend category
export const mapCategoryToBackend = (frontendCategory: string): string => {
  const normalized = frontendCategory.toLowerCase();
  return CATEGORY_MAP[normalized] || frontendCategory;
};

// Helper function to map backend category to frontend display
export const mapCategoryToFrontend = (backendCategory: string): string => {
  return REVERSE_CATEGORY_MAP[backendCategory] || backendCategory.toLowerCase();
};

export interface EventFilters {
  category?: string;
  location?: string;
  date?: string;
  priceMin?: number;
  priceMax?: number;
  isOnline?: boolean;
  featured?: boolean;
  upcoming?: boolean;
  todayAndFuture?: boolean;
  search?: string;
}

export interface EventSearchResult {
  events: EventItem[];
  total: number;
  hasMore: boolean;
  suggestions?: string[];
}

export interface BookingRequest {
  slotId?: string;
  ticketTypeId?: string;
  idempotencyKey?: string;
  attendeeInfo: {
    name: string;
    email: string;
    phone?: string;
    age?: number;
    specialRequirements?: string;
  };
}

export interface BookingResult {
  success: boolean;
  booking?: Record<string, unknown>;
  payment?: {
    paymentIntentId?: string;
    clientSecret?: string;
    sessionId?: string;
  } | null;
  message: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Response wrapper interfaces (mirrors ApiResponse<T> from apiClient)
// ---------------------------------------------------------------------------
export interface BackendEventListData {
  events: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
  suggestions?: string[];
}

export interface BackendEventData {
  event: Record<string, unknown>;
}

export interface BackendFeaturedEventsData {
  events?: Record<string, unknown>[];
  results?: Record<string, unknown>[];
}

export interface BackendBookingData {
  booking?: Record<string, unknown>;
  payment?: BookingResult['payment'];
}

export interface BackendUserBookingsData {
  bookings: UserBooking[];
  total: number;
  hasMore: boolean;
}

export interface BackendFavoriteData {
  isFavorited?: boolean;
}

export interface BackendShareRewardData {
  reward?: { coinsAwarded: number };
}

export interface BackendCategoryData {
  categories?: BackendCategory[];
}

export interface BackendCategory {
  _id?: string;
  slug: string;
  name: string;
  icon?: string;
  color?: string;
  eventCount?: number;
  count?: number;
}

export interface BackendRewardConfigData {
  rewards: Array<{ action: string; coins: number; description: string }>;
  totalPotential: number;
}

export interface BackendFavoriteStatusData {
  isFavorited?: boolean;
}

export interface UserBooking {
  _id: string;
  eventId: string;
  slotId?: string;
  bookingDate: string;
  status: string;
  amount: number;
  currency: string;
  attendeeInfo: Record<string, unknown>;
  bookingReference: string;
  createdAt: string;
}

class EventsApiService {
  private baseUrl: string;
  private backendAvailable: boolean | null = null;
  private lastBackendCheck: number = 0;
  private BACKEND_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Derive from the central apiClient so all services share the same base URL
    this.baseUrl = apiClient.getBaseURL();
  }

  /**
   * Get headers with region included
   */
  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    // Add region header if available
    if (getRegionFn) {
      headers['X-Rez-Region'] = getRegionFn();
    }

    return headers;
  }

  /**
   * Check if backend is available
   * Only cache successful checks, not failures
   */
  async isBackendAvailable(): Promise<boolean> {
    const now = Date.now();

    // Use cached result if recent AND it was successful
    // Don't cache failures - always retry if last check failed
    if (this.backendAvailable === true && 
        (now - this.lastBackendCheck) < this.BACKEND_CHECK_INTERVAL) {
      return true;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    try {
      // Try a simple health check endpoint or the events endpoint
      // Use a timeout to prevent hanging (5 seconds)
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/events?limit=1`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const isAvailable = response.ok;
      
      // Only cache successful checks
      if (isAvailable) {
        this.backendAvailable = true;
        this.lastBackendCheck = now;
        logger.debug('✅ Events API is available');
      } else {
        // Don't cache failures - allow retry on next request
        logger.debug('⚠️ Events API returned non-OK status:', response.status);
      }

      return isAvailable;
    } catch (error) {
      // Clear timeout if it was set
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Don't cache failures - allow retry on next request
      logger.warn('❌ Events API availability check failed:', error);
      this.backendAvailable = null; // Reset to null so we retry
      return false;
    }
  }

  /**
   * Get all events with filters
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient so the 401-refresh-logout
   * interceptor fires on token expiry rather than silently failing.
   */
  async getEvents(filters: EventFilters = {}, limit = 20, offset = 0): Promise<EventSearchResult> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = { limit, offset };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value as string | number | boolean;
        }
      });

      const response = await apiClient.get<BackendEventListData>('/events', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch events');
      }

      const events = (response.data?.events ?? []).map(this.transformEventToFrontend);

      return {
        events,
        total: response.data?.total ?? 0,
        hasMore: response.data?.hasMore ?? false,
        suggestions: response.data?.suggestions ?? [],
      };
    } catch (error) {
      logger.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async getEventById(id: string): Promise<EventItem | null> {
    try {
      const response = await apiClient.get<BackendEventData>(`/events/${id}`);

      if (!response.success) {
        const errStr = (response.error || '').toLowerCase();
        if (errStr.includes('404') || errStr.includes('not found')) {
          return null;
        }
        throw new Error(response.error || 'Failed to fetch event');
      }

      return this.transformEventToFrontend((response.data?.event ?? response.data ?? {}) as Record<string, unknown>);
    } catch (error) {
      logger.error('❌ Error fetching event:', error);
      throw error;
    }
  }

  /**
   * Get events by category
   * Maps frontend display categories (movies, concerts, etc.) to backend categories (Entertainment, Music, etc.)
   * Also sends the original category as a tag filter for more specific results
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async getEventsByCategory(category: string, limit = 20, offset = 0, dateFilter?: string): Promise<EventSearchResult> {
    try {
      // Map frontend category to backend category
      const backendCategory = mapCategoryToBackend(category);
      const originalCategory = category.toLowerCase();
      logger.debug(`[eventsApi] Mapping category: ${category} -> ${backendCategory}, filtering by tag: ${originalCategory}`);

      const params: Record<string, string | number | boolean | undefined | null> = { limit, offset };

      // Add date filter if specified
      if (dateFilter && dateFilter !== 'all') {
        params.dateFilter = dateFilter;
      }

      // Add the original category as a tag filter for more specific results
      // This ensures "movies" shows only movies, not all Entertainment events
      if (backendCategory !== originalCategory && CATEGORY_MAP[originalCategory]) {
        params.tags = originalCategory;
      }

      const response = await apiClient.get<BackendEventListData>(
        `/events/category/${encodeURIComponent(backendCategory)}`,
        params,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch events by category');
      }

      const events = (response.data?.events ?? []).map(this.transformEventToFrontend);

      return {
        events,
        total: response.data?.total ?? 0,
        hasMore: response.data?.hasMore ?? false,
      };
    } catch (error) {
      logger.error('❌ Error fetching events by category:', error);
      throw error;
    }
  }

  /**
   * Search events
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async searchEvents(query: string, filters: EventFilters = {}, limit = 20, offset = 0): Promise<EventSearchResult> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = { q: query, limit, offset };

      // Add additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value as string | number | boolean;
        }
      });

      const response = await apiClient.get<BackendEventListData>('/events/search', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to search events');
      }

      const events = (response.data?.events ?? []).map(this.transformEventToFrontend);

      return {
        events,
        total: response.data?.total ?? 0,
        hasMore: response.data?.hasMore ?? false,
        suggestions: response.data?.suggestions ?? [],
      };
    } catch (error) {
      logger.error('❌ Error searching events:', error);
      throw error;
    }
  }

  /**
   * Get featured events for homepage
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async getFeaturedEvents(limit = 10): Promise<EventItem[]> {
    try {
      const response = await apiClient.get<BackendFeaturedEventsData>('/events/featured', { limit });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch featured events');
      }

      // Handle both response shapes: data (array) or data.events (object)
      const rawEvents = Array.isArray(response.data)
        ? response.data
        : (response.data?.events || response.data?.results || []);

      return rawEvents.map(this.transformEventToFrontend);
    } catch (error) {
      logger.error('❌ Error fetching featured events:', error);
      throw error;
    }
  }

  /**
   * Book event slot
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient so the 401-refresh-logout
   * interceptor fires on token expiry rather than silently returning a failed booking.
   */
  async bookEventSlot(eventId: string, bookingData: BookingRequest): Promise<BookingResult> {
    try {
      const response = await apiClient.post<BackendBookingData>(
        `/events/${eventId}/book`,
        bookingData as unknown as Record<string, unknown>,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to book event');
      }

      return {
        success: true,
        booking: response.data?.booking || (response.data as Record<string, unknown> | undefined),
        payment: response.data?.payment || null,
        message: response.message ?? 'Booking successful',
      };
    } catch (error) {
      logger.error('❌ [eventsApi] Error booking event:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to book event',
      };
    }
  }

  /**
   * Get related events (similar events based on category, location, or date)
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient so the 401-refresh-logout
   * interceptor fires on token expiry instead of silently returning an empty list.
   */
  async getRelatedEvents(eventId: string, limit = 6): Promise<EventItem[]> {
    try {
      const response = await apiClient.get<BackendFeaturedEventsData>(
        `/events/${eventId}/related`,
        { limit },
      );

      if (!response.success) {
        // If the endpoint is not yet deployed (backend 404), fall back to category.
        const errStr = (response.error || '').toLowerCase();
        if (errStr.includes('404') || errStr.includes('not found')) {
          logger.warn('⚠️ [RELATED EVENTS] Related events endpoint not found, using category fallback');
          const event = await this.getEventById(eventId);
          if (event) {
            return this.getEventsByCategory(event.category, limit, 0).then(result =>
              result.events.filter(e => e.id !== eventId),
            );
          }
          return [];
        }
        throw new Error(response.error || 'Failed to fetch related events');
      }

      const data = response.data;
      if (data) {
        return Array.isArray(data)
          ? data.map(this.transformEventToFrontend)
          : (data.events || []).map(this.transformEventToFrontend);
      }

      // Empty success — fall back to category
      const event = await this.getEventById(eventId);
      if (event) {
        return this.getEventsByCategory(event.category, limit, 0).then(result =>
          result.events.filter(e => e.id !== eventId),
        );
      }
      return [];
    } catch (error) {
      logger.error('❌ Error fetching related events:', error);
      // Fallback to category-based events
      try {
        const event = await this.getEventById(eventId);
        if (event) {
          return this.getEventsByCategory(event.category, limit, 0).then(result =>
            result.events.filter(e => e.id !== eventId),
          );
        }
      } catch (fallbackError) {
        logger.error('❌ Error in related events fallback:', fallbackError);
      }
      return [];
    }
  }

  /**
   * Get user's event bookings
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async getUserBookings(status?: string, limit = 20, offset = 0): Promise<{ bookings: UserBooking[], total: number, hasMore: boolean }> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = { limit, offset };
      if (status) params.status = status;

      const response = await apiClient.get<BackendUserBookingsData>('/events/my-bookings', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user bookings');
      }

      return {
        bookings: response.data?.bookings ?? [],
        total: response.data?.total ?? 0,
        hasMore: response.data?.hasMore ?? false,
      };
    } catch (error) {
      logger.error('❌ Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Confirm booking after payment
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async confirmBooking(bookingId: string, paymentIntentId?: string): Promise<{ success: boolean, message: string }> {
    try {
      const response = await apiClient.put<Record<string, unknown>>(
        `/events/bookings/${bookingId}/confirm`,
        { paymentIntentId } as Record<string, unknown>,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to confirm booking');
      }

      return {
        success: true,
        message: response.message || 'Booking confirmed successfully',
      };
    } catch (error) {
      logger.error('❌ Error confirming booking:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm booking',
      };
    }
  }

  /**
   * Cancel event booking
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async cancelBooking(bookingId: string): Promise<{ success: boolean, message: string }> {
    try {
      const response = await apiClient.delete<Record<string, unknown>>(`/events/bookings/${bookingId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel booking');
      }

      return {
        success: true,
        message: response.message || 'Booking cancelled successfully',
      };
    } catch (error) {
      logger.error('❌ Error cancelling booking:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel booking',
      };
    }
  }

  /**
   * Toggle event favorite
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async toggleEventFavorite(eventId: string): Promise<{ success: boolean, message: string, isFavorited?: boolean }> {
    try {
      const response = await apiClient.post<BackendFavoriteData>(`/events/${eventId}/favorite`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle favorite');
      }

      return {
        success: true,
        message: response.message || '',
        isFavorited: response.data?.isFavorited,
      };
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle favorite',
      };
    }
  }

  /**
   * Share event (sends auth token for reward eligibility)
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient (401 interceptor).
   */
  async shareEvent(eventId: string): Promise<{ success: boolean, message: string, reward?: { coinsAwarded: number } }> {
    try {
      const response = await apiClient.post<BackendShareRewardData>(`/events/${eventId}/share`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to share event');
      }

      return {
        success: true,
        message: response.message || '',
        reward: response.data?.reward || undefined,
      };
    } catch (error) {
      logger.error('❌ Error sharing event:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to share event',
      };
    }
  }

  /**
   * Transform backend event to frontend format
   */
  private transformEventToFrontend = (backendEvent: Record<string, unknown>): EventItem => {
    const ev = backendEvent as {
      _id?: string; title?: string; subtitle?: string; description?: string; image?: string;
      price?: { amount?: number; currency?: string; isFree?: boolean };
      isOnline?: boolean; location?: { name?: string }; date?: string; time?: string;
      category?: string; organizer?: { name?: string }; registrationRequired?: boolean;
      bookingUrl?: string; availableSlots?: Array<{ id: string; time: string; available: boolean; maxCapacity: number; bookedCount: number }>;
      rating?: number; reviewCount?: number; analytics?: { averageRating?: number; reviews?: number };
      cashback?: number;
    };
    return {
      id: ev._id ?? '',
      type: 'event',
      title: ev.title ?? '',
      subtitle: ev.subtitle || `${ev.price?.isFree ? 'Free' : `${ev.price?.currency || '₹'}${ev.price?.amount || 0}`} • ${ev.isOnline ? 'Online' : 'Venue'}`,
      description: ev.description ?? '',
      image: ev.image ?? '',
      price: {
        amount: ev.price?.amount || 0,
        currency: ev.price?.currency || '₹',
        isFree: ev.price?.isFree || false
      },
      location: ev.isOnline ? 'Online' : (ev.location?.name || 'Venue'),
      date: ev.date ? ev.date.split('T')[0] : '',
      time: ev.time || '',
      category: ev.category ?? '',
      organizer: ev.organizer?.name || 'Event Organizer',
      isOnline: ev.isOnline ?? false,
      registrationRequired: ev.registrationRequired ?? false,
      bookingUrl: ev.bookingUrl,
      availableSlots: ev.availableSlots,
      rating: ev.rating || ev.analytics?.averageRating || 0,
      reviewCount: ev.reviewCount || ev.analytics?.reviews || 0,
      cashback: ev.cashback || 0,
    };
  };

  /**
   * Force refresh backend availability check
   */
  async refreshBackendStatus(): Promise<boolean> {
    // Availability check removed - always return true
    // The actual fetch requests will handle errors
    return true;
  }

  /**
   * Get current backend status
   */
  getBackendStatus(): {
    available: boolean | null;
    lastChecked: Date | null;
    nextCheck: Date | null;
  } {
    return {
      available: this.backendAvailable,
      lastChecked: this.lastBackendCheck > 0 ? new Date(this.lastBackendCheck) : null,
      nextCheck: this.lastBackendCheck > 0
        ? new Date(this.lastBackendCheck + this.BACKEND_CHECK_INTERVAL)
        : null
    };
  }

  /**
   * Helper for authenticated requests
   */
  /**
   * BUG-FIX: authenticatedFetch replaced by direct apiClient calls in every
   * method below so the 401 interceptor fires on token expiry.
   * This method is kept as a private shim that delegates to apiClient.post()
   * to avoid re-writing call-sites that pass a body.
   */
  private async authenticatedFetch(path: string, options: RequestInit = {}): Promise<ApiResponse<Record<string, unknown>>> {
    const method = (options.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    let body: Record<string, unknown> | undefined;
    if (options.body) {
      try { body = JSON.parse(options.body as string); } catch { body = undefined; }
    }

    let response: ApiResponse<Record<string, unknown>>;
    if (method === 'GET') {
      response = await apiClient.get<Record<string, unknown>>(path);
    } else if (method === 'POST') {
      response = await apiClient.post<Record<string, unknown>>(path, body);
    } else if (method === 'PUT') {
      response = await apiClient.put<Record<string, unknown>>(path, body);
    } else if (method === 'DELETE') {
      response = await apiClient.delete<Record<string, unknown>>(path, body);
    } else {
      response = await apiClient.get<Record<string, unknown>>(path);
    }

    if (!response.success) {
      throw new Error(response.error || `Request failed: ${path}`);
    }
    return response;
  }

  /**
   * Get dynamic event categories from backend
   * Backend returns: { success, data: { categories: [{slug, name, icon, color, eventCount}] } }
   * or: { success, data: [{slug, name, icon, color}] }
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient.
   */
  async getCategories(featured?: boolean): Promise<BackendCategory[]> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = {};
      if (featured) params.featured = true;
      const response = await apiClient.get<BackendCategoryData>('/events/categories', params);

      const data = response.success ? { success: true, data: response.data } : { success: false };
      if (data.success) {
        // Handle both response shapes
        const cats: BackendCategory[] = Array.isArray(data.data)
          ? data.data
          : (data.data?.categories ?? []);
        // Normalize: ensure slug, name, icon, color exist
        return cats.map((c: BackendCategory) => ({
          _id: c._id,
          slug: c.slug || (c.name?.toLowerCase() ?? ''),
          name: c.name || (c.slug ?? ''),
          icon: c.icon || '🎫',
          color: c.color || '#1A3A52',
          eventCount: c.eventCount ?? c.count,
        }));
      }
      return [];
    } catch (error) {
      logger.error('[EventsApi] Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get global reward config (for "Ways to earn" display)
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient.
   */
  async getGlobalRewardConfig(): Promise<{
    rewards: Array<{ action: string; coins: number; description: string }>;
    totalPotential: number;
  } | null> {
    try {
      const response = await apiClient.get<BackendRewardConfigData>('/events/reward-config');
      return response.success ? (response.data ?? null) : null;
    } catch (error) {
      logger.error('[EventsApi] Error fetching reward config:', error);
      return null;
    }
  }

  /**
   * Get reward info for a specific event
   *
   * BUG-FIX: Migrated from raw fetch() to apiClient.
   */
  async getEventRewardInfo(eventId: string): Promise<{
    rewards: Array<{ action: string; coins: number; description: string }>;
    totalPotential: number;
  } | null> {
    try {
      const response = await apiClient.get<BackendRewardConfigData>(`/events/${eventId}/rewards`);
      return response.success ? (response.data ?? null) : null;
    } catch (error) {
      logger.error('[EventsApi] Error fetching event reward info:', error);
      return null;
    }
  }

  /**
   * Check in to event
   */
  async checkInToEvent(eventId: string, bookingId: string, method: string, location?: { lat: number; lng: number }): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await this.authenticatedFetch(`/events/${eventId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ bookingId, method, location }),
      });
      return response;
    } catch (error) {
      logger.error('[EventsApi] Error checking in:', error);
      throw error;
    }
  }

  /**
   * Get user's favorited events
   */
  async getMyFavorites(limit = 20, offset = 0): Promise<{ events: EventItem[]; total: number }> {
    try {
      const response = await this.authenticatedFetch(`/events/my-favorites?limit=${limit}&offset=${offset}`);
      const raw = response.data as { events?: EventItem[]; total?: number } | undefined;
      return { events: raw?.events ?? [], total: raw?.total ?? 0 };
    } catch (error) {
      logger.error('[EventsApi] Error fetching favorites:', error);
      return { events: [], total: 0 };
    }
  }

  /**
   * Get user's events overview (bookings + favorites + attended)
   */
  async getMyEvents(tab: 'upcoming' | 'past' | 'favorites' = 'upcoming'): Promise<Record<string, unknown>> {
    try {
      const response = await this.authenticatedFetch(`/events/my-events?tab=${tab}`);
      return (response.data as Record<string, unknown>) ?? { bookings: [], tab };
    } catch (error) {
      logger.error('[EventsApi] Error fetching my events:', error);
      return { bookings: [], tab };
    }
  }

  /**
   * Check if user has favorited an event
   *
   * BUG-FIX: Removed manual token guard; apiClient returns success:false when
   * unauthenticated so the boolean false fallback handles that case cleanly.
   */
  async isFavorited(eventId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<BackendFavoriteStatusData>(`/events/${eventId}/favorite-status`);
      return response.success && response.data?.isFavorited === true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const eventsApiService = new EventsApiService();

export default eventsApiService;
export { EventsApiService };

