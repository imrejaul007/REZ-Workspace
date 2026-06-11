/**
 * FLEETIQ - Type Definitions
 * Central type exports for the application
 */

// Re-export model types
export type {
  IVehicle,
  IDriver,
  ITrip,
  IMaintenance
} from '../models';

// Re-export validation schemas
export {
  VehicleSchemaValidation,
  DriverSchemaValidation,
  TripSchemaValidation,
  MaintenanceSchemaValidation
} from '../models';

// Re-export auth types
export type {
  JwtPayload,
  AuthenticatedRequest
} from '../middleware/auth';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Agent Types
export interface AIEmployee {
  name: string;
  status: 'active' | 'inactive' | 'busy';
  capabilities: string[];
}

export interface AIStatus {
  active: boolean;
  employees: AIEmployee[];
  uptime: number;
}

// Request/Response Types
export interface CreateVehicleRequest {
  registrationNumber: string;
  type: 'truck' | 'van' | 'car' | 'bike';
  capacity: number;
  status?: 'available' | 'on-trip' | 'maintenance' | 'idle';
  fuelLevel?: number;
  location?: { lat: number; lng: number; address?: string };
  driverId?: string;
}

export interface CreateDriverRequest {
  name: string;
  phone: string;
  licenseNumber: string;
  status?: 'available' | 'on-trip' | 'off-duty';
}

export interface CreateTripRequest {
  vehicleId: string;
  driverId: string;
  origin: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  cargoWeight?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateMaintenanceRequest {
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'emergency';
  description: string;
  cost?: number;
  date?: string;
}

export interface DispatchOptimizeRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  cargoWeight?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  preferences?: {
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
    avoidHighways?: boolean;
  };
}

export interface RouteCalculateRequest {
  stops: Array<{ lat: number; lng: number; address?: string; order?: number }>;
  optimize?: boolean;
  preferences?: {
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    fastestRoute?: boolean;
  };
}

export interface FleetAnalyzeRequest {
  metrics?: Array<'utilization' | 'fuel' | 'maintenance' | 'performance'>;
  period?: 'day' | 'week' | 'month' | 'quarter';
}

export interface DriverCoachRequest {
  driverId: string;
  situation: 'route_planning' | 'fuel_management' | 'break_reminder' | 'safety_tip' | 'performance_review';
  context?: Record<string, any>;
}

// Analytics Types
export interface DashboardSummary {
  vehicles: {
    totalVehicles: number;
    availableVehicles: number;
    activeVehicles: number;
    maintenanceVehicles: number;
    idleVehicles: number;
    averageFuelLevel: number;
    averageUtilization: number;
  };
  trips: {
    active: number;
    completed: number;
    total: number;
  };
  drivers: {
    available: number;
    onTrip: number;
    total: number;
    averageRating: number;
  };
  maintenance: {
    pending: number;
    inProgress: number;
    completed: number;
  };
}