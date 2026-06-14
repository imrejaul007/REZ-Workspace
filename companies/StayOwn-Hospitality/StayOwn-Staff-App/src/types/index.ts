/**
 * TypeScript types for StayOwn Staff App
 */

// Sync Operations
export type OperationType =
  | 'ROOM_STATUS_UPDATE'
  | 'HOUSEKEEPING_TASK_UPDATE'
  | 'MAINTENANCE_ISSUE_CREATE'
  | 'MAINTENANCE_ISSUE_UPDATE'
  | 'GUEST_CHECK_IN'
  | 'GUEST_CHECK_OUT'
  | 'SERVICE_REQUEST_UPDATE'
  | 'MESSAGE_SEND'
  | 'INVENTORY_UPDATE'
  | 'TASK_COMPLETE'
  | 'NOTE_ADD';

export type EntityType =
  | 'room'
  | 'housekeeping'
  | 'maintenance'
  | 'guest'
  | 'service_request'
  | 'message'
  | 'inventory'
  | 'task'
  | 'note';

export type ConflictStrategy = 'SERVER_WINS' | 'CLIENT_WINS' | 'LAST_WRITE_WINS' | 'MANUAL' | 'MERGE';

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';

export type ConflictResolution = 'pending' | 'server_wins' | 'client_wins' | 'merged' | 'manual';

// Sync Operation
export interface SyncOperation {
  id: string;
  staffId: string;
  deviceId: string;
  operationType: OperationType;
  entityType: EntityType;
  entityId: string;
  data: Record<string, any>;
  priority: Priority;
  conflictStrategy: ConflictStrategy;
  timestamp: string;
  clientVersion?: number;
  parentOperationId?: string;
  status: SyncStatus;
  attempts?: number;
  lastAttempt?: string;
  error?: string;
  serverVersion?: number;
  result?: any;
  createdAt: string;
  processedAt?: string;
}

// Pending Operation (for queue display)
export interface PendingOperation {
  id: string;
  operationType: OperationType;
  entityType: EntityType;
  entityId: string;
  data: any;
  priority: Priority;
  status: SyncStatus;
  timestamp: string;
  error?: string;
  retryCount: number;
}

// Conflict
export interface Conflict {
  id: string;
  operationId: string;
  entityType: EntityType;
  entityId: string;
  serverData: Record<string, any>;
  clientData: Record<string, any>;
  resolution: ConflictResolution;
  createdAt: string;
}

// Room Types
export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance' | 'blocked';

export interface Room {
  id: string;
  roomNumber: string;
  floor: string;
  type: 'standard' | 'deluxe' | 'suite' | 'penthouse';
  status: RoomStatus;
  guestName?: string;
  guestId?: string;
  checkout?: string;
  notes?: string;
  lastCleaned?: string;
  version: number;
  lastModified: string;
}

export interface RoomUpdate {
  roomId: string;
  status?: RoomStatus;
  notes?: string;
  guestName?: string;
  checkout?: string;
}

// Housekeeping
export type HKTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  type: 'checkout_clean' | 'stay_clean' | 'deep_clean' | 'turndown';
  status: HKTaskStatus;
  priority: Priority;
  assignedTo?: string;
  scheduledTime?: string;
  completedTime?: string;
  notes?: string;
  version: number;
  lastModified: string;
}

// Maintenance
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent';

export type MaintenanceStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export interface MaintenanceIssue {
  id: string;
  roomId: string;
  roomNumber: string;
  category: 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'other';
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy?: string;
  assignedTo?: string;
  images?: string[];
  resolvedTime?: string;
  notes?: string;
  version: number;
  lastModified: string;
}

// Guest
export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone: string;
  roomId?: string;
  roomNumber?: string;
  checkin?: string;
  checkout?: string;
  totalGuests: number;
  notes?: string;
}

// Service Request
export type ServiceRequestType = 'housekeeping' | 'room_service' | 'maintenance' | 'concierge' | 'restaurant';

export type ServiceRequestStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  roomId: string;
  roomNumber: string;
  type: ServiceRequestType;
  request: string;
  status: ServiceRequestStatus;
  priority: Priority;
  guestId?: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  version: number;
  lastModified: string;
}

// Message
export interface Message {
  id: string;
  guestId?: string;
  roomNumber?: string;
  senderType: 'guest' | 'staff';
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// Staff
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'front_desk' | 'housekeeping' | 'maintenance' | 'manager' | 'admin';
  department: string;
  avatar?: string;
}

// Device Info
export interface DeviceInfo {
  deviceId: string;
  deviceType: 'ios' | 'android' | 'tablet';
  appVersion: string;
  lastSync?: string;
}

// Sync State
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync?: string;
  pendingOperations: number;
  conflicts: number;
  error?: string;
}

// Sync Result
export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
