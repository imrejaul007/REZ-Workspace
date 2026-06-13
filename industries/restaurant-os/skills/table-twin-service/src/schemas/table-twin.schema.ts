// Table Twin Schema - Defines types and validation for Table Twin Service

export enum TableStatus {
  AVAILABLE = 'available',
  SEATED = 'seated',
  ORDERING = 'ordering',
  EATING = 'eating',
  BILLING = 'billing',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
  BLOCKED = 'blocked'
}

export enum TableZone {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
  TERRACE = 'terrace',
  PRIVATE = 'private',
  BAR = 'bar',
  PATIO = 'patio'
}

export interface TurnTimes {
  seatedAt?: string;
  orderPlacedAt?: string;
  billRequestedAt?: string;
  clearedAt?: string;
}

export interface TodayMetrics {
  covers: number;
  avgTurnTime: number;
  revenue: number;
  ordersCount: number;
}

export interface TableTwinDocument {
  twinId: string;
  tableId: string;
  restaurantId: string;
  tableNumber: number;
  seats: number;
  zone: TableZone;
  status: TableStatus;
  currentSessionId?: string;
  currentOrderId?: string;
  currentCustomerCount?: number;
  turnTimes: TurnTimes;
  todayMetrics: TodayMetrics;
  reservationId?: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response Types
export interface CreateTableTwinRequest {
  tableId: string;
  restaurantId: string;
  tableNumber: number;
  seats: number;
  zone?: TableZone;
}

export interface CreateTableTwinResponse {
  twinId: string;
  tableId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetTableTwinResponse extends TableTwinDocument {
  twinOsEntityId: string;
}

export interface UpdateTableStatusRequest {
  status: TableStatus;
  customerCount?: number;
}

export interface UpdateTableStatusResponse {
  twinId: string;
  tableId: string;
  status: TableStatus;
  turnTimes: TurnTimes;
  updatedAt: string;
}

export interface SeatTableRequest {
  sessionId: string;
  customerCount: number;
}

export interface SeatTableResponse {
  twinId: string;
  tableId: string;
  sessionId: string;
  seatedAt: string;
  updatedAt: string;
}

export interface ClearTableRequest {
  reason?: string;
}

export interface ClearTableResponse {
  twinId: string;
  tableId: string;
  clearedAt: string;
  avgTurnTime: number;
  revenue: number;
  updatedAt: string;
}

export interface UpdateTurnTimeRequest {
  turnTimeType: 'seated' | 'orderPlaced' | 'billRequested' | 'cleared';
}

export interface ListTablesRequest {
  restaurantId: string;
  status?: TableStatus;
  zone?: TableZone;
  limit?: number;
  offset?: number;
}

export interface ListTablesResponse {
  tables: TableTwinDocument[];
  total: number;
  availableCount: number;
  occupiedCount: number;
}

export interface GetTableAvailabilityRequest {
  restaurantId: string;
  partySize: number;
  date?: string;
}

export interface GetTableAvailabilityResponse {
  availableTables: {
    tableId: string;
    tableNumber: number;
    seats: number;
    zone: TableZone;
  }[];
  recommendedTable?: {
    tableId: string;
    tableNumber: number;
    seats: number;
  };
}

// Default values
export const defaultTurnTimes: TurnTimes = {
  seatedAt: undefined,
  orderPlacedAt: undefined,
  billRequestedAt: undefined,
  clearedAt: undefined
};

export const defaultTodayMetrics: TodayMetrics = {
  covers: 0,
  avgTurnTime: 0,
  revenue: 0,
  ordersCount: 0
};
