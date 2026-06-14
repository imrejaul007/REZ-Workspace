// REZ Schedule JavaScript/TypeScript SDK
// Universal Scheduling Platform SDK

import crypto from 'crypto';

// Types
export interface ReZScheduleConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  webhookSecret?: string;
}

export interface EventType {
  id: string;
  slug: string;
  title: string;
  description?: string;
  duration: number;
  locationType: 'IN_PERSON' | 'PHONE_CALL' | 'VIDEO_CALL' | 'CUSTOM_LINK';
  price?: number;
  currency?: string;
  requiresConfirmation: boolean;
  user?: { name: string; username: string };
  customQuestions?: CustomQuestion[];
}

export interface CustomQuestion {
  id: string;
  question: string;
  type: 'TEXT' | 'TEXTAREA' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'RADIO';
  required: boolean;
  options?: string[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  uid: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  eventTypeId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  attendee?: { name: string; email: string; phone?: string };
  eventType?: EventType;
}

export interface CreateBookingInput {
  eventTypeId: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  timezone?: string;
  responses?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface CreateEventTypeInput {
  slug: string;
  title: string;
  description?: string;
  duration: number;
  bufferTime?: number;
  locationType?: 'IN_PERSON' | 'PHONE_CALL' | 'VIDEO_CALL' | 'CUSTOM_LINK';
  locationAddress?: string;
  meetingUrl?: string;
  phoneNumber?: string;
  requiresConfirmation?: boolean;
  disableGuests?: boolean;
  maxBookingsPerDay?: number;
  minNoticeMinutes?: number;
  slotInterval?: number;
  price?: number;
  currency?: string;
  paidBooking?: boolean;
  customQuestions?: {
    question: string;
    type: string;
    required?: boolean;
    options?: string[];
  }[];
}

export interface Webhook {
  id: string;
  url: string;
  triggers: string[];
  active: boolean;
  createdAt: string;
}

// Custom Error Classes
export class ReZScheduleError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ReZScheduleError';
  }
}

export class ValidationError extends ReZScheduleError {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ReZScheduleError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

// API Response Type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// HTTP Client
class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retries: number;

  constructor(config: ReZScheduleConfig) {
    this.baseUrl = config.baseUrl || 'https://api.rez.money/schedule';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        if (response.status === 429 && retryCount < this.retries) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1000', 10);
          await new Promise(r => setTimeout(r, retryAfter));
          return this.request(method, endpoint, body, retryCount + 1);
        }

        if (response.status === 400) {
          throw new ValidationError(data.error || 'Validation failed');
        }

        throw new ReZScheduleError(
          data.error || 'Request failed',
          'API_ERROR',
          response.status
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ReZScheduleError) {
        throw error;
      }
      throw new ReZScheduleError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR'
      );
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

// Event Types API
export class EventTypesAPI {
  constructor(private http: HttpClient) {}

  async list(): Promise<EventType[]> {
    return this.http.get<EventType[]>('/api/event-types');
  }

  async get(id: string): Promise<EventType> {
    return this.http.get<EventType>(`/api/event-types/${id}`);
  }

  async getPublic(username: string, slug: string): Promise<EventType> {
    return this.http.get<EventType>(`/api/event-types/public/${username}/${slug}`);
  }

  async create(data: CreateEventTypeInput): Promise<EventType> {
    return this.http.post<EventType>('/api/event-types', data);
  }

  async update(id: string, data: Partial<CreateEventTypeInput>): Promise<EventType> {
    return this.http.put<EventType>(`/api/event-types/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.http.delete<void>(`/api/event-types/${id}`);
  }

  async toggle(id: string): Promise<EventType> {
    return this.http.patch<EventType>(`/api/event-types/${id}/toggle`);
  }
}

// Availability API
export class AvailabilityAPI {
  constructor(private http: HttpClient) {}

  async get(params: {
    username: string;
    slug: string;
    startDate: string;
    endDate: string;
    guestTimezone?: string;
  }): Promise<{ slots: TimeSlot[] }> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.guestTimezone && { guestTimezone: params.guestTimezone }),
    }).toString();

    return this.http.get<{ slots: TimeSlot[] }>(
      `/api/availability/${params.username}/${params.slug}?${query}`
    );
  }

  async getForEventType(
    eventTypeId: string,
    params: { startDate: string; endDate: string; guestTimezone?: string }
  ): Promise<{ slots: TimeSlot[] }> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.guestTimezone && { guestTimezone: params.guestTimezone }),
    }).toString();

    return this.http.get<{ slots: TimeSlot[] }>(
      `/api/event-types/${eventTypeId}/availability?${query}`
    );
  }

  async check(params: {
    eventTypeId: string;
    startTime: string;
    endTime: string;
    timezone?: string;
  }): Promise<{ available: boolean }> {
    return this.http.post<{ available: boolean }>('/api/availability/check', {
      eventTypeId: params.eventTypeId,
      startTime: params.startTime,
      endTime: params.endTime,
      timezone: params.timezone || 'Asia/Kolkata',
    });
  }
}

// Bookings API
export class BookingsAPI {
  constructor(private http: HttpClient) {}

  async list(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Booking[]; total: number; pages: number }> {
    const query = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          )
        ).toString()
      : '';

    return this.http.get<{ bookings: Booking[]; total: number; pages: number }>(
      `/api/bookings${query}`
    );
  }

  async get(uid: string): Promise<Booking> {
    return this.http.get<Booking>(`/api/bookings/${uid}`);
  }

  async create(data: CreateBookingInput): Promise<Booking> {
    return this.http.post<Booking>('/api/bookings', data);
  }

  async cancel(
    uid: string,
    params?: { reason?: string; notifyHost?: boolean; notifyGuest?: boolean }
  ): Promise<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${uid}/cancel`, params || {});
  }

  async reschedule(
    uid: string,
    params: { newStartTime: string; newEndTime: string }
  ): Promise<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${uid}/reschedule`, params);
  }

  async confirm(uid: string): Promise<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${uid}/confirm`);
  }

  async complete(uid: string): Promise<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${uid}/complete`);
  }

  async markNoShow(uid: string): Promise<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${uid}/no-show`);
  }
}

// Users API
export class UsersAPI {
  constructor(private http: HttpClient) {}

  async me(): Promise<{
    id: string;
    username: string;
    name: string;
    email: string;
    timeZone: string;
    bio?: string;
    avatarUrl?: string;
  }> {
    return this.http.get('/api/users/me');
  }

  async update(data: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    timeZone?: string;
    weekStartDay?: number;
  }): Promise<unknown> {
    return this.http.patch('/api/users/me', data);
  }

  async getPublic(username: string): Promise<{
    username: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    eventTypes: EventType[];
  }> {
    return this.http.get(`/api/users/${username}`);
  }
}

// Webhooks API
export class WebhooksAPI {
  constructor(private http: HttpClient) {}

  async list(): Promise<Webhook[]> {
    return this.http.get<Webhook[]>('/api/webhooks');
  }

  async create(params: {
    url: string;
    triggers: string[];
    settings?: Record<string, unknown>;
  }): Promise<{ id: string; secret: string }> {
    return this.http.post<{ id: string; secret: string }>('/api/webhooks', params);
  }

  async get(id: string): Promise<Webhook> {
    return this.http.get<Webhook>(`/api/webhooks/${id}`);
  }

  async delete(id: string): Promise<void> {
    return this.http.delete<void>(`/api/webhooks/${id}`);
  }

  async getDeliveries(
    id: string,
    params?: { limit?: number; status?: string }
  ): Promise<unknown[]> {
    const query = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          )
        ).toString()
      : '';
    return this.http.get(`/api/webhooks/${id}/deliveries${query}`);
  }

  verifySignature(payload: string, signature: string, secret?: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret || '')
      .update(payload, 'utf8')
      .digest('hex');

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  }
}

// Seats API
export class SeatsAPI {
  constructor(private http: HttpClient) {}

  async getAvailable(eventTypeId: string, date: string): Promise<{
    totalCapacity: number;
    booked: number;
    available: number;
  }> {
    return this.http.get(
      `/api/seats/${eventTypeId}/${date}`
    );
  }

  async hold(params: {
    eventTypeId: string;
    startTime: string;
    endTime: string;
    heldBy: string;
  }): Promise<{ seatId: string; expiresAt: string }> {
    return this.http.post('/api/seats/hold', params);
  }

  async release(seatId: string): Promise<void> {
    return this.http.delete<void>(`/api/seats/release/${seatId}`);
  }
}

// Waiting List API
export class WaitingListAPI {
  constructor(private http: HttpClient) {}

  async join(params: {
    eventTypeId: string;
    requestedStart: string;
    requestedEnd: string;
    email: string;
    name: string;
    phone?: string;
  }): Promise<{ position: number; waitingListId: string }> {
    return this.http.post('/api/waiting-list', params);
  }

  async getPosition(waitingListId: string): Promise<{ position: number }> {
    return this.http.get(`/api/waiting-list/position/${waitingListId}`);
  }

  async leave(waitingListId: string): Promise<void> {
    return this.http.delete<void>(`/api/waiting-list/${waitingListId}`);
  }
}

// Payments API
export class PaymentsAPI {
  constructor(private http: HttpClient) {}

  async createCheckout(bookingId: string): Promise<{ sessionId: string; url: string }> {
    return this.http.post('/api/payments/checkout', { bookingId });
  }

  async getStatus(bookingId: string): Promise<{
    bookingUid: string;
    paymentStatus: string;
    amount?: number;
    currency?: string;
  }> {
    return this.http.get(`/api/payments/${bookingId}`);
  }

  async createRefund(
    bookingId: string,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<{ refundId: string; status: string }> {
    return this.http.post('/api/payments/refund', { bookingId, reason });
  }
}

// Main SDK Class
export class ReZSchedule {
  public eventTypes: EventTypesAPI;
  public availability: AvailabilityAPI;
  public bookings: BookingsAPI;
  public users: UsersAPI;
  public webhooks: WebhooksAPI;
  public seats: SeatsAPI;
  public waitingList: WaitingListAPI;
  public payments: PaymentsAPI;

  private http: HttpClient;

  constructor(config: ReZScheduleConfig) {
    this.http = new HttpClient(config);
    this.eventTypes = new EventTypesAPI(this.http);
    this.availability = new AvailabilityAPI(this.http);
    this.bookings = new BookingsAPI(this.http);
    this.users = new UsersAPI(this.http);
    this.webhooks = new WebhooksAPI(this.http);
    this.seats = new SeatsAPI(this.http);
    this.waitingList = new WaitingListAPI(this.http);
    this.payments = new PaymentsAPI(this.http);
  }

  // Widget initialization for browsers
  static initWidget(config: {
    container: string | HTMLElement;
    username: string;
    slug: string;
    theme?: 'light' | 'dark';
    primaryColor?: string;
    onBookingComplete?: (booking: Booking) => void;
    onError?: (error: Error) => void;
  }): void {
    const container =
      typeof config.container === 'string'
        ? document.querySelector(config.container)
        : config.container;

    if (!container) {
      throw new Error('Widget container not found');
    }

    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.rez.money/schedule/widget.js';
    script.onload = () => {
      (window as unknown as { ReZScheduleWidget: { init: (c: unknown) => void } }).ReZScheduleWidget?.init({
        ...config,
        apiBase: 'https://api.rez.money/schedule',
      });
    };
    document.head.appendChild(script);
  }
}

// React exports
export { ReZSchedule as default, ReZScheduleError, ValidationError, RateLimitError };

// Named exports for convenience
export const createClient = (config: ReZScheduleConfig) => new ReZSchedule(config);
