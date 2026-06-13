// Enums
export enum VehicleCategory {
  SEDAN = 'sedan',
  SUV = 'suv',
  VAN = 'van',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  ELECTRIC = 'electric',
  BIKE = 'bike',
  SCOOTER = 'scooter'
}

export enum VehicleOwnershipType {
  OWNED = 'owned',
  LEASED = 'leased',
  RENTED = 'rented',
  PARTNER = 'partner'
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  CHARGING = 'charging',
  CLEANING = 'cleaning'
}

export enum EngineStatus {
  OK = 'ok',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum BrakeStatus {
  OK = 'ok',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// Interfaces
export interface VehicleCapacity {
  passengers: number;
  cargoWeightKg: number;
  cargoVolumeM3: number;
}

export interface VehicleLocation {
  lat: number;
  lng: number;
  address: string | null;
  updatedAt: Date;
}

export interface VehicleDiagnostics {
  engineStatus: EngineStatus;
  tirePressure: number[];
  brakeStatus: BrakeStatus;
  oilLevel: number;
  coolantTemp: number;
  errorCodes: string[];
}

export interface MaintenanceRecord {
  nextServiceDate: Date;
  nextServiceKm: number;
  lastServiceDate: Date;
  lastServiceKm: number;
  insuranceExpiry: Date;
  registrationExpiry: Date;
  inspectionExpiry: Date;
  alerts: string[];
}

export interface VehicleUtilization {
  todayTrips: number;
  todayRevenue: number;
  weekTrips: number;
  weekRevenue: number;
  utilizationRate: number;
  avgTripDistanceKm: number;
  avgTripDurationMinutes: number;
}

export interface VehicleCleanliness {
  lastCleaned: Date;
  cleanlinessScore: number;
  needsCleaning: boolean;
}

export interface VehicleProfile {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  capacity: VehicleCapacity;
}

export interface VehicleOwnership {
  type: VehicleOwnershipType;
  ownerId: string;
  fleetId: string | null;
}

export interface VehicleTelemetry {
  fuelLevel: number | null;
  batteryLevel: number | null;
  odometer: number;
  engineHours: number;
  diagnostics: VehicleDiagnostics;
}

// Request/Response types
export interface CreateVehicleRequest {
  profile: VehicleProfile;
  ownership: VehicleOwnership;
  status?: VehicleStatus;
  location?: VehicleLocation;
  maintenance?: Partial<MaintenanceRecord>;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus;
  location?: Partial<VehicleLocation>;
}

export interface UpdateVehicleTelemetryRequest {
  fuelLevel?: number | null;
  batteryLevel?: number | null;
  odometer?: number;
  engineHours?: number;
  diagnostics?: Partial<VehicleDiagnostics>;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  address?: string;
  heading?: number;
  speed?: number;
}

export interface TelemetryUpdate {
  fuelLevel?: number | null;
  batteryLevel?: number | null;
  odometer?: number;
  engineHours?: number;
  tirePressure?: number[];
  oilLevel?: number;
  coolantTemp?: number;
  errorCodes?: string[];
}

// Query types
export interface VehicleQueryParams {
  status?: VehicleStatus;
  category?: VehicleCategory;
  fleetId?: string;
  ownerId?: string;
  minUtilization?: number;
  maxUtilization?: number;
  needsMaintenance?: boolean;
  needsCleaning?: boolean;
  limit?: number;
  skip?: number;
}

// API Response types
export interface VehicleResponse {
  vehicleId: string;
  profile: VehicleProfile;
  ownership: VehicleOwnership;
  status: {
    current: VehicleStatus;
    location: VehicleLocation;
    heading: number;
    speed: number;
    since: Date;
  };
  telemetry: VehicleTelemetry;
  maintenance: MaintenanceRecord;
  utilization: VehicleUtilization;
  cleanliness: VehicleCleanliness;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

// Event types for message broker
export interface VehicleEvent {
  eventType: 'created' | 'updated' | 'status_changed' | 'telemetry_updated' | 'maintenance_due' | 'deleted';
  vehicleId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface TelemetryEvent {
  vehicleId: string;
  timestamp: Date;
  telemetry: Partial<VehicleTelemetry>;
  location: {
    lat: number;
    lng: number;
  };
}
