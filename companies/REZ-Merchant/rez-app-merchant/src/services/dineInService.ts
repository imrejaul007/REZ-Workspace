/**
 * Dine-In/Table Service for REZ Merchant App
 *
 * Handles all dine-in operations including:
 * - Table management (CRUD, status updates)
 * - Floor plan configuration
 * - Reservations management
 * - Waitlist management
 * - Analytics
 *
 * Base URL: https://rez-merchant-service.onrender.com/api/v1
 */

import { ApiClient, ApiResponse } from './apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

// Table Types
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
}

export enum TableShape {
  ROUND = 'ROUND',
  SQUARE = 'SQUARE',
  RECTANGLE = 'RECTANGLE',
  BOOTH = 'BOOTH',
  CUSTOM = 'CUSTOM',
}

export interface TablePosition {
  x: number;
  y: number;
  rotation?: number;
}

export interface Table {
  id: string;
  merchantId: string;
  number: string;
  name?: string;
  capacity: number;
  minCapacity?: number;
  status: TableStatus;
  section?: string;
  shape: TableShape;
  position: TablePosition;
  dimensions?: {
    width: number;
    height: number;
  };
  amenities?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTable {
  number: string;
  name?: string;
  capacity: number;
  minCapacity?: number;
  section?: string;
  shape?: TableShape;
  position: TablePosition;
  dimensions?: {
    width: number;
    height: number;
  };
  amenities?: string[];
}

export interface UpdateTable {
  number?: string;
  name?: string;
  capacity?: number;
  minCapacity?: number;
  section?: string;
  shape?: TableShape;
  position?: TablePosition;
  dimensions?: {
    width: number;
    height: number;
  };
  amenities?: string[];
  isActive?: boolean;
}

// Floor Plan Types
export interface FloorPlan {
  id: string;
  merchantId: string;
  name: string;
  sections: FloorSection[];
  tables: Table[];
  canvasSize: {
    width: number;
    height: number;
  };
  backgroundImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FloorSection {
  id: string;
  name: string;
  color: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  order: number;
}

// Reservation Types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum ReservationSource {
  WALK_IN = 'WALK_IN',
  PHONE = 'PHONE',
  ONLINE = 'ONLINE',
  APP = 'APP',
  THIRD_PARTY = 'THIRD_PARTY',
}

export interface GuestInfo {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  visitCount?: number;
  customerId?: string;
}

export interface Reservation {
  id: string;
  merchantId: string;
  guestInfo: GuestInfo;
  tableId?: string;
  tableIds?: string[];
  partySize: number;
  dateTime: Date;
  duration?: number; // minutes
  status: ReservationStatus;
  source: ReservationSource;
  specialRequests?: string[];
  dietaryRestrictions?: string[];
  occasion?: string;
  depositRequired: boolean;
  depositPaid: boolean;
  depositAmount?: number;
  confirmationCode?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservation {
  merchantId: string;
  guestInfo: GuestInfo;
  tableId?: string;
  tableIds?: string[];
  partySize: number;
  dateTime: Date;
  duration?: number;
  source?: ReservationSource;
  specialRequests?: string[];
  dietaryRestrictions?: string[];
  occasion?: string;
  depositRequired?: boolean;
  depositAmount?: number;
}

export interface UpdateReservation {
  guestInfo?: GuestInfo;
  tableId?: string;
  tableIds?: string[];
  partySize?: number;
  dateTime?: Date;
  duration?: number;
  status?: ReservationStatus;
  specialRequests?: string[];
  dietaryRestrictions?: string[];
  occasion?: string;
  depositRequired?: boolean;
  depositPaid?: boolean;
  depositAmount?: number;
  cancellationReason?: string;
}

// Waitlist Types
export enum WaitlistStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  SEATED = 'SEATED',
  LEFT = 'LEFT',
  CANCELLED = 'CANCELLED',
}

export interface WaitlistEntry {
  id: string;
  merchantId: string;
  guestInfo: GuestInfo;
  partySize: number;
  quotedWaitTime: number; // minutes
  actualWaitTime?: number;
  status: WaitlistStatus;
  tableSize?: number;
  position: number;
  notifiedAt?: Date;
  seatedAt?: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToWaitlist {
  merchantId: string;
  guestInfo: GuestInfo;
  partySize: number;
  tableSize?: number;
}

// Analytics Types
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TableAnalytics {
  totalCovers: number;
  averageTurnTime: number; // minutes
  tableUtilization: {
    tableId: string;
    tableNumber: string;
    utilizationRate: number;
    totalCovers: number;
    averageTurnTime: number;
  }[];
  peakHours: {
    hour: number;
    covers: number;
  }[];
  reservationStats: {
    total: number;
    confirmed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  waitlistStats: {
    total: number;
    averageWaitTime: number;
    leftBeforeSeating: number;
  };
  tablePopularity: {
    tableId: string;
    tableNumber: string;
    reservations: number;
    covers: number;
  }[];
  periodComparison?: {
    previousPeriod: {
      totalCovers: number;
      averageTurnTime: number;
    };
    changePercent: {
      totalCovers: number;
      averageTurnTime: number;
    };
  };
}

// ============================================================================
// Retry Configuration
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// ============================================================================
// Mock Data
// ============================================================================

/** FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation */
const generateMockId = (): string => {
  // Use crypto for secure random ID generation
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `mock_${Date.now()}_${globalThis.crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
  }
  // Node.js fallback
  try {
    const { randomUUID } = require('crypto');
    return `mock_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

const mockTables: Table[] = [
  {
    id: 'table_001',
    merchantId: 'merchant_demo',
    number: '1',
    name: 'Window Seat',
    capacity: 4,
    minCapacity: 2,
    status: TableStatus.AVAILABLE,
    section: 'main',
    shape: TableShape.RECTANGLE,
    position: { x: 100, y: 100 },
    dimensions: { width: 120, height: 80 },
    amenities: ['window_view', 'power_outlet'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'table_002',
    merchantId: 'merchant_demo',
    number: '2',
    name: 'Corner Booth',
    capacity: 6,
    minCapacity: 4,
    status: TableStatus.OCCUPIED,
    section: 'main',
    shape: TableShape.BOOTH,
    position: { x: 250, y: 100 },
    dimensions: { width: 180, height: 100 },
    amenities: ['booth_seating', 'privacy'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'table_003',
    merchantId: 'merchant_demo',
    number: '3',
    capacity: 2,
    status: TableStatus.RESERVED,
    section: 'patio',
    shape: TableShape.ROUND,
    position: { x: 100, y: 250 },
    dimensions: { width: 80, height: 80 },
    amenities: ['outdoor'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'table_004',
    merchantId: 'merchant_demo',
    number: '4',
    capacity: 8,
    status: TableStatus.AVAILABLE,
    section: 'private',
    shape: TableShape.RECTANGLE,
    position: { x: 400, y: 100 },
    dimensions: { width: 200, height: 100 },
    amenities: ['private', 'av_equipment', 'sound_system'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'table_005',
    merchantId: 'merchant_demo',
    number: '5',
    capacity: 4,
    status: TableStatus.CLEANING,
    section: 'main',
    shape: TableShape.SQUARE,
    position: { x: 250, y: 250 },
    dimensions: { width: 100, height: 100 },
    amenities: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockFloorPlan: FloorPlan = {
  id: 'floor_001',
  merchantId: 'merchant_demo',
  name: 'Main Floor',
  sections: [
    {
      id: 'section_main',
      name: 'Main Dining',
      color: '#E8F4FD',
      bounds: { x: 50, y: 50, width: 350, height: 350 },
      order: 1,
    },
    {
      id: 'section_patio',
      name: 'Patio',
      color: '#E8F8E8',
      bounds: { x: 50, y: 420, width: 200, height: 150 },
      order: 2,
    },
    {
      id: 'section_private',
      name: 'Private Room',
      color: '#FDE8E8',
      bounds: { x: 420, y: 50, width: 250, height: 200 },
      order: 3,
    },
  ],
  tables: mockTables,
  canvasSize: { width: 800, height: 600 },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockReservations: Reservation[] = [
  {
    id: 'res_001',
    merchantId: 'merchant_demo',
    guestInfo: {
      name: 'John Smith',
      phone: '+1234567890',
      email: 'john@example.com',
      visitCount: 5,
    },
    tableId: 'table_001',
    partySize: 4,
    dateTime: new Date(Date.now() + 3600000), // 1 hour from now
    duration: 90,
    status: ReservationStatus.CONFIRMED,
    source: ReservationSource.ONLINE,
    specialRequests: ['Anniversary dinner', 'Champagne on arrival'],
    occasion: 'Anniversary',
    depositRequired: false,
    depositPaid: false,
    confirmationCode: 'ABC123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'res_002',
    merchantId: 'merchant_demo',
    guestInfo: {
      name: 'Sarah Johnson',
      phone: '+1987654321',
      visitCount: 12,
    },
    tableId: 'table_002',
    partySize: 6,
    dateTime: new Date(Date.now() + 7200000), // 2 hours from now
    duration: 120,
    status: ReservationStatus.PENDING,
    source: ReservationSource.PHONE,
    specialRequests: ['Gluten-free options needed'],
    dietaryRestrictions: ['gluten_free'],
    depositRequired: true,
    depositPaid: true,
    depositAmount: 50,
    confirmationCode: 'DEF456',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'res_003',
    merchantId: 'merchant_demo',
    guestInfo: {
      name: 'Michael Chen',
      phone: '+1555555555',
      email: 'mchen@company.com',
    },
    tableId: 'table_004',
    partySize: 8,
    dateTime: new Date(Date.now() + 86400000), // Tomorrow
    duration: 150,
    status: ReservationStatus.CONFIRMED,
    source: ReservationSource.APP,
    specialRequests: ['Business dinner', 'Projector needed'],
    occasion: 'Business',
    depositRequired: true,
    depositPaid: true,
    depositAmount: 100,
    confirmationCode: 'GHI789',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'wait_001',
    merchantId: 'merchant_demo',
    guestInfo: {
      name: 'Emily Davis',
      phone: '+1111111111',
    },
    partySize: 2,
    quotedWaitTime: 15,
    status: WaitlistStatus.NOTIFIED,
    tableSize: 2,
    position: 1,
    notifiedAt: new Date(Date.now() - 300000),
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(),
  },
  {
    id: 'wait_002',
    merchantId: 'merchant_demo',
    guestInfo: {
      name: 'Robert Wilson',
      phone: '+2222222222',
    },
    partySize: 4,
    quotedWaitTime: 25,
    status: WaitlistStatus.WAITING,
    tableSize: 4,
    position: 2,
    createdAt: new Date(Date.now() - 1200000),
    updatedAt: new Date(),
  },
];

// Mock data - using deterministic values for test consistency
// NOTE: These are mock analytics values, not security-sensitive
const mockAnalytics: TableAnalytics = {
  totalCovers: 245,
  averageTurnTime: 72,
  tableUtilization: mockTables.map((table, index) => ({
    tableId: table.id,
    tableNumber: table.number,
    // Deterministic mock values based on index for test consistency
    utilizationRate: Math.round(40 + ((index + 1) * 10) % 50),
    totalCovers: Math.round(20 + ((index + 1) * 8) % 40),
    averageTurnTime: Math.round(60 + ((index + 1) * 5) % 30),
  })),
  peakHours: [
    { hour: 11, covers: 15 },
    { hour: 12, covers: 45 },
    { hour: 13, covers: 38 },
    { hour: 18, covers: 52 },
    { hour: 19, covers: 65 },
    { hour: 20, covers: 48 },
    { hour: 21, covers: 22 },
  ],
  reservationStats: {
    total: 32,
    confirmed: 25,
    cancelled: 4,
    noShow: 3,
    completionRate: 78.5,
  },
  waitlistStats: {
    total: 18,
    averageWaitTime: 22,
    leftBeforeSeating: 2,
  },
  tablePopularity: mockTables.slice(0, 3).map((table, index) => ({
    tableId: table.id,
    tableNumber: table.number,
    // Deterministic mock values based on index for test consistency
    reservations: Math.round(5 + ((index + 1) * 2) % 10),
    covers: Math.round(20 + ((index + 1) * 5) % 30),
  })),
  periodComparison: {
    previousPeriod: {
      totalCovers: 220,
      averageTurnTime: 75,
    },
    changePercent: {
      totalCovers: 11.4,
      averageTurnTime: -4.0,
    },
  },
};

// ============================================================================
// Custom Errors
// ============================================================================

export class DineInServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DineInServiceError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TableNotFoundError extends DineInServiceError {
  constructor(tableId: string) {
    super(`Table with ID "${tableId}" not found`, 'TABLE_NOT_FOUND', 404);
    this.name = 'TableNotFoundError';
  }
}

export class ReservationNotFoundError extends DineInServiceError {
  constructor(reservationId: string) {
    super(`Reservation with ID "${reservationId}" not found`, 'RESERVATION_NOT_FOUND', 404);
    this.name = 'ReservationNotFoundError';
  }
}

export class WaitlistEntryNotFoundError extends DineInServiceError {
  constructor(waitlistId: string) {
    super(`Waitlist entry with ID "${waitlistId}" not found`, 'WAITLIST_ENTRY_NOT_FOUND', 404);
    this.name = 'WaitlistEntryNotFoundError';
  }
}

export class ValidationError extends DineInServiceError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// DineInService Class
// ============================================================================

class DineInService {
  private baseUrl: string;
  private apiClient: ApiClient;
  private useMockData: boolean;
  private mockTables: Table[];
  private mockReservations: Reservation[];
  private mockWaitlist: WaitlistEntry[];
  private retryConfig: RetryConfig;

  constructor(
    baseUrl: string = 'https://rez-merchant-service.onrender.com/api/v1',
    useMockData: boolean = false,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.baseUrl = baseUrl;
    this.apiClient = new ApiClient(baseUrl);
    this.useMockData = useMockData;
    this.mockTables = [...mockTables];
    this.mockReservations = [...mockReservations];
    this.mockWaitlist = [...mockWaitlist];
    this.retryConfig = retryConfig;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Execute a function with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig: RetryConfig = this.retryConfig
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw error;
        }

        // Don't wait after last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);

        console.warn(
          `[DineInService] ${operationName} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw new DineInServiceError(
      `${operationName} failed after ${retryConfig.maxRetries + 1} attempts`,
      'OPERATION_FAILED',
      undefined,
      lastError
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isClientError(error: unknown): boolean {
    if (error instanceof DineInServiceError && error.statusCode) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      return statusCode >= 400 && statusCode < 500;
    }
    return false;
  }

  private handleApiError(error: unknown, context: string): never {
    if (error instanceof DineInServiceError) {
      throw error;
    }

    if (error && typeof error === 'object') {
      const err = error as { message?: string; response?: { data?: { message?: string } } };

      if (err.response?.data?.message) {
        throw new DineInServiceError(err.response.data.message, 'API_ERROR', 500, error as Error);
      }
      if (err.message) {
        throw new DineInServiceError(err.message, 'API_ERROR', 500, error as Error);
      }
    }

    throw new DineInServiceError(
      `Failed to ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN_ERROR',
      500,
      error instanceof Error ? error : undefined
    );
  }

  private validateRequired(value: unknown, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
  }

  private validatePositiveNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
    }
  }

  // ==========================================================================
  // Table Methods
  // ==========================================================================

  /**
   * Get all tables for a merchant
   */
  async getTables(merchantId: string): Promise<Table[]> {
    this.validateRequired(merchantId, 'merchantId');

    if (this.useMockData) {
      await this.sleep(300); // Simulate network delay
      return this.mockTables.filter((t) => t.merchantId === merchantId && t.isActive);
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<Table[]>(`/tables`, {
          params: { merchantId },
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'get tables');
      }
    }, 'getTables');
  }

  /**
   * Get a single table by ID
   */
  async getTableById(id: string): Promise<Table> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(200);
      const table = this.mockTables.find((t) => t.id === id);
      if (!table) {
        throw new TableNotFoundError(id);
      }
      return table;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<Table>(`/tables/${id}`);
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new TableNotFoundError(id);
        }
        this.handleApiError(error, 'get table');
      }
    }, 'getTableById');
  }

  /**
   * Create a new table
   */
  async createTable(data: CreateTable): Promise<Table> {
    // Validation
    this.validateRequired(data.number, 'number');
    this.validateRequired(data.capacity, 'capacity');
    this.validatePositiveNumber(data.capacity, 'capacity');
    this.validateRequired(data.position, 'position');

    if (data.minCapacity !== undefined && data.minCapacity > data.capacity) {
      throw new ValidationError('minCapacity cannot be greater than capacity', 'minCapacity');
    }

    if (this.useMockData) {
      await this.sleep(400);
      const newTable: Table = {
        id: generateMockId(),
        merchantId: 'merchant_demo',
        number: data.number,
        name: data.name,
        capacity: data.capacity,
        minCapacity: data.minCapacity,
        status: TableStatus.AVAILABLE,
        section: data.section,
        shape: data.shape || TableShape.RECTANGLE,
        position: data.position,
        dimensions: data.dimensions,
        amenities: data.amenities || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockTables.push(newTable);
      return newTable;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.post<Table>('/tables', data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'create table');
      }
    }, 'createTable');
  }

  /**
   * Update an existing table
   */
  async updateTable(id: string, data: UpdateTable): Promise<Table> {
    this.validateRequired(id, 'id');

    if (data.capacity !== undefined) {
      this.validatePositiveNumber(data.capacity, 'capacity');
    }

    if (data.minCapacity !== undefined && data.capacity !== undefined && data.minCapacity > data.capacity) {
      throw new ValidationError('minCapacity cannot be greater than capacity', 'minCapacity');
    }

    if (this.useMockData) {
      await this.sleep(350);
      const tableIndex = this.mockTables.findIndex((t) => t.id === id);
      if (tableIndex === -1) {
        throw new TableNotFoundError(id);
      }
      const updatedTable: Table = {
        ...this.mockTables[tableIndex],
        ...data,
        updatedAt: new Date(),
      };
      this.mockTables[tableIndex] = updatedTable;
      return updatedTable;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.put<Table>(`/tables/${id}`, data);
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new TableNotFoundError(id);
        }
        this.handleApiError(error, 'update table');
      }
    }, 'updateTable');
  }

  /**
   * Delete a table (soft delete by setting isActive to false)
   */
  async deleteTable(id: string): Promise<void> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(300);
      const tableIndex = this.mockTables.findIndex((t) => t.id === id);
      if (tableIndex === -1) {
        throw new TableNotFoundError(id);
      }
      this.mockTables[tableIndex].isActive = false;
      this.mockTables[tableIndex].updatedAt = new Date();
      return;
    }

    return this.withRetry(async () => {
      try {
        await this.apiClient.delete(`/tables/${id}`);
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new TableNotFoundError(id);
        }
        this.handleApiError(error, 'delete table');
      }
    }, 'deleteTable');
  }

  /**
   * Update table status
   */
  async updateTableStatus(id: string, status: TableStatus): Promise<Table> {
    this.validateRequired(id, 'id');
    this.validateRequired(status, 'status');

    if (!Object.values(TableStatus).includes(status)) {
      throw new ValidationError(`Invalid table status: ${status}`, 'status');
    }

    if (this.useMockData) {
      await this.sleep(250);
      const tableIndex = this.mockTables.findIndex((t) => t.id === id);
      if (tableIndex === -1) {
        throw new TableNotFoundError(id);
      }
      this.mockTables[tableIndex].status = status;
      this.mockTables[tableIndex].updatedAt = new Date();
      return this.mockTables[tableIndex];
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.patch<Table>(`/tables/${id}/status`, { status });
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new TableNotFoundError(id);
        }
        this.handleApiError(error, 'update table status');
      }
    }, 'updateTableStatus');
  }

  // ==========================================================================
  // Floor Plan Methods
  // ==========================================================================

  /**
   * Get floor plan for a merchant
   */
  async getFloorPlan(merchantId: string): Promise<FloorPlan> {
    this.validateRequired(merchantId, 'merchantId');

    if (this.useMockData) {
      await this.sleep(350);
      return {
        ...mockFloorPlan,
        merchantId,
        tables: this.mockTables.filter((t) => t.merchantId === merchantId && t.isActive),
      };
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<FloorPlan>(`/floor-plans`, {
          params: { merchantId },
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'get floor plan');
      }
    }, 'getFloorPlan');
  }

  /**
   * Save (create or update) floor plan for a merchant
   */
  async saveFloorPlan(merchantId: string, data: FloorPlan): Promise<FloorPlan> {
    this.validateRequired(merchantId, 'merchantId');
    this.validateRequired(data.sections, 'sections');
    this.validateRequired(data.canvasSize, 'canvasSize');

    if (this.useMockData) {
      await this.sleep(500);
      const savedFloorPlan: FloorPlan = {
        ...mockFloorPlan,
        ...data,
        id: data.id || generateMockId(),
        merchantId,
        updatedAt: new Date(),
        createdAt: data.createdAt || new Date(),
      };
      return savedFloorPlan;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.put<FloorPlan>(`/floor-plans`, {
          merchantId,
          ...data,
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'save floor plan');
      }
    }, 'saveFloorPlan');
  }

  // ==========================================================================
  // Reservation Methods
  // ==========================================================================

  /**
   * Get reservations for a merchant, optionally filtered by date
   */
  async getReservations(merchantId: string, date?: Date): Promise<Reservation[]> {
    this.validateRequired(merchantId, 'merchantId');

    if (this.useMockData) {
      await this.sleep(300);
      let reservations = this.mockReservations.filter((r) => r.merchantId === merchantId);

      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        reservations = reservations.filter((r) => {
          const resDateStr = new Date(r.dateTime).toISOString().split('T')[0];
          return resDateStr === dateStr;
        });
      }

      return reservations;
    }

    return this.withRetry(async () => {
      try {
        const params: Record<string, string> = { merchantId };
        if (date) {
          params.date = date.toISOString().split('T')[0];
        }
        const response = await this.apiClient.get<Reservation[]>('/reservations', { params });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'get reservations');
      }
    }, 'getReservations');
  }

  /**
   * Get a single reservation by ID
   */
  async getReservationById(id: string): Promise<Reservation> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(200);
      const reservation = this.mockReservations.find((r) => r.id === id);
      if (!reservation) {
        throw new ReservationNotFoundError(id);
      }
      return reservation;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<Reservation>(`/reservations/${id}`);
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new ReservationNotFoundError(id);
        }
        this.handleApiError(error, 'get reservation');
      }
    }, 'getReservationById');
  }

  /**
   * Create a new reservation
   */
  async createReservation(data: CreateReservation): Promise<Reservation> {
    // Validation
    this.validateRequired(data.merchantId, 'merchantId');
    this.validateRequired(data.guestInfo, 'guestInfo');
    this.validateRequired(data.guestInfo.name, 'guestInfo.name');
    this.validatePositiveNumber(data.partySize, 'partySize');
    this.validateRequired(data.dateTime, 'dateTime');

    if (data.partySize > 20) {
      throw new ValidationError('Party size cannot exceed 20 for online reservations', 'partySize');
    }

    const now = new Date();
    const reservationDate = new Date(data.dateTime);
    if (reservationDate < now) {
      throw new ValidationError('Reservation date cannot be in the past', 'dateTime');
    }

    if (this.useMockData) {
      await this.sleep(450);
      const confirmationCode = this.generateConfirmationCode();
      const newReservation: Reservation = {
        id: generateMockId(),
        merchantId: data.merchantId,
        guestInfo: data.guestInfo,
        tableId: data.tableId,
        tableIds: data.tableIds,
        partySize: data.partySize,
        dateTime: data.dateTime,
        duration: data.duration || 90,
        status: ReservationStatus.PENDING,
        source: data.source || ReservationSource.APP,
        specialRequests: data.specialRequests,
        dietaryRestrictions: data.dietaryRestrictions,
        occasion: data.occasion,
        depositRequired: data.depositRequired || false,
        depositPaid: false,
        depositAmount: data.depositAmount,
        confirmationCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockReservations.push(newReservation);
      return newReservation;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.post<Reservation>('/reservations', data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'create reservation');
      }
    }, 'createReservation');
  }

  /**
   * FIX (security): Generate secure confirmation code using crypto
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Use crypto for secure random code generation
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const array = new Uint8Array(6);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, b => chars[b % chars.length]).join('');
    }
    // Node.js fallback
    try {
      const { randomBytes } = require('crypto');
      const bytes = randomBytes(6);
      return Array.from(bytes, b => chars[b % chars.length]).join('');
    } catch {
      // Legacy fallback (only for environments without crypto)
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }
  }

  /**
   * Update an existing reservation
   */
  async updateReservation(id: string, data: UpdateReservation): Promise<Reservation> {
    this.validateRequired(id, 'id');

    if (data.partySize !== undefined) {
      this.validatePositiveNumber(data.partySize, 'partySize');
    }

    if (data.dateTime) {
      const now = new Date();
      const reservationDate = new Date(data.dateTime);
      if (reservationDate < now) {
        throw new ValidationError('Reservation date cannot be in the past', 'dateTime');
      }
    }

    if (this.useMockData) {
      await this.sleep(400);
      const resIndex = this.mockReservations.findIndex((r) => r.id === id);
      if (resIndex === -1) {
        throw new ReservationNotFoundError(id);
      }

      const existingReservation = this.mockReservations[resIndex];

      // Prevent updates to completed/cancelled reservations
      if (
        existingReservation.status === ReservationStatus.COMPLETED ||
        existingReservation.status === ReservationStatus.CANCELLED
      ) {
        throw new ValidationError('Cannot update a completed or cancelled reservation');
      }

      const updatedReservation: Reservation = {
        ...existingReservation,
        ...data,
        updatedAt: new Date(),
      };
      this.mockReservations[resIndex] = updatedReservation;
      return updatedReservation;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.put<Reservation>(`/reservations/${id}`, data);
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new ReservationNotFoundError(id);
        }
        this.handleApiError(error, 'update reservation');
      }
    }, 'updateReservation');
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(id: string): Promise<void> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(300);
      const resIndex = this.mockReservations.findIndex((r) => r.id === id);
      if (resIndex === -1) {
        throw new ReservationNotFoundError(id);
      }

      const reservation = this.mockReservations[resIndex];
      if (
        reservation.status === ReservationStatus.CANCELLED ||
        reservation.status === ReservationStatus.COMPLETED
      ) {
        throw new ValidationError('Reservation is already cancelled or completed');
      }

      this.mockReservations[resIndex] = {
        ...reservation,
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      };
      return;
    }

    return this.withRetry(async () => {
      try {
        await this.apiClient.delete(`/reservations/${id}`);
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new ReservationNotFoundError(id);
        }
        this.handleApiError(error, 'cancel reservation');
      }
    }, 'cancelReservation');
  }

  /**
   * Confirm a reservation
   */
  async confirmReservation(id: string): Promise<Reservation> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(250);
      const resIndex = this.mockReservations.findIndex((r) => r.id === id);
      if (resIndex === -1) {
        throw new ReservationNotFoundError(id);
      }

      const reservation = this.mockReservations[resIndex];
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ValidationError('Only pending reservations can be confirmed');
      }

      this.mockReservations[resIndex] = {
        ...reservation,
        status: ReservationStatus.CONFIRMED,
        updatedAt: new Date(),
      };
      return this.mockReservations[resIndex];
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.patch<Reservation>(`/reservations/${id}/confirm`);
        return response.data;
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new ReservationNotFoundError(id);
        }
        this.handleApiError(error, 'confirm reservation');
      }
    }, 'confirmReservation');
  }

  // ==========================================================================
  // Waitlist Methods
  // ==========================================================================

  /**
   * Get current waitlist for a merchant
   */
  async getWaitlist(merchantId: string): Promise<WaitlistEntry[]> {
    this.validateRequired(merchantId, 'merchantId');

    if (this.useMockData) {
      await this.sleep(250);
      return this.mockWaitlist
        .filter((w) => w.merchantId === merchantId && w.status !== WaitlistStatus.CANCELLED)
        .sort((a, b) => a.position - b.position);
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<WaitlistEntry[]>('/waitlist', {
          params: { merchantId },
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'get waitlist');
      }
    }, 'getWaitlist');
  }

  /**
   * Add a guest to the waitlist
   */
  async addToWaitlist(data: AddToWaitlist): Promise<WaitlistEntry> {
    // Validation
    this.validateRequired(data.merchantId, 'merchantId');
    this.validateRequired(data.guestInfo, 'guestInfo');
    this.validateRequired(data.guestInfo.name, 'guestInfo.name');
    this.validatePositiveNumber(data.partySize, 'partySize');

    if (this.useMockData) {
      await this.sleep(350);
      const currentWaitlist = this.mockWaitlist.filter(
        (w) => w.merchantId === data.merchantId && w.status === WaitlistStatus.WAITING
      );
      const position = currentWaitlist.length + 1;

      const newEntry: WaitlistEntry = {
        id: generateMockId(),
        merchantId: data.merchantId,
        guestInfo: data.guestInfo,
        partySize: data.partySize,
        quotedWaitTime: this.calculateQuotedWaitTime(data.partySize),
        status: WaitlistStatus.WAITING,
        tableSize: data.tableSize,
        position,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockWaitlist.push(newEntry);
      return newEntry;
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.post<WaitlistEntry>('/waitlist', data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'add to waitlist');
      }
    }, 'addToWaitlist');
  }

  private calculateQuotedWaitTime(partySize: number): number {
    // Simple algorithm - in production this would be more sophisticated
    const baseWaitTime = 10;
    const perPersonWait = 5;
    return baseWaitTime + (partySize - 1) * perPersonWait;
  }

  /**
   * Remove a guest from the waitlist
   */
  async removeFromWaitlist(id: string): Promise<void> {
    this.validateRequired(id, 'id');

    if (this.useMockData) {
      await this.sleep(200);
      const entryIndex = this.mockWaitlist.findIndex((w) => w.id === id);
      if (entryIndex === -1) {
        throw new WaitlistEntryNotFoundError(id);
      }

      this.mockWaitlist[entryIndex] = {
        ...this.mockWaitlist[entryIndex],
        status: WaitlistStatus.CANCELLED,
        leftAt: new Date(),
        updatedAt: new Date(),
      };
      return;
    }

    return this.withRetry(async () => {
      try {
        await this.apiClient.delete(`/waitlist/${id}`);
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          throw new WaitlistEntryNotFoundError(id);
        }
        this.handleApiError(error, 'remove from waitlist');
      }
    }, 'removeFromWaitlist');
  }

  /**
   * Seat a guest from the waitlist at a specific table
   */
  async seatFromWaitlist(waitlistId: string, tableId: string): Promise<void> {
    this.validateRequired(waitlistId, 'waitlistId');
    this.validateRequired(tableId, 'tableId');

    if (this.useMockData) {
      await this.sleep(300);
      const entryIndex = this.mockWaitlist.findIndex((w) => w.id === waitlistId);
      if (entryIndex === -1) {
        throw new WaitlistEntryNotFoundError(waitlistId);
      }

      const tableIndex = this.mockTables.findIndex((t) => t.id === tableId);
      if (tableIndex === -1) {
        throw new TableNotFoundError(tableId);
      }

      // Update waitlist entry
      const startTime = this.mockWaitlist[entryIndex].createdAt;
      const actualWaitTime = Math.round((Date.now() - startTime.getTime()) / 60000);

      this.mockWaitlist[entryIndex] = {
        ...this.mockWaitlist[entryIndex],
        status: WaitlistStatus.SEATED,
        seatedAt: new Date(),
        actualWaitTime,
        updatedAt: new Date(),
      };

      // Update table status
      this.mockTables[tableIndex].status = TableStatus.OCCUPIED;
      this.mockTables[tableIndex].updatedAt = new Date();
      return;
    }

    return this.withRetry(async () => {
      try {
        await this.apiClient.post(`/waitlist/${waitlistId}/seat`, { tableId });
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
          const isWaitlistNotFound = (error as { message?: string }).message?.includes('waitlist');
          if (isWaitlistNotFound) {
            throw new WaitlistEntryNotFoundError(waitlistId);
          }
          throw new TableNotFoundError(tableId);
        }
        this.handleApiError(error, 'seat from waitlist');
      }
    }, 'seatFromWaitlist');
  }

  // ==========================================================================
  // Analytics Methods
  // ==========================================================================

  /**
   * Get table analytics for a date range
   */
  async getTableAnalytics(merchantId: string, dateRange: DateRange): Promise<TableAnalytics> {
    this.validateRequired(merchantId, 'merchantId');
    this.validateRequired(dateRange.startDate, 'startDate');
    this.validateRequired(dateRange.endDate, 'endDate');

    if (dateRange.startDate > dateRange.endDate) {
      throw new ValidationError('startDate must be before endDate', 'startDate');
    }

    if (this.useMockData) {
      await this.sleep(500);
      return {
        ...mockAnalytics,
        totalCovers: Math.round(100 + Math.random() * 200),
        averageTurnTime: Math.round(60 + Math.random() * 30),
      };
    }

    return this.withRetry(async () => {
      try {
        const response = await this.apiClient.get<TableAnalytics>('/analytics/tables', {
          params: {
            merchantId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          },
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'get table analytics');
      }
    }, 'getTableAnalytics');
  }

  // ==========================================================================
  // Utility Methods for Testing
  // ==========================================================================

  /**
   * Enable/disable mock data mode
   */
  setMockDataMode(enabled: boolean): void {
    this.useMockData = enabled;
  }

  /**
   * Reset mock data to initial state
   */
  resetMockData(): void {
    this.mockTables = [...mockTables];
    this.mockReservations = [...mockReservations];
    this.mockWaitlist = [...mockWaitlist];
  }

  /**
   * Get current mock data (for testing purposes)
   */
  getMockData(): {
    tables: Table[];
    reservations: Reservation[];
    waitlist: WaitlistEntry[];
  } {
    return {
      tables: this.mockTables,
      reservations: this.mockReservations,
      waitlist: this.mockWaitlist,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let dineInServiceInstance: DineInService | null = null;

export const getDineInService = (
  baseUrl?: string,
  useMockData?: boolean
): DineInService => {
  if (!dineInServiceInstance) {
    dineInServiceInstance = new DineInService(baseUrl, useMockData);
  }
  return dineInServiceInstance;
};

export const createDineInService = (
  baseUrl?: string,
  useMockData?: boolean
): DineInService => {
  return new DineInService(baseUrl, useMockData);
};

export default DineInService;
