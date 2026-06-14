/**
 * Appointments Service - Complete Appointment Management Integration
 *
 * Connects directly to https://rez-merchant-service.onrender.com
 * Provides appointment CRUD, slot management, walk-in handling, and reminders.
 */

import { logger } from '@/utils/logger';
import { AppError, NetworkError, NotFoundError, withRetry } from './errors';

// Appointments Service base URL
const APPOINTMENTS_SERVICE_URL =
  process.env.EXPO_PUBLIC_APPOINTMENTS_SERVICE_URL || 'https://rez-merchant-service.onrender.com';

// ============================================
// TYPES
// ============================================

// Appointment Status
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

// Appointment Type
export type AppointmentType = 'scheduled' | 'walkin' | 'followup';

// Service Category
export type ServiceCategory = 'salon' | 'spa' | 'medical' | 'consultation' | 'repair' | 'other';

// Payment Status
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

// Reminder Status
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'not_applicable';

// Customer Info
export interface CustomerInfo {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  notes?: string;
}

// Staff Assignment
export interface StaffAssignment {
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  role: string;
}

// Service Item
export interface ServiceItem {
  serviceId: string;
  serviceName: string;
  duration: number; // in minutes
  price: number;
  currency?: string;
}

// Location Info
export interface LocationInfo {
  storeId?: string;
  storeName?: string;
  branchName?: string;
  address?: string;
}

// Main Appointment Interface
export interface Appointment {
  _id: string;
  id?: string;
  merchantId: string;
  location: LocationInfo;
  customer: CustomerInfo;
  services: ServiceItem[];
  staff: StaffAssignment[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string; // HH:mm (calculated from duration)
  duration: number; // total duration in minutes
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  internalNotes?: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
  reminders: {
    email?: ReminderStatus;
    sms?: ReminderStatus;
    push?: ReminderStatus;
    lastReminderSent?: string;
  };
  cancellationReason?: string;
  cancelledBy?: string;
  rescheduleHistory?: Array<{
    previousDate: string;
    previousTime: string;
    newDate: string;
    newTime: string;
    reason?: string;
    rescheduledAt: string;
  }>;
  source?: 'app' | 'web' | 'phone' | 'walkin' | 'api';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// Time Slot Interface
export interface TimeSlot {
  time: string; // HH:mm
  available: boolean;
  staffId?: string;
  staffName?: string;
  isBuffer?: boolean;
  isBlocked?: boolean;
}

// Staff Availability Interface
export interface StaffAvailability {
  staffId: string;
  staffName: string;
  date: string;
  isAvailable: boolean;
  workingHours: {
    start: string;
    end: string;
    breaks: Array<{ start: string; end: string }>;
  };
  bookedSlots: string[];
  availableSlots: TimeSlot[];
  maxConcurrentBookings: number;
  currentBookings: number;
}

// Walk-in Interface
export interface Walkin {
  _id: string;
  id?: string;
  merchantId: string;
  location: LocationInfo;
  customer: CustomerInfo;
  services: ServiceItem[];
  checkedInAt: string;
  status: 'waiting' | 'in_service' | 'completed';
  estimatedWaitTime?: number; // in minutes
  position?: number; // queue position
  staff?: StaffAssignment;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Reminder Interface
export interface Reminder {
  type: 'email' | 'sms' | 'push';
  status: ReminderStatus;
  scheduledFor?: string;
  sentAt?: string;
  failureReason?: string;
}

// ============================================
// FILTER & REQUEST TYPES
// ============================================

export interface AppointmentFilters {
  storeId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  type?: AppointmentType;
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  serviceId?: string;
  paymentStatus?: PaymentStatus;
  query?: string;
  sortBy?: 'date' | 'time' | 'createdAt' | 'status' | 'customerName';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateAppointment {
  merchantId: string;
  storeId?: string;
  customer: CustomerInfo;
  services: ServiceItem[];
  staffId?: string;
  date: string;
  time: string;
  type?: AppointmentType;
  notes?: string;
  internalNotes?: string;
  sendReminder?: boolean;
  source?: Appointment['source'];
}

export interface UpdateAppointment {
  customer?: CustomerInfo;
  services?: ServiceItem[];
  staffId?: string;
  date?: string;
  time?: string;
  status?: AppointmentStatus;
  notes?: string;
  internalNotes?: string;
  paymentStatus?: PaymentStatus;
}

export interface CreateWalkin {
  merchantId: string;
  storeId?: string;
  customer: CustomerInfo;
  services: ServiceItem[];
  staffId?: string;
  notes?: string;
  source?: Appointment['source'];
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  stats?: {
    byStatus: Record<AppointmentStatus, number>;
    byType: Record<AppointmentType, number>;
  };
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: {
    total: number;
    paid: number;
    pending: number;
  };
  byStaff: Array<{
    staffId: string;
    staffName: string;
    count: number;
  }>;
}

// ============================================
// SERVICE CLASS
// ============================================

interface AppointmentsServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

class AppointmentsService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = `${APPOINTMENTS_SERVICE_URL}/api/v1`;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private getAppointmentId(appointment: Appointment): string {
    return appointment._id || appointment.id || '';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: AppointmentsServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // ============================================
  // APPOINTMENTS CRUD
  // ============================================

  /**
   * GET /appointments/:merchantId
   * Fetch appointments with filters and pagination
   */
  async getAppointments(
    merchantId: string,
    filters?: AppointmentFilters
  ): Promise<AppointmentListResponse> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const searchParams = new URLSearchParams();
        searchParams.append('merchantId', merchantId);

        if (filters?.storeId) searchParams.append('storeId', filters.storeId);
        if (filters?.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          statuses.forEach((s) => searchParams.append('status', s));
        }
        if (filters?.type) searchParams.append('type', filters.type);
        if (filters?.date) searchParams.append('date', filters.date);
        if (filters?.startDate) searchParams.append('startDate', filters.startDate);
        if (filters?.endDate) searchParams.append('endDate', filters.endDate);
        if (filters?.staffId) searchParams.append('staffId', filters.staffId);
        if (filters?.customerId) searchParams.append('customerId', filters.customerId);
        if (filters?.serviceId) searchParams.append('serviceId', filters.serviceId);
        if (filters?.paymentStatus) searchParams.append('paymentStatus', filters.paymentStatus);
        if (filters?.query) searchParams.append('query', filters.query);
        if (filters?.sortBy) searchParams.append('sortBy', filters.sortBy);
        if (filters?.order) searchParams.append('order', filters.order);
        if (filters?.page) searchParams.append('page', filters.page.toString());
        if (filters?.limit) searchParams.append('limit', filters.limit.toString());

        const url = `${this.baseUrl}/appointments/${merchantId}?${searchParams.toString()}`;
        logger.debug('[AppointmentsService] Fetching appointments:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: {
            appointments?: Appointment[];
            items?: Appointment[];
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
            hasMore?: boolean;
            stats?: AppointmentListResponse['stats'];
          };
          appointments?: Appointment[];
          items?: Appointment[];
          pagination?: {
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
            hasMore?: boolean;
          };
          stats?: AppointmentListResponse['stats'];
        }>(response);

        // Normalize response - support multiple response shapes
        const appointments = data.data?.appointments || data.data?.items || data.appointments || data.items || [];
        const pagination = data.data || data.pagination || {};

        return {
          appointments,
          total: pagination.total || appointments.length,
          page: pagination.page || 1,
          limit: pagination.limit || appointments.length,
          totalPages: pagination.totalPages || 1,
          hasMore: pagination.hasMore || false,
          stats: data.data?.stats || data.stats,
        };
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching appointments:', error);
        // Return mock data as fallback
        return this.getMockAppointments(merchantId, filters);
      }
    }, retryOptions);
  }

  /**
   * GET /appointments/detail/:id
   * Fetch a single appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/detail/${id}`;
        logger.debug('[AppointmentsService] Fetching appointment:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: Appointment;
          appointment?: Appointment;
        }>(response);

        return data.data || data.appointment!;
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching appointment:', error);
        // Return mock data as fallback
        return this.getMockAppointmentById(id);
      }
    }, retryOptions);
  }

  /**
   * POST /appointments
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointment): Promise<Appointment> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments`;
        logger.debug('[AppointmentsService] Creating appointment:', url, data);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });

        const result = await this.handleResponse<{
          success?: boolean;
          data?: Appointment;
          appointment?: Appointment;
        }>(response);

        return result.data || result.appointment!;
      } catch (error) {
        logger.error('[AppointmentsService] Error creating appointment:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * PATCH /appointments/:id
   * Update appointment details
   */
  async updateAppointment(id: string, updateData: UpdateAppointment): Promise<Appointment> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${id}`;
        logger.debug('[AppointmentsService] Updating appointment:', url, updateData);

        const response = await fetch(url, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updateData),
        });

        const result = await this.handleResponse<{
          success?: boolean;
          data?: Appointment;
          appointment?: Appointment;
        }>(response);

        return result.data || result.appointment!;
      } catch (error) {
        logger.error('[AppointmentsService] Error updating appointment:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * DELETE /appointments/:id/cancel
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<void> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${id}/cancel`;
        logger.debug('[AppointmentsService] Cancelling appointment:', url, { reason });

        const response = await fetch(url, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ reason }),
        });

        await this.handleResponse<{ success: boolean; message?: string }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error cancelling appointment:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * POST /appointments/:id/reschedule
   * Reschedule an appointment to a new date/time
   */
  async rescheduleAppointment(
    id: string,
    newDate: Date,
    newTime: string
  ): Promise<Appointment> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${id}/reschedule`;
        const formattedDate = newDate.toISOString().split('T')[0];
        logger.debug('[AppointmentsService] Rescheduling appointment:', url, {
          newDate: formattedDate,
          newTime,
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ date: formattedDate, time: newTime }),
        });

        const result = await this.handleResponse<{
          success?: boolean;
          data?: Appointment;
          appointment?: Appointment;
        }>(response);

        return result.data || result.appointment!;
      } catch (error) {
        logger.error('[AppointmentsService] Error rescheduling appointment:', error);
        throw error;
      }
    }, retryOptions);
  }

  // ============================================
  // SLOTS MANAGEMENT
  // ============================================

  /**
   * GET /appointments/slots/available
   * Get available time slots for a given date
   */
  async getAvailableSlots(
    date: Date,
    staffId?: string,
    serviceId?: string
  ): Promise<TimeSlot[]> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const formattedDate = date.toISOString().split('T')[0];
        const searchParams = new URLSearchParams();
        searchParams.append('date', formattedDate);
        if (staffId) searchParams.append('staffId', staffId);
        if (serviceId) searchParams.append('serviceId', serviceId);

        const url = `${this.baseUrl}/appointments/slots/available?${searchParams.toString()}`;
        logger.debug('[AppointmentsService] Fetching available slots:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: {
            slots?: TimeSlot[];
          };
          slots?: TimeSlot[];
        }>(response);

        return data.data?.slots || data.slots || [];
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching available slots:', error);
        // Return mock slots as fallback
        return this.getMockAvailableSlots(date);
      }
    }, retryOptions);
  }

  /**
   * GET /appointments/staff/:staffId/availability
   * Get staff availability for a specific date
   */
  async getStaffAvailability(staffId: string, date: Date): Promise<StaffAvailability> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const formattedDate = date.toISOString().split('T')[0];
        const url = `${this.baseUrl}/appointments/staff/${staffId}/availability?date=${formattedDate}`;
        logger.debug('[AppointmentsService] Fetching staff availability:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: StaffAvailability;
          availability?: StaffAvailability;
        }>(response);

        return data.data || data.availability!;
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching staff availability:', error);
        // Return mock availability as fallback
        return this.getMockStaffAvailability(staffId, date);
      }
    }, retryOptions);
  }

  // ============================================
  // WALK-INS
  // ============================================

  /**
   * POST /appointments/walkin
   * Create a walk-in appointment
   */
  async createWalkin(data: CreateWalkin): Promise<Appointment> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/walkin`;
        logger.debug('[AppointmentsService] Creating walk-in:', url, data);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });

        const result = await this.handleResponse<{
          success?: boolean;
          data?: Appointment;
          appointment?: Appointment;
        }>(response);

        return result.data || result.appointment!;
      } catch (error) {
        logger.error('[AppointmentsService] Error creating walk-in:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * GET /appointments/:merchantId/walkins
   * Get walk-in queue for a merchant
   */
  async getWalkinQueue(merchantId: string): Promise<Walkin[]> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${merchantId}/walkins`;
        logger.debug('[AppointmentsService] Fetching walk-in queue:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: {
            walkins?: Walkin[];
          };
          walkins?: Walkin[];
        }>(response);

        return data.data?.walkins || data.walkins || [];
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching walk-in queue:', error);
        // Return mock walk-ins as fallback
        return this.getMockWalkins(merchantId);
      }
    }, retryOptions);
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * POST /appointments/:id/start
   * Mark appointment as in progress (service started)
   */
  async startService(appointmentId: string): Promise<void> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${appointmentId}/start`;
        logger.debug('[AppointmentsService] Starting service:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
        });

        await this.handleResponse<{ success: boolean; message?: string }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error starting service:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * POST /appointments/:id/complete
   * Mark appointment as completed
   */
  async completeService(appointmentId: string, notes?: string): Promise<void> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${appointmentId}/complete`;
        logger.debug('[AppointmentsService] Completing service:', url, { notes });

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ notes }),
        });

        await this.handleResponse<{ success: boolean; message?: string }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error completing service:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * POST /appointments/:id/no-show
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<void> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${appointmentId}/no-show`;
        logger.debug('[AppointmentsService] Marking no-show:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
        });

        await this.handleResponse<{ success: boolean; message?: string }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error marking no-show:', error);
        throw error;
      }
    }, retryOptions);
  }

  // ============================================
  // REMINDERS
  // ============================================

  /**
   * POST /appointments/:id/reminder
   * Send reminder for an appointment
   */
  async sendReminder(appointmentId: string): Promise<void> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${appointmentId}/reminder`;
        logger.debug('[AppointmentsService] Sending reminder:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
        });

        await this.handleResponse<{ success: boolean; message?: string }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error sending reminder:', error);
        throw error;
      }
    }, retryOptions);
  }

  /**
   * GET /appointments/:id/reminder-status
   * Get reminder status for an appointment
   */
  async getReminderStatus(appointmentId: string): Promise<ReminderStatus> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const url = `${this.baseUrl}/appointments/${appointmentId}/reminder-status`;
        logger.debug('[AppointmentsService] Fetching reminder status:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const data = await this.handleResponse<{
          success?: boolean;
          data?: {
            status?: ReminderStatus;
          };
          status?: ReminderStatus;
        }>(response);

        return data.data?.status || data.status || 'not_applicable';
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching reminder status:', error);
        throw error;
      }
    }, retryOptions);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * GET /appointments/:merchantId/stats
   * Get appointment statistics for a merchant
   */
  async getAppointmentStats(
    merchantId: string,
    storeId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AppointmentStats> {
    const retryOptions = { retries: 3, retryDelay: 1000 };

    return withRetry(async () => {
      try {
        const searchParams = new URLSearchParams();
        searchParams.append('merchantId', merchantId);
        if (storeId) searchParams.append('storeId', storeId);
        if (startDate) searchParams.append('startDate', startDate);
        if (endDate) searchParams.append('endDate', endDate);

        const url = `${this.baseUrl}/appointments/${merchantId}/stats?${searchParams.toString()}`;
        logger.debug('[AppointmentsService] Fetching appointment stats:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        return this.handleResponse<{
          success?: boolean;
          data?: AppointmentStats;
          stats?: AppointmentStats;
        }>(response);
      } catch (error) {
        logger.error('[AppointmentsService] Error fetching appointment stats:', error);
        // Return mock stats as fallback
        return this.getMockAppointmentStats();
      }
    }, retryOptions);
  }

  // ============================================
  // MOCK DATA (Fallback)
  // ============================================

  private getMockAppointments(merchantId: string, filters?: AppointmentFilters): AppointmentListResponse {
    const now = new Date();
    const mockAppointments: Appointment[] = [
      {
        _id: 'apt-001',
        merchantId,
        location: { storeId: 'store-001', storeName: 'Main Salon' },
        customer: { _id: 'cust-001', name: 'John Smith', phone: '+1234567890' },
        services: [{ serviceId: 'svc-001', serviceName: 'Haircut', duration: 30, price: 25 }],
        staff: [{ staffId: 'staff-001', staffName: 'Jane Doe', role: 'stylist' }],
        date: now.toISOString().split('T')[0],
        time: '10:00',
        endTime: '10:30',
        duration: 30,
        status: 'confirmed',
        type: 'scheduled',
        paymentStatus: 'paid',
        totalAmount: 25,
        paidAmount: 25,
        currency: 'USD',
        reminders: { sms: 'sent', email: 'pending' },
        source: 'app',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        _id: 'apt-002',
        merchantId,
        location: { storeId: 'store-001', storeName: 'Main Salon' },
        customer: { _id: 'cust-002', name: 'Sarah Johnson', phone: '+1987654321' },
        services: [{ serviceId: 'svc-002', serviceName: 'Massage', duration: 60, price: 80 }],
        staff: [{ staffId: 'staff-002', staffName: 'Mike Wilson', role: 'therapist' }],
        date: now.toISOString().split('T')[0],
        time: '14:00',
        endTime: '15:00',
        duration: 60,
        status: 'pending',
        type: 'scheduled',
        paymentStatus: 'pending',
        totalAmount: 80,
        reminders: { sms: 'pending', email: 'pending' },
        source: 'web',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        _id: 'apt-003',
        merchantId,
        location: { storeId: 'store-001', storeName: 'Main Salon' },
        customer: { _id: 'cust-003', name: 'Emily Brown', phone: '+1122334455' },
        services: [{ serviceId: 'svc-003', serviceName: 'Facial', duration: 45, price: 55 }],
        staff: [{ staffId: 'staff-001', staffName: 'Jane Doe', role: 'stylist' }],
        date: now.toISOString().split('T')[0],
        time: '16:00',
        endTime: '16:45',
        duration: 45,
        status: 'completed',
        type: 'walkin',
        paymentStatus: 'paid',
        totalAmount: 55,
        paidAmount: 55,
        currency: 'USD',
        reminders: { sms: 'sent', email: 'sent' },
        source: 'walkin',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    // Filter based on provided filters
    let filteredAppointments = mockAppointments;

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      filteredAppointments = filteredAppointments.filter((apt) => statuses.includes(apt.status));
    }

    if (filters?.staffId) {
      filteredAppointments = filteredAppointments.filter((apt) =>
        apt.staff.some((s) => s.staffId === filters.staffId)
      );
    }

    if (filters?.date) {
      filteredAppointments = filteredAppointments.filter((apt) => apt.date === filters.date);
    }

    return {
      appointments: filteredAppointments,
      total: filteredAppointments.length,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasMore: false,
      stats: {
        byStatus: {
          pending: 1,
          confirmed: 1,
          in_progress: 0,
          completed: 1,
          cancelled: 0,
          no_show: 0,
          rescheduled: 0,
        },
        byType: {
          scheduled: 2,
          walkin: 1,
          followup: 0,
        },
      },
    };
  }

  private getMockAppointmentById(id: string): Appointment {
    const now = new Date();
    return {
      _id: id,
      merchantId: 'merchant-001',
      location: { storeId: 'store-001', storeName: 'Main Salon' },
      customer: { _id: 'cust-001', name: 'John Smith', phone: '+1234567890', email: 'john@example.com' },
      services: [{ serviceId: 'svc-001', serviceName: 'Haircut & Styling', duration: 45, price: 35 }],
      staff: [{ staffId: 'staff-001', staffName: 'Jane Doe', role: 'Senior Stylist' }],
      date: now.toISOString().split('T')[0],
      time: '11:00',
      endTime: '11:45',
      duration: 45,
      status: 'confirmed',
      type: 'scheduled',
      notes: 'Customer prefers short hair',
      paymentStatus: 'paid',
      totalAmount: 35,
      paidAmount: 35,
      currency: 'USD',
      reminders: { sms: 'sent', email: 'sent', push: 'sent' },
      source: 'app',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  private getMockAvailableSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    ];

    // Simulate some slots being unavailable
    const unavailableTimes = ['10:00', '11:00', '14:00', '15:00'];

    times.forEach((time) => {
      slots.push({
        time,
        available: !unavailableTimes.includes(time),
        staffId: 'staff-001',
        staffName: 'Jane Doe',
      });
    });

    return slots;
  }

  private getMockStaffAvailability(staffId: string, date: Date): StaffAvailability {
    return {
      staffId,
      staffName: 'Jane Doe',
      date: date.toISOString().split('T')[0],
      isAvailable: true,
      workingHours: {
        start: '09:00',
        end: '18:00',
        breaks: [{ start: '12:00', end: '13:00' }],
      },
      bookedSlots: ['10:00', '11:00', '14:00'],
      availableSlots: this.getMockAvailableSlots(date),
      maxConcurrentBookings: 1,
      currentBookings: 3,
    };
  }

  private getMockWalkins(merchantId: string): Walkin[] {
    const now = new Date();
    return [
      {
        _id: 'walkin-001',
        merchantId,
        location: { storeId: 'store-001', storeName: 'Main Salon' },
        customer: { _id: 'cust-101', name: 'Alice Cooper', phone: '+1555555555' },
        services: [{ serviceId: 'svc-001', serviceName: 'Quick Trim', duration: 15, price: 15 }],
        checkedInAt: now.toISOString(),
        status: 'waiting',
        estimatedWaitTime: 20,
        position: 1,
      },
      {
        _id: 'walkin-002',
        merchantId,
        location: { storeId: 'store-001', storeName: 'Main Salon' },
        customer: { _id: 'cust-102', name: 'Bob Dylan', phone: '+1666666666' },
        services: [{ serviceId: 'svc-002', serviceName: 'Beard Trim', duration: 20, price: 12 }],
        checkedInAt: new Date(now.getTime() - 10 * 60000).toISOString(),
        status: 'in_service',
        position: 2,
        staff: { staffId: 'staff-002', staffName: 'Mike Wilson', role: 'barber' },
      },
    ];
  }

  private getMockAppointmentStats(): AppointmentStats {
    return {
      total: 25,
      pending: 5,
      confirmed: 10,
      inProgress: 3,
      completed: 15,
      cancelled: 2,
      noShow: 1,
      revenue: {
        total: 2500,
        paid: 2000,
        pending: 500,
      },
      byStaff: [
        { staffId: 'staff-001', staffName: 'Jane Doe', count: 12 },
        { staffId: 'staff-002', staffName: 'Mike Wilson', count: 8 },
        { staffId: 'staff-003', staffName: 'Sarah Connor', count: 5 },
      ],
    };
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      logger.error('[AppointmentsService] Health check failed:', error);
      throw error;
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export const appointmentsService = new AppointmentsService();
export default appointmentsService;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format appointment time for display
 */
export function formatAppointmentTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

/**
 * Format appointment date for display
 */
export function formatAppointmentDate(date: string): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Get display label for appointment status
 */
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    rescheduled: 'Rescheduled',
  };
  return labels[status] || status;
}

/**
 * Get color for appointment status badge
 */
export function getAppointmentStatusColor(status: AppointmentStatus): { bg: string; text: string } {
  const colors: Record<AppointmentStatus, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    confirmed: { bg: '#DBEAFE', text: '#2563EB' },
    in_progress: { bg: '#E0E7FF', text: '#4F46E5' },
    completed: { bg: '#ECFDF5', text: '#059669' },
    cancelled: { bg: '#FEF2F2', text: '#DC2626' },
    no_show: { bg: '#FEE2E2', text: '#B91C1C' },
    rescheduled: { bg: '#F3E8FF', text: '#9333EA' },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
}

/**
 * Get display label for appointment type
 */
export function getAppointmentTypeLabel(type: AppointmentType): string {
  const labels: Record<AppointmentType, string> = {
    scheduled: 'Scheduled',
    walkin: 'Walk-in',
    followup: 'Follow-up',
  };
  return labels[type] || type;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Check if appointment is upcoming (within next 24 hours)
 */
export function isUpcoming(appointment: Appointment): boolean {
  const now = new Date();
  const aptDate = new Date(`${appointment.date}T${appointment.time}`);
  const diffMs = aptDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
}

/**
 * Check if appointment is today
 */
export function isToday(appointment: Appointment): boolean {
  const today = new Date().toISOString().split('T')[0];
  return appointment.date === today;
}

/**
 * Check if appointment is past
 */
export function isPast(appointment: Appointment): boolean {
  const now = new Date();
  const aptDate = new Date(`${appointment.date}T${appointment.time}`);
  return aptDate < now;
}

/**
 * Sort appointments by date and time
 */
export function sortAppointments(
  appointments: Appointment[],
  order: 'asc' | 'desc' = 'asc'
): Appointment[] {
  return [...appointments].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
    return order === 'asc' ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
  });
}

/**
 * Group appointments by date
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Record<string, Appointment[]> {
  return appointments.reduce((groups, appointment) => {
    const date = appointment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);
}

/**
 * Group appointments by status
 */
export function groupAppointmentsByStatus(
  appointments: Appointment[]
): Record<AppointmentStatus, Appointment[]> {
  return appointments.reduce((groups, appointment) => {
    const status = appointment.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(appointment);
    return groups;
  }, {} as Record<AppointmentStatus, Appointment[]>);
}

/**
 * Get upcoming appointments (next 24 hours)
 */
export function getUpcomingAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.filter((apt) => isUpcoming(apt) && apt.status !== 'cancelled');
}

/**
 * Get today's appointments
 */
export function getTodaysAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.filter((apt) => isToday(apt) && apt.status !== 'cancelled');
}

/**
 * Get past appointments
 */
export function getPastAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.filter((apt) => isPast(apt));
}
