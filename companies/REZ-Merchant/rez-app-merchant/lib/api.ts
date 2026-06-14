import logger from './utils/logger';

/**
 * Merchant Hotel API Client
 * Connects to the merchant hotel backend for overview, tasks, rooms, and bookings
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const MERCHANT_HOTEL_URL =
  process.env.EXPO_PUBLIC_MERCHANT_HOTEL_URL || 'https://rez-merchant-service.onrender.com';

// Types matching the existing hotelService.ts patterns
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type HousekeepingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Overview data types
export interface OccupancyData {
  totalRooms: number;
  occupied: number;
  available: number;
  maintenance: number;
  pendingCheckOut: number;
}

export interface GuestArrival {
  id: string;
  guestName: string;
  room: string;
  time?: string;
}

export interface GuestDeparture {
  id: string;
  guestName: string;
  room: string;
}

export interface TodayData {
  checkIns: number;
  checkOuts: number;
  arrivals: GuestArrival[];
  departures: GuestDeparture[];
}

export interface HousekeepingRoomStatus {
  roomNumber: string;
  status: 'dirty' | 'clean' | 'in_progress';
  task?: string;
}

export interface HousekeepingStatusData {
  pending: number;
  inProgress: number;
  completed: number;
  rooms: HousekeepingRoomStatus[];
}

export interface PendingTask {
  id: string;
  type: string;
  room: string;
  priority: TaskPriority;
  time?: string;
}

export interface HotelOverview {
  occupancy: OccupancyData;
  today: TodayData;
  housekeeping: HousekeepingStatusData;
  pendingTasks: PendingTask[];
}

// Room types
export interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor?: number;
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  amenities?: string[];
}

export interface RoomListResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Task types
export interface Task {
  _id: string;
  roomId: string;
  roomNumber: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'restocking';
  status: HousekeepingStatus;
  priority: TaskPriority;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// Booking types
export interface Booking {
  _id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

// API Error interface
interface ApiError {
  success: false;
  message: string;
  code?: string;
}

// Loading state interface
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Error handler
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// API Client class
class MerchantHotelApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: MERCHANT_HOTEL_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - could trigger logout here
          logger.warn('[MerchantHotelApi] Unauthorized - token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // ─── Overview ────────────────────────────────────────────────────────────────

  /**
   * GET /api/merchant/hotel/overview
   * Fetch hotel dashboard overview with occupancy, today's activity, housekeeping
   */
  async getOverview(merchantId: string): Promise<HotelOverview> {
    try {
      const response = await this.client.get(`/api/merchant/hotel/overview`, {
        params: { merchantId },
      });
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] getOverview failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * GET /api/merchant/hotel/overview with loading state
   */
  async getOverviewWithState(
    merchantId: string,
    setState?: (state: LoadingState<HotelOverview>) => void
  ): Promise<HotelOverview | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.getOverviewWithState(merchantId, setState),
      });
    }

    try {
      const response = await this.client.get(`/api/merchant/hotel/overview`, {
        params: { merchantId },
      });
      const data = response.data as HotelOverview;

      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getOverviewWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.getOverviewWithState(merchantId, setState),
        });
      }
      return null;
    }
  }

  // ─── Tasks ───────────────────────────────────────────────────────────────────

  /**
   * GET /api/merchant/hotel/tasks
   * Fetch all pending and active tasks
   */
  async getTasks(merchantId: string, filters?: {
    status?: HousekeepingStatus;
    priority?: TaskPriority;
    limit?: number;
  }): Promise<TaskListResponse> {
    try {
      const params: Record<string, string> = { merchantId };
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      if (filters?.limit) params.limit = filters.limit.toString();

      const response = await this.client.get('/api/merchant/hotel/tasks', { params });
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] getTasks failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * GET /api/merchant/hotel/tasks with loading state
   */
  async getTasksWithState(
    merchantId: string,
    filters?: {
      status?: HousekeepingStatus;
      priority?: TaskPriority;
      limit?: number;
    },
    setState?: (state: LoadingState<TaskListResponse>) => void
  ): Promise<TaskListResponse | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.getTasksWithState(merchantId, filters, setState),
      });
    }

    try {
      const params: Record<string, string> = { merchantId };
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      if (filters?.limit) params.limit = filters.limit?.toString();

      const response = await this.client.get('/api/merchant/hotel/tasks', { params });
      const data = response.data as TaskListResponse;

      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getTasksWithState(merchantId, filters, setState),
        });
      }
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.getTasksWithState(merchantId, filters, setState),
        });
      }
      return null;
    }
  }

  /**
   * PATCH /api/merchant/hotel/tasks/:id
   * Update a task (status, priority, notes, etc.)
   */
  async updateTask(
    taskId: string,
    updates: {
      status?: HousekeepingStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      notes?: string;
    }
  ): Promise<Task> {
    try {
      const response = await this.client.patch(
        `/api/merchant/hotel/tasks/${taskId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] updateTask failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * POST /api/merchant/hotel/tasks
   * Create a new task
   */
  async createTask(merchantId: string, taskData: {
    roomId: string;
    taskType: Task['taskType'];
    priority?: TaskPriority;
    assignedTo?: string;
    notes?: string;
  }): Promise<Task> {
    try {
      const response = await this.client.post('/api/merchant/hotel/tasks', {
        merchantId,
        ...taskData,
      });
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] createTask failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  // ─── Rooms ───────────────────────────────────────────────────────────────────

  /**
   * GET /api/merchant/hotel/rooms
   * Fetch all rooms for the merchant
   */
  async getRooms(merchantId: string, filters?: {
    status?: RoomStatus | RoomStatus[];
    roomType?: string;
    limit?: number;
    page?: number;
  }): Promise<RoomListResponse> {
    try {
      const params: Record<string, string> = { merchantId };
      if (filters?.status) {
        params.status = Array.isArray(filters.status)
          ? filters.status.join(',')
          : filters.status;
      }
      if (filters?.roomType) params.roomType = filters.roomType;
      if (filters?.limit) params.limit = filters.limit.toString();
      if (filters?.page) params.page = filters.page.toString();

      const response = await this.client.get('/api/merchant/hotel/rooms', { params });
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] getRooms failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * GET /api/merchant/hotel/rooms with loading state
   */
  async getRoomsWithState(
    merchantId: string,
    filters?: {
      status?: RoomStatus | RoomStatus[];
      roomType?: string;
      limit?: number;
      page?: number;
    },
    setState?: (state: LoadingState<RoomListResponse>) => void
  ): Promise<RoomListResponse | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.getRoomsWithState(merchantId, filters, setState),
      });
    }

    try {
      const params: Record<string, string> = { merchantId };
      if (filters?.status) {
        params.status = Array.isArray(filters.status)
          ? filters.status.join(',')
          : filters.status;
      }
      if (filters?.roomType) params.roomType = filters.roomType;
      if (filters?.limit) params.limit = filters.limit.toString();
      if (filters?.page) params.page = filters.page.toString();

      const response = await this.client.get('/api/merchant/hotel/rooms', { params });
      const data = response.data as RoomListResponse;

      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getRoomsWithState(merchantId, filters, setState),
        });
      }
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.getRoomsWithState(merchantId, filters, setState),
        });
      }
      return null;
    }
  }

  /**
   * PATCH /api/merchant/hotel/rooms/:id
   * Update room details or status
   */
  async updateRoom(
    roomId: string,
    updates: {
      status?: RoomStatus;
      roomType?: string;
      pricePerNight?: number;
      amenities?: string[];
    }
  ): Promise<Room> {
    try {
      const response = await this.client.patch(
        `/api/merchant/hotel/rooms/${roomId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] updateRoom failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  // ─── Bookings ────────────────────────────────────────────────────────────────

  /**
   * GET /api/merchant/hotel/bookings
   * Fetch bookings for the merchant
   */
  async getBookings(merchantId: string, filters?: {
    status?: BookingStatus | BookingStatus[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params: Record<string, string> = { merchantId };
      if (filters?.status) {
        params.status = Array.isArray(filters.status)
          ? filters.status.join(',')
          : filters.status;
      }
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.limit) params.limit = filters.limit.toString();
      if (filters?.page) params.page = filters.page.toString();

      const response = await this.client.get('/api/merchant/hotel/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] getBookings failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * GET /api/merchant/hotel/bookings/:id
   * Fetch a specific booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking> {
    try {
      const response = await this.client.get(`/api/merchant/hotel/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] getBooking failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * PATCH /api/merchant/hotel/bookings/:id
   * Update booking details or status
   */
  async updateBooking(
    bookingId: string,
    updates: {
      status?: BookingStatus;
      guestName?: string;
      guestPhone?: string;
      checkInDate?: string;
      checkOutDate?: string;
      specialRequests?: string;
    }
  ): Promise<Booking> {
    try {
      const response = await this.client.patch(
        `/api/merchant/hotel/bookings/${bookingId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] updateBooking failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * POST /api/merchant/hotel/bookings/:id/check-in
   * Check in a guest
   */
  async checkInGuest(bookingId: string): Promise<Booking> {
    try {
      const response = await this.client.post(
        `/api/merchant/hotel/bookings/${bookingId}/check-in`
      );
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] checkInGuest failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * POST /api/merchant/hotel/bookings/:id/check-out
   * Check out a guest
   */
  async checkOutGuest(bookingId: string): Promise<Booking> {
    try {
      const response = await this.client.post(
        `/api/merchant/hotel/bookings/${bookingId}/check-out`
      );
      return response.data;
    } catch (error) {
      console.error('[MerchantHotelApi] checkOutGuest failed:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  // ─── Health Check ───────────────────────────────────────────────────────────

  /**
   * GET /health
   * Check if the service is available
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unavailable', timestamp: new Date().toISOString() };
    }
  }
}

// Export singleton instance
export const merchantHotelApi = new MerchantHotelApi();

// Also export the class for testing or custom instances
export default MerchantHotelApi;
