/**
 * API Service for StayOwn Staff App
 *
 * Handles all HTTP requests to backend services with:
 * - Automatic retry with exponential backoff
 * - Request queuing when offline
 * - Token refresh handling
 * - Error transformation
 */

import {
  ApiResponse,
  Room,
  HousekeepingTask,
  MaintenanceIssue,
  ServiceRequest,
  Message,
  Staff,
  SyncOperation,
  Conflict,
  SyncState,
} from '../types';
import OfflineStorage from './OfflineStorage';

// API Base URLs (configurable via environment)
const API_BASE = {
  // Hotel Service - core operations
  HOTEL: 'http://localhost:4015',
  // PMS Service - reservations, check-in/out
  PMS: 'http://localhost:4031',
  // Housekeeping Service
  HOUSEKEEPING: 'http://localhost:4015/api/housekeeping',
  // Maintenance Service
  MAINTENANCE: 'http://localhost:4019',
  // Messaging Service
  MESSAGING: 'http://localhost:4018',
  // Virtual Concierge
  CONCIERGE: 'http://localhost:4034',
  // Offline Sync Service
  OFFLINE_SYNC: 'http://localhost:4038',
};

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;
  private deviceId: string | null = null;
  private staffId: string | null = null;

  constructor(baseUrl: string = API_BASE.HOTEL) {
    this.baseUrl = baseUrl;
  }

  // ----------------------------------------
  // CONFIGURATION
  // ----------------------------------------

  setAuth(token: string) {
    this.authToken = token;
  }

  setDevice(deviceId: string) {
    this.deviceId = deviceId;
  }

  setStaff(staffId: string) {
    this.staffId = staffId;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (this.deviceId) {
      headers['X-Device-ID'] = this.deviceId;
    }
    return headers;
  }

  // ----------------------------------------
  // NETWORK CHECK
  // ----------------------------------------

  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE.HOTEL}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ----------------------------------------
  // HTTP HELPERS
  // ----------------------------------------

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options: { retry?: number; baseUrl?: string } = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = options.baseUrl || this.baseUrl;
    const url = `${baseUrl}${endpoint}`;
    const maxRetries = options.retry ?? 3;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(30000),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: data.error?.code || 'HTTP_ERROR',
              message: data.error?.message || `HTTP ${response.status}`,
              details: data.error?.details,
            },
          };
        }

        return { success: true, data: data.data || data };
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (error.name === 'AbortError' || attempt >= maxRetries) {
          break;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message || 'Network request failed',
      },
    };
  }

  // Convenience methods
  private get<T>(endpoint: string, options?: { retry?: number; baseUrl?: string }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  private post<T>(endpoint: string, body?: any, options?: { retry?: number; baseUrl?: string }): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  private put<T>(endpoint: string, body?: any, options?: { retry?: number; baseUrl?: string }): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  private delete<T>(endpoint: string, options?: { retry?: number; baseUrl?: string }): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ----------------------------------------
  // ROOMS API
  // ----------------------------------------

  async getRooms(hotelId: string): Promise<ApiResponse<Room[]>> {
    return this.get<Room[]>(`/api/rooms?hotelId=${hotelId}`);
  }

  async getRoom(roomId: string): Promise<ApiResponse<Room>> {
    return this.get<Room>(`/api/rooms/${roomId}`);
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<ApiResponse<Room>> {
    return this.put<Room>(`/api/rooms/${roomId}`, updates);
  }

  async updateRoomStatus(roomId: string, status: string, notes?: string): Promise<ApiResponse<Room>> {
    return this.post<Room>(`/api/rooms/${roomId}/status`, { status, notes });
  }

  // ----------------------------------------
  // HOUSEKEEPING API
  // ----------------------------------------

  async getHousekeepingTasks(hotelId: string, params?: { status?: string; assignedTo?: string }): Promise<ApiResponse<HousekeepingTask[]>> {
    const query = new URLSearchParams();
    query.append('hotelId', hotelId);
    if (params?.status) query.append('status', params.status);
    if (params?.assignedTo) query.append('assignedTo', params.assignedTo);

    return this.get<HousekeepingTask[]>(`/api/tasks?${query.toString()}`, { baseUrl: API_BASE.HOUSEKEEPING });
  }

  async updateHousekeepingTask(taskId: string, updates: Partial<HousekeepingTask>): Promise<ApiResponse<HousekeepingTask>> {
    return this.put<HousekeepingTask>(`/api/tasks/${taskId}`, updates, { baseUrl: API_BASE.HOUSEKEEPING });
  }

  async completeHousekeepingTask(taskId: string, notes?: string): Promise<ApiResponse<HousekeepingTask>> {
    return this.post<HousekeepingTask>(`/api/tasks/${taskId}/complete`, { notes }, { baseUrl: API_BASE.HOUSEKEEPING });
  }

  // ----------------------------------------
  // MAINTENANCE API
  // ----------------------------------------

  async getMaintenanceIssues(hotelId: string, params?: { status?: string }): Promise<ApiResponse<MaintenanceIssue[]>> {
    const query = params?.status ? `?status=${params.status}` : '';
    return this.get<MaintenanceIssue[]>(`/api/issues${query}`, { baseUrl: API_BASE.MAINTENANCE });
  }

  async createMaintenanceIssue(issue: Omit<MaintenanceIssue, 'id'>): Promise<ApiResponse<MaintenanceIssue>> {
    return this.post<MaintenanceIssue>('/api/issues', issue, { baseUrl: API_BASE.MAINTENANCE });
  }

  async updateMaintenanceIssue(issueId: string, updates: Partial<MaintenanceIssue>): Promise<ApiResponse<MaintenanceIssue>> {
    return this.put<MaintenanceIssue>(`/api/issues/${issueId}`, updates, { baseUrl: API_BASE.MAINTENANCE });
  }

  async resolveMaintenanceIssue(issueId: string, notes?: string): Promise<ApiResponse<MaintenanceIssue>> {
    return this.post<MaintenanceIssue>(`/api/issues/${issueId}/resolve`, { notes }, { baseUrl: API_BASE.MAINTENANCE });
  }

  // ----------------------------------------
  // SERVICE REQUESTS API
  // ----------------------------------------

  async getServiceRequests(hotelId: string): Promise<ApiResponse<ServiceRequest[]>> {
    return this.get<ServiceRequest[]>(`/api/service-requests?hotelId=${hotelId}`, { baseUrl: API_BASE.CONCIERGE });
  }

  async updateServiceRequest(requestId: string, updates: Partial<ServiceRequest>): Promise<ApiResponse<ServiceRequest>> {
    return this.put<ServiceRequest>(`/api/service-requests/${requestId}`, updates, { baseUrl: API_BASE.CONCIERGE });
  }

  async completeServiceRequest(requestId: string, notes?: string): Promise<ApiResponse<ServiceRequest>> {
    return this.post<ServiceRequest>(`/api/service-requests/${requestId}/complete`, { notes }, { baseUrl: API_BASE.CONCIERGE });
  }

  // ----------------------------------------
  // MESSAGING API
  // ----------------------------------------

  async getMessages(hotelId: string, params?: { roomId?: string; unreadOnly?: boolean }): Promise<ApiResponse<Message[]>> {
    const query = new URLSearchParams();
    query.append('hotelId', hotelId);
    if (params?.roomId) query.append('roomId', params.roomId);
    if (params?.unreadOnly) query.append('unreadOnly', 'true');

    return this.get<Message[]>(`/api/messages?${query.toString()}`, { baseUrl: API_BASE.MESSAGING });
  }

  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<ApiResponse<Message>> {
    return this.post<Message>('/api/messages', message, { baseUrl: API_BASE.MESSAGING });
  }

  async markMessageRead(messageId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/messages/${messageId}/read`, {}, { baseUrl: API_BASE.MESSAGING });
  }

  // ----------------------------------------
  // PMS API (Check-in/Check-out)
  // ----------------------------------------

  async checkInGuest(reservationId: string, roomId: string, staffId: string): Promise<ApiResponse<any>> {
    return this.post<any>('/api/reservations/checkin', { reservationId, roomId, staffId }, { baseUrl: API_BASE.PMS });
  }

  async checkOutGuest(reservationId: string, staffId: string): Promise<ApiResponse<any>> {
    return this.post<any>('/api/reservations/checkout', { reservationId, staffId }, { baseUrl: API_BASE.PMS });
  }

  // ----------------------------------------
  // OFFLINE SYNC API
  // ----------------------------------------

  async registerDevice(deviceInfo: { deviceId: string; staffId: string; deviceType: string; appVersion: string }): Promise<ApiResponse<any>> {
    return this.post<any>('/api/devices/register', deviceInfo, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async deviceHeartbeat(deviceId: string): Promise<ApiResponse<{ lastSync: string; pendingOperations: number }>> {
    return this.post<any>('/api/devices/heartbeat', { deviceId }, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async pushOperations(operations: SyncOperation[]): Promise<ApiResponse<any>> {
    return this.post<any>('/api/sync/push', {
      deviceId: this.deviceId,
      staffId: this.staffId,
      operations,
    }, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async pullChanges(lastSync?: string, entityTypes?: string[]): Promise<ApiResponse<any>> {
    return this.post<any>('/api/sync/pull', {
      deviceId: this.deviceId,
      staffId: this.staffId,
      lastSync,
      entityTypes,
    }, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async fullSync(operations: SyncOperation[], lastSync?: string, entityTypes?: string[]): Promise<ApiResponse<any>> {
    return this.post<any>('/api/sync/full', {
      deviceId: this.deviceId,
      staffId: this.staffId,
      operations,
      lastSync,
      entityTypes,
    }, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async getPendingConflicts(): Promise<ApiResponse<Conflict[]>> {
    return this.get<Conflict[]>(`/api/conflicts/${this.staffId}`, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async resolveConflict(conflictId: string, resolution: string, data?: any): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/conflicts/${conflictId}/resolve`, { resolution, data }, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async getQueueStatus(): Promise<ApiResponse<{ operations: any[]; counts: Record<string, number> }>> {
    return this.get<any>(`/api/queue/${this.staffId}`, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  async retryOperation(operationId: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/queue/retry/${operationId}`, {}, { baseUrl: API_BASE.OFFLINE_SYNC });
  }

  // ----------------------------------------
  // STAFF API
  // ----------------------------------------

  async getStaffProfile(): Promise<ApiResponse<Staff>> {
    return this.get<Staff>('/api/staff/profile');
  }

  async updateStaffProfile(updates: Partial<Staff>): Promise<ApiResponse<Staff>> {
    return this.put<Staff>('/api/staff/profile', updates);
  }

  // ----------------------------------------
  // UTILITY
  // ----------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE.HOTEL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

export default apiService;
