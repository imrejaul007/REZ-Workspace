/**
 * Hotel Service - Hotel Room Management Integration
 *
 * Connects directly to https://rez-hotel-pms.onrender.com or rez-merchant-service
 * Provides room management, bookings, and housekeeping task management.
 */

// Hotel PMS Service base URL
const HOTEL_SERVICE_URL =
  process.env.EXPO_PUBLIC_HOTEL_SERVICE_URL || 'https://rez-hotel-pms.onrender.com';

// Types
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type HousekeepingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Room {
  _id: string;
  id?: string;
  merchantId: string;
  roomNumber: string;
  roomType: string;
  floor?: number;
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  amenities?: string[];
  images?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomListResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateRoomData {
  roomNumber: string;
  roomType: string;
  floor?: number;
  capacity: number;
  pricePerNight: number;
  amenities?: string[];
  description?: string;
}

export interface UpdateRoomData {
  roomType?: string;
  floor?: number;
  capacity?: number;
  pricePerNight?: number;
  amenities?: string[];
  description?: string;
}

export interface Booking {
  _id: string;
  id?: string;
  merchantId: string;
  roomId: string;
  room?: Room;
  roomNumber?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateBookingData {
  roomId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
}

export interface UpdateBookingData {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
}

export interface HousekeepingTask {
  _id: string;
  id?: string;
  merchantId: string;
  roomId: string;
  room?: Room;
  roomNumber?: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'restocking';
  status: HousekeepingStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingListResponse {
  tasks: HousekeepingTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateHousekeepingTaskData {
  roomId: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'restocking';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
}

export interface UpdateHousekeepingTaskData {
  status?: HousekeepingStatus;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
}

export interface RoomSearchParams {
  merchantId: string;
  status?: RoomStatus | RoomStatus[];
  roomType?: string;
  floor?: number;
  page?: number;
  limit?: number;
}

export interface BookingSearchParams {
  merchantId: string;
  status?: BookingStatus | BookingStatus[];
  roomId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface HousekeepingSearchParams {
  merchantId: string;
  status?: HousekeepingStatus | HousekeepingStatus[];
  roomId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  page?: number;
  limit?: number;
}

// API Error type
interface HotelServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

// Status configuration
export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: '#F0FDF4', text: '#16A34A' },
  occupied: { label: 'Occupied', bg: '#FEF3C7', text: '#D97706' },
  maintenance: { label: 'Maintenance', bg: '#FEF2F2', text: '#DC2626' },
  cleaning: { label: 'Cleaning', bg: '#F5F3FF', text: '#7C3AED' },
  reserved: { label: 'Reserved', bg: '#EFF6FF', text: '#3B82F6' },
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  confirmed: { label: 'Confirmed', bg: '#EFF6FF', text: '#3B82F6' },
  checked_in: { label: 'Checked In', bg: '#F0FDF4', text: '#16A34A' },
  checked_out: { label: 'Checked Out', bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
  no_show: { label: 'No Show', bg: '#FFF7ED', text: '#EA580C' },
};

export const HOUSEKEEPING_STATUS_CONFIG: Record<HousekeepingStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#D97706' },
  in_progress: { label: 'In Progress', bg: '#EFF6FF', text: '#3B82F6' },
  completed: { label: 'Completed', bg: '#F0FDF4', text: '#16A34A' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
};

class HotelService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = HOTEL_SERVICE_URL;
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: HotelServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // ==================== ROOMS ====================

  // GET /rooms/:merchantId - Get all rooms for a merchant
  async getRooms(params: RoomSearchParams): Promise<RoomListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('merchantId', params.merchantId);

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach((s) => searchParams.append('status', s));
    }
    if (params.roomType) searchParams.append('roomType', params.roomType);
    if (params.floor) searchParams.append('floor', params.floor.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/rooms/${params.merchantId}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: {
        rooms?: Room[];
        items?: Room[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
      rooms?: Room[];
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
    }>(response);

    // Normalize response - support multiple response shapes
    const rooms = data.data?.rooms || data.data?.items || data.rooms || [];
    const pagination = data.data || data.pagination || {};

    return {
      rooms,
      total: pagination.total || rooms.length,
      page: pagination.page || 1,
      limit: pagination.limit || rooms.length,
      totalPages: pagination.totalPages || 1,
      hasMore: pagination.hasMore || false,
    };
  }

  // GET /rooms/detail/:id - Get room details by ID
  async getRoomById(id: string): Promise<Room> {
    const url = `${this.baseUrl}/rooms/detail/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: Room;
      room?: Room;
    }>(response);

    return data.data || data.room!;
  }

  // PATCH /rooms/:id/status - Update room status
  async updateRoomStatus(id: string, status: RoomStatus): Promise<Room> {
    const url = `${this.baseUrl}/rooms/${id}/status`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: Room;
      room?: Room;
    }>(response);

    return data.data || data.room!;
  }

  // POST /rooms - Create a new room
  async createRoom(merchantId: string, data: CreateRoomData): Promise<Room> {
    const url = `${this.baseUrl}/rooms`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ merchantId, ...data }),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: Room;
      room?: Room;
    }>(response);

    return result.data || result.room!;
  }

  // PUT /rooms/:id - Update room details
  async updateRoom(id: string, data: UpdateRoomData): Promise<Room> {
    const url = `${this.baseUrl}/rooms/${id}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: Room;
      room?: Room;
    }>(response);

    return result.data || result.room!;
  }

  // DELETE /rooms/:id - Delete a room
  async deleteRoom(id: string): Promise<void> {
    const url = `${this.baseUrl}/rooms/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: HotelServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
  }

  // ==================== BOOKINGS ====================

  // GET /bookings/:merchantId - Get all bookings for a merchant
  async getBookings(params: BookingSearchParams): Promise<BookingListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('merchantId', params.merchantId);

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach((s) => searchParams.append('status', s));
    }
    if (params.roomId) searchParams.append('roomId', params.roomId);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/bookings/${params.merchantId}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: {
        bookings?: Booking[];
        items?: Booking[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
      bookings?: Booking[];
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
    }>(response);

    // Normalize response
    const bookings = data.data?.bookings || data.data?.items || data.bookings || [];
    const pagination = data.data || data.pagination || {};

    return {
      bookings,
      total: pagination.total || bookings.length,
      page: pagination.page || 1,
      limit: pagination.limit || bookings.length,
      totalPages: pagination.totalPages || 1,
      hasMore: pagination.hasMore || false,
    };
  }

  // GET /bookings/detail/:id - Get booking details by ID
  async getBookingById(id: string): Promise<Booking> {
    const url = `${this.baseUrl}/bookings/detail/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: Booking;
      booking?: Booking;
    }>(response);

    return data.data || data.booking!;
  }

  // POST /bookings - Create a new booking
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const url = `${this.baseUrl}/bookings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: Booking;
      booking?: Booking;
    }>(response);

    return result.data || result.booking!;
  }

  // PATCH /bookings/:id - Update booking
  async updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
    const url = `${this.baseUrl}/bookings/${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: Booking;
      booking?: Booking;
    }>(response);

    return result.data || result.booking!;
  }

  // PATCH /bookings/:id/status - Update booking status
  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const url = `${this.baseUrl}/bookings/${id}/status`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: Booking;
      booking?: Booking;
    }>(response);

    return data.data || data.booking!;
  }

  // POST /bookings/:id/check-in - Check in a guest
  async checkInBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'checked_in');
  }

  // POST /bookings/:id/check-out - Check out a guest
  async checkOutBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'checked_out');
  }

  // POST /bookings/:id/cancel - Cancel a booking
  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const url = `${this.baseUrl}/bookings/${id}/cancel`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: Booking;
      booking?: Booking;
    }>(response);

    return data.data || data.booking!;
  }

  // DELETE /bookings/:id - Delete a booking
  async deleteBooking(id: string): Promise<void> {
    const url = `${this.baseUrl}/bookings/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: HotelServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
  }

  // ==================== HOUSEKEEPING ====================

  // GET /housekeeping/:merchantId - Get housekeeping tasks for a merchant
  async getHousekeepingTasks(params: HousekeepingSearchParams): Promise<HousekeepingListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('merchantId', params.merchantId);

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach((s) => searchParams.append('status', s));
    }
    if (params.roomId) searchParams.append('roomId', params.roomId);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/housekeeping/${params.merchantId}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: {
        tasks?: HousekeepingTask[];
        items?: HousekeepingTask[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
      tasks?: HousekeepingTask[];
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
    }>(response);

    // Normalize response
    const tasks = data.data?.tasks || data.data?.items || data.tasks || [];
    const pagination = data.data || data.pagination || {};

    return {
      tasks,
      total: pagination.total || tasks.length,
      page: pagination.page || 1,
      limit: pagination.limit || tasks.length,
      totalPages: pagination.totalPages || 1,
      hasMore: pagination.hasMore || false,
    };
  }

  // GET /housekeeping/detail/:id - Get housekeeping task by ID
  async getHousekeepingTaskById(id: string): Promise<HousekeepingTask> {
    const url = `${this.baseUrl}/housekeeping/detail/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: HousekeepingTask;
      task?: HousekeepingTask;
    }>(response);

    return data.data || data.task!;
  }

  // POST /housekeeping - Create a new housekeeping task
  async createHousekeepingTask(merchantId: string, data: CreateHousekeepingTaskData): Promise<HousekeepingTask> {
    const url = `${this.baseUrl}/housekeeping`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ merchantId, ...data }),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: HousekeepingTask;
      task?: HousekeepingTask;
    }>(response);

    return result.data || result.task!;
  }

  // PATCH /housekeeping/:id - Update housekeeping task
  async updateHousekeepingTask(id: string, data: UpdateHousekeepingTaskData): Promise<HousekeepingTask> {
    const url = `${this.baseUrl}/housekeeping/${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<{
      success?: boolean;
      data?: HousekeepingTask;
      task?: HousekeepingTask;
    }>(response);

    return result.data || result.task!;
  }

  // PATCH /housekeeping/:id/complete - Mark task as completed
  async completeHousekeepingTask(id: string, notes?: string): Promise<HousekeepingTask> {
    return this.updateHousekeepingTask(id, {
      status: 'completed',
      notes,
    });
  }

  // DELETE /housekeeping/:id - Delete housekeeping task
  async deleteHousekeepingTask(id: string): Promise<void> {
    const url = `${this.baseUrl}/housekeeping/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: HotelServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  // Get available rooms for a specific date range
  async getAvailableRooms(
    merchantId: string,
    checkInDate: string,
    checkOutDate: string,
    roomType?: string
  ): Promise<Room[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('merchantId', merchantId);
    searchParams.append('checkInDate', checkInDate);
    searchParams.append('checkOutDate', checkOutDate);
    if (roomType) searchParams.append('roomType', roomType);

    const url = `${this.baseUrl}/rooms/available?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success?: boolean;
      data?: {
        rooms?: Room[];
        items?: Room[];
      };
      rooms?: Room[];
    }>(response);

    return data.data?.rooms || data.data?.items || data.rooms || [];
  }

  // Get room statistics for dashboard
  async getRoomStats(merchantId: string): Promise<{
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    cleaningRooms: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    pendingHousekeeping: number;
  }> {
    const url = `${this.baseUrl}/rooms/stats/${merchantId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{
      totalRooms: number;
      availableRooms: number;
      occupiedRooms: number;
      maintenanceRooms: number;
      cleaningRooms: number;
      todayCheckIns: number;
      todayCheckOuts: number;
      pendingHousekeeping: number;
    }>(response);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      // Return a fallback response if the health check fails
      return { status: 'unavailable', timestamp: new Date().toISOString() };
    }
  }
}

// Create and export singleton instance
export const hotelService = new HotelService();
export default hotelService;
