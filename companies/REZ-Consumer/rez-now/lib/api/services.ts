/**
 * Services Catalog API client for appointment-based businesses.
 *
 * Services Endpoints:
 * GET    /rez-now-services/:storeId              - List all services
 * POST   /rez-now-services/:storeId             - Create a new service
 * GET    /rez-now-services/:storeId/:serviceId   - Get a specific service
 * PUT    /rez-now-services/:storeId/:serviceId   - Update a service
 * DELETE /rez-now-services/:storeId/:serviceId  - Delete a service
 *
 * Appointments Endpoints:
 * GET    /rez-now-services/appointments/:storeId    - List appointments
 * POST   /rez-now-services/appointments             - Create appointment
 * GET    /rez-now-services/appointments/:id        - Get appointment
 * PATCH  /rez-now-services/appointments/:id        - Update appointment
 * DELETE /rez-now-services/appointments/:id        - Cancel appointment
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ServiceStaff {
  id: string;
  name: string;
}

export interface Service {
  _id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // minutes
  category: string;
  staff: ServiceStaff[];
  images: string[];
  beforeAfter?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  staff?: string[];
  images?: string[];
  beforeAfter?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
  staff?: string[];
  images?: string[];
  beforeAfter?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  _id: string;
  serviceId: Service | string;
  storeId: string;
  staffId: ServiceStaff | string;
  customerId: string;
  dateTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  serviceId: string;
  storeId: string;
  staffId: string;
  customerId: string;
  dateTime: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  dateTime?: string;
  notes?: string;
}

export interface AppointmentListParams {
  status?: AppointmentStatus;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

// ── Services API Functions ─────────────────────────────────────────────────────

/**
 * List all services for a store.
 */
export async function getServices(
  storeId: string,
  params?: { category?: string; active?: boolean }
): Promise<Service[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.active !== undefined) queryParams.set('active', String(params.active));

    const { data } = await authClient.get(`/rez-now-services/${storeId}?${queryParams}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch services');
    return data.data as Service[];
  } catch (error) {
    logger.error('[services] Failed to fetch services:', { error });
    return [];
  }
}

/**
 * Get a specific service.
 */
export async function getService(storeId: string, serviceId: string): Promise<Service | null> {
  try {
    const { data } = await authClient.get(`/rez-now-services/${storeId}/${serviceId}`);
    if (!data.success) throw new Error(data.message || 'Service not found');
    return data.data as Service;
  } catch (error) {
    logger.error('[services] Failed to fetch service:', { error });
    return null;
  }
}

/**
 * Create a new service.
 */
export async function createService(
  storeId: string,
  service: CreateServiceRequest
): Promise<Service | null> {
  try {
    const { data } = await authClient.post(`/rez-now-services/${storeId}`, service);
    if (!data.success) throw new Error(data.message || 'Failed to create service');
    return data.data as Service;
  } catch (error) {
    logger.error('[services] Failed to create service:', { error });
    return null;
  }
}

/**
 * Update a service.
 */
export async function updateService(
  storeId: string,
  serviceId: string,
  updates: UpdateServiceRequest
): Promise<Service | null> {
  try {
    const { data } = await authClient.put(`/rez-now-services/${storeId}/${serviceId}`, updates);
    if (!data.success) throw new Error(data.message || 'Failed to update service');
    return data.data as Service;
  } catch (error) {
    logger.error('[services] Failed to update service:', { error });
    return null;
  }
}

/**
 * Delete a service (soft delete).
 */
export async function deleteService(storeId: string, serviceId: string): Promise<boolean> {
  try {
    const { data } = await authClient.delete(`/rez-now-services/${storeId}/${serviceId}`);
    if (!data.success) throw new Error(data.message || 'Failed to delete service');
    return true;
  } catch (error) {
    logger.error('[services] Failed to delete service:', { error });
    return false;
  }
}

// ── Appointments API Functions ─────────────────────────────────────────────────

/**
 * List appointments for a store.
 */
export async function getAppointments(
  storeId: string,
  params?: AppointmentListParams
): Promise<Appointment[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.staffId) queryParams.set('staffId', params.staffId);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.skip) queryParams.set('skip', String(params.skip));

    const { data } = await authClient.get(
      `/rez-now-services/appointments/${storeId}?${queryParams}`
    );
    if (!data.success) throw new Error(data.message || 'Failed to fetch appointments');
    return data.data as Appointment[];
  } catch (error) {
    logger.error('[services] Failed to fetch appointments:', { error });
    return [];
  }
}

/**
 * Get a specific appointment.
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const { data } = await authClient.get(`/rez-now-services/appointments/${appointmentId}`);
    if (!data.success) throw new Error(data.message || 'Appointment not found');
    return data.data as Appointment;
  } catch (error) {
    logger.error('[services] Failed to fetch appointment:', { error });
    return null;
  }
}

/**
 * Create an appointment.
 */
export async function createAppointment(
  appointment: CreateAppointmentRequest
): Promise<Appointment | null> {
  try {
    const { data } = await authClient.post('/rez-now-services/appointments', appointment);
    if (!data.success) throw new Error(data.message || 'Failed to create appointment');
    return data.data as Appointment;
  } catch (error) {
    logger.error('[services] Failed to create appointment:', { error });
    return null;
  }
}

/**
 * Update an appointment.
 */
export async function updateAppointment(
  appointmentId: string,
  updates: UpdateAppointmentRequest
): Promise<Appointment | null> {
  try {
    const { data } = await authClient.patch(
      `/rez-now-services/appointments/${appointmentId}`,
      updates
    );
    if (!data.success) throw new Error(data.message || 'Failed to update appointment');
    return data.data as Appointment;
  } catch (error) {
    logger.error('[services] Failed to update appointment:', { error });
    return null;
  }
}

/**
 * Cancel an appointment.
 */
export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { data } = await authClient.delete(`/rez-now-services/appointments/${appointmentId}`);
    if (!data.success) throw new Error(data.message || 'Failed to cancel appointment');
    return true;
  } catch (error) {
    logger.error('[services] Failed to cancel appointment:', { error });
    return false;
  }
}

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Group services by category.
 */
export function groupServicesByCategory(services: Service[]): Record<string, Service[]> {
  return services.reduce((groups, service) => {
    const category = service.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, Service[]>);
}

/**
 * Calculate appointment end time based on service duration.
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  return new Date(startTime.getTime() + durationMinutes * 60000);
}

/**
 * Format appointment time for display.
 */
export function formatAppointmentTime(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format appointment date for display.
 */
export function formatAppointmentDate(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get status color for UI.
 */
export function getStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    completed: '#6B7280',
    cancelled: '#EF4444',
  };
  return colors[status];
}
