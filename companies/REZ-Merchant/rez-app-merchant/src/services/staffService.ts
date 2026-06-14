/**
 * Staff Service - Real Staff Management Integration
 *
 * Connects directly to https://rez-merchant-service.onrender.com
 * Provides staff CRUD operations, scheduling, and role management.
 */

import { logger } from '@/utils/logger';

// Staff Service base URL
const STAFF_SERVICE_URL =
  process.env.EXPO_PUBLIC_STAFF_SERVICE_URL || 'https://rez-merchant-service.onrender.com';

// ============================================
// TYPES
// ============================================

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'delivery' | 'other';

export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface StaffAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface StaffBankDetails {
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  accountHolderName?: string;
  upiId?: string;
}

export interface StaffContact {
  phone?: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface StaffWorkingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isWorkingDay: boolean;
}

export interface StaffSalary {
  type: 'hourly' | 'monthly' | 'commission';
  amount: number;
  currency?: string;
  payDay?: number; // Day of month for monthly
}

export interface StaffDocument {
  type: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  number?: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface Staff {
  _id: string;
  id?: string;
  merchantId: string;
  storeId?: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  phone?: string;
  email?: string;
  avatar?: string;
  address?: StaffAddress;
  contact?: StaffContact;
  dateOfBirth?: string;
  joiningDate: string;
  leavingDate?: string;
  workingHours?: StaffWorkingHours[];
  salary?: StaffSalary;
  documents?: StaffDocument[];
  permissions?: string[];
  isActive?: boolean;
  totalShifts?: number;
  completedShifts?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface StaffSchedule {
  _id: string;
  staffId: string;
  staffName?: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakDuration?: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSearchParams {
  merchantId: string;
  storeId?: string;
  query?: string;
  role?: StaffRole | StaffRole[];
  status?: StaffStatus | StaffStatus[];
  sortBy?: 'name' | 'createdAt' | 'joiningDate' | 'role';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface StaffListResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  roles?: Record<StaffRole, number>;
  statuses?: Record<StaffStatus, number>;
}

export interface CreateStaffRequest {
  merchantId: string;
  storeId?: string;
  name: string;
  role: StaffRole;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  address?: StaffAddress;
  contact?: StaffContact;
  workingHours?: StaffWorkingHours[];
  salary?: StaffSalary;
  documents?: StaffDocument[];
  permissions?: string[];
}

export interface UpdateStaffRequest {
  name?: string;
  role?: StaffRole;
  status?: StaffStatus;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  leavingDate?: string;
  address?: StaffAddress;
  contact?: StaffContact;
  workingHours?: StaffWorkingHours[];
  salary?: StaffSalary;
  documents?: StaffDocument[];
  permissions?: string[];
  isActive?: boolean;
}

export interface ScheduleParams {
  staffId: string;
  startDate: string;
  endDate: string;
  storeId?: string;
}

export interface CreateScheduleRequest {
  staffId: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  notes?: string;
}

export interface UpdateScheduleRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  status?: ScheduleParams['status'];
  notes?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

interface StaffServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

class StaffService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = `${STAFF_SERVICE_URL}/api/v1`;
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

  private getStaffId(staff: Staff): string {
    return staff._id || staff.id || '';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: StaffServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // ============================================
  // STAFF CRUD OPERATIONS
  // ============================================

  /**
   * GET /staff/:merchantId
   * Fetch all staff for a merchant with filtering and pagination
   */
  async getStaff(params: StaffSearchParams): Promise<StaffListResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('merchantId', params.merchantId);

      if (params.storeId) searchParams.append('storeId', params.storeId);
      if (params.query) searchParams.append('query', params.query);
      if (params.role) {
        const roles = Array.isArray(params.role) ? params.role : [params.role];
        roles.forEach((r) => searchParams.append('role', r));
      }
      if (params.status) {
        const statuses = Array.isArray(params.status) ? params.status : [params.status];
        statuses.forEach((s) => searchParams.append('status', s));
      }
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.order) searchParams.append('order', params.order);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const url = `${this.baseUrl}/staff/${params.merchantId}?${searchParams.toString()}`;
      logger.debug('[StaffService] Fetching staff:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          staff?: Staff[];
          items?: Staff[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
          roles?: Record<StaffRole, number>;
          statuses?: Record<StaffStatus, number>;
        };
        staff?: Staff[];
        items?: Staff[];
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
        };
        roles?: Record<StaffRole, number>;
        statuses?: Record<StaffStatus, number>;
      }>(response);

      // Normalize response - support multiple response shapes
      const staff = data.data?.staff || data.data?.items || data.staff || data.items || [];
      const pagination = data.data || data.pagination || {};

      return {
        staff,
        total: pagination.total || staff.length,
        page: pagination.page || 1,
        limit: pagination.limit || staff.length,
        totalPages: pagination.totalPages || 1,
        hasMore: pagination.hasMore || false,
        roles: data.data?.roles || data.roles,
        statuses: data.data?.statuses || data.statuses,
      };
    } catch (error) {
      logger.error('[StaffService] Error fetching staff:', error);
      throw error;
    }
  }

  /**
   * GET /staff/detail/:id
   * Fetch a single staff member by ID with full details
   */
  async getStaffById(staffId: string): Promise<Staff> {
    try {
      const url = `${this.baseUrl}/staff/detail/${staffId}`;
      logger.debug('[StaffService] Fetching staff:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Staff;
        staff?: Staff;
      }>(response);

      return data.data || data.staff!;
    } catch (error) {
      logger.error('[StaffService] Error fetching staff:', error);
      throw error;
    }
  }

  /**
   * POST /staff
   * Create a new staff member
   */
  async createStaff(staffData: CreateStaffRequest): Promise<Staff> {
    try {
      const url = `${this.baseUrl}/staff`;
      logger.debug('[StaffService] Creating staff:', url, staffData);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(staffData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Staff;
        staff?: Staff;
      }>(response);

      return data.data || data.staff!;
    } catch (error) {
      logger.error('[StaffService] Error creating staff:', error);
      throw error;
    }
  }

  /**
   * PATCH /staff/:id
   * Update staff member details
   */
  async updateStaff(staffId: string, updateData: UpdateStaffRequest): Promise<Staff> {
    try {
      const url = `${this.baseUrl}/staff/${staffId}`;
      logger.debug('[StaffService] Updating staff:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Staff;
        staff?: Staff;
      }>(response);

      return data.data || data.staff!;
    } catch (error) {
      logger.error('[StaffService] Error updating staff:', error);
      throw error;
    }
  }

  /**
   * DELETE /staff/:id
   * Soft delete a staff member
   */
  async deleteStaff(staffId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${this.baseUrl}/staff/${staffId}`;
      logger.debug('[StaffService] Deleting staff:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ success: boolean; message?: string }>(response);
    } catch (error) {
      logger.error('[StaffService] Error deleting staff:', error);
      throw error;
    }
  }

  // ============================================
  // STAFF SCHEDULE OPERATIONS
  // ============================================

  /**
   * GET /staff/:id/schedule
   * Fetch schedule for a staff member within a date range
   */
  async getStaffSchedule(
    staffId: string,
    params?: { startDate?: string; endDate?: string; storeId?: string }
  ): Promise<StaffSchedule[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      if (params?.storeId) searchParams.append('storeId', params.storeId);

      const url = `${this.baseUrl}/staff/${staffId}/schedule?${searchParams.toString()}`;
      logger.debug('[StaffService] Fetching staff schedule:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          schedule?: StaffSchedule[];
        };
        schedule?: StaffSchedule[];
      }>(response);

      return data.data?.schedule || data.schedule || [];
    } catch (error) {
      logger.error('[StaffService] Error fetching staff schedule:', error);
      throw error;
    }
  }

  /**
   * POST /staff/:id/schedule
   * Add a new schedule entry for a staff member
   */
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<StaffSchedule> {
    try {
      const url = `${this.baseUrl}/staff/${scheduleData.staffId}/schedule`;
      logger.debug('[StaffService] Creating schedule:', url, scheduleData);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(scheduleData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: StaffSchedule;
        schedule?: StaffSchedule;
      }>(response);

      return data.data || data.schedule!;
    } catch (error) {
      logger.error('[StaffService] Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * PATCH /staff/:staffId/schedule/:scheduleId
   * Update a schedule entry
   */
  async updateSchedule(
    staffId: string,
    scheduleId: string,
    updateData: UpdateScheduleRequest
  ): Promise<StaffSchedule> {
    try {
      const url = `${this.baseUrl}/staff/${staffId}/schedule/${scheduleId}`;
      logger.debug('[StaffService] Updating schedule:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: StaffSchedule;
        schedule?: StaffSchedule;
      }>(response);

      return data.data || data.schedule!;
    } catch (error) {
      logger.error('[StaffService] Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * DELETE /staff/:staffId/schedule/:scheduleId
   * Delete a schedule entry
   */
  async deleteSchedule(
    staffId: string,
    scheduleId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${this.baseUrl}/staff/${staffId}/schedule/${scheduleId}`;
      logger.debug('[StaffService] Deleting schedule:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ success: boolean; message?: string }>(response);
    } catch (error) {
      logger.error('[StaffService] Error deleting schedule:', error);
      throw error;
    }
  }

  // ============================================
  // STAFF STATISTICS
  // ============================================

  /**
   * GET /staff/:merchantId/stats
   * Get staff statistics for a merchant
   */
  async getStaffStats(merchantId: string, storeId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<StaffRole, number>;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (storeId) searchParams.append('storeId', storeId);

      const url = `${this.baseUrl}/staff/${merchantId}/stats?${searchParams.toString()}`;
      logger.debug('[StaffService] Fetching staff stats:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{
        success?: boolean;
        data?: {
          total?: number;
          active?: number;
          inactive?: number;
          byRole?: Record<StaffRole, number>;
        };
        total?: number;
        active?: number;
        inactive?: number;
        byRole?: Record<StaffRole, number>;
      }>(response);
    } catch (error) {
      logger.error('[StaffService] Error fetching staff stats:', error);
      throw error;
    }
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
      logger.error('[StaffService] Health check failed:', error);
      throw error;
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export const staffService = new StaffService();
export default staffService;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get display label for staff role
 */
export function getStaffRoleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    owner: 'Owner',
    manager: 'Manager',
    cashier: 'Cashier',
    server: 'Server',
    chef: 'Chef',
    delivery: 'Delivery',
    other: 'Other',
  };
  return labels[role] || role;
}

/**
 * Get display label for staff status
 */
export function getStaffStatusLabel(status: StaffStatus): string {
  const labels: Record<StaffStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
  };
  return labels[status] || status;
}

/**
 * Get color for staff status badge
 */
export function getStaffStatusColor(status: StaffStatus): { bg: string; text: string } {
  const colors: Record<StaffStatus, { bg: string; text: string }> = {
    active: { bg: '#ECFDF5', text: '#059669' },
    inactive: { bg: '#F3F4F6', text: '#6B7280' },
    on_leave: { bg: '#FEF3C7', text: '#D97706' },
    terminated: { bg: '#FEF2F2', text: '#DC2626' },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
}

/**
 * Format working hours for display
 */
export function formatWorkingHours(workingHours: StaffWorkingHours[]): string {
  if (!workingHours || workingHours.length === 0) return 'Not set';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const workingDays = workingHours
    .filter((wh) => wh.isWorkingDay)
    .map((wh) => days[wh.dayOfWeek]);

  if (workingDays.length === 0) return 'No working days';
  if (workingDays.length === 7) return 'All days';
  if (workingDays.length === 5 && !workingDays.includes('Sat') && !workingDays.includes('Sun')) {
    return 'Weekdays';
  }
  if (workingDays.length === 2 && workingDays.includes('Sat') && workingDays.includes('Sun')) {
    return 'Weekends';
  }

  return workingDays.join(', ');
}

/**
 * Format salary for display
 */
export function formatSalary(salary: StaffSalary): string {
  if (!salary) return 'Not set';

  const typeLabels = {
    hourly: '/hr',
    monthly: '/mo',
    commission: '%',
  };

  const currency = salary.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : currency;

  if (salary.type === 'commission') {
    return `${salary.amount}${typeLabels[salary.type]}`;
  }

  return `${symbol}${salary.amount.toLocaleString()}${typeLabels[salary.type]}`;
}
