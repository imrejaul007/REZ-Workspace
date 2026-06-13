// Enums - must match types/index.ts
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

// Interfaces matching the INTEGRATION-SPEC.md
export interface IVehicleCapacity {
  passengers: number;
  cargoWeightKg: number;
  cargoVolumeM3: number;
}

export interface IVehicleProfile {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  capacity: IVehicleCapacity;
}

export interface IVehicleOwnership {
  type: VehicleOwnershipType;
  ownerId: string;
  fleetId: string | null;
}

export interface IVehicleLocation {
  lat: number;
  lng: number;
  address: string | null;
  updatedAt: Date;
}

export interface IVehicleDiagnostics {
  engineStatus: EngineStatus;
  tirePressure: number[];
  brakeStatus: BrakeStatus;
  oilLevel: number;
  coolantTemp: number;
  errorCodes: string[];
}

export interface IVehicleTelemetry {
  fuelLevel: number | null;
  batteryLevel: number | null;
  odometer: number;
  engineHours: number;
  diagnostics: IVehicleDiagnostics;
}

export interface IMaintenanceRecord {
  nextServiceDate: Date;
  nextServiceKm: number;
  lastServiceDate: Date;
  lastServiceKm: number;
  insuranceExpiry: Date;
  registrationExpiry: Date;
  inspectionExpiry: Date;
  alerts: string[];
}

export interface IVehicleUtilization {
  todayTrips: number;
  todayRevenue: number;
  weekTrips: number;
  weekRevenue: number;
  utilizationRate: number;
  avgTripDistanceKm: number;
  avgTripDurationMinutes: number;
}

export interface IVehicleCleanliness {
  lastCleaned: Date;
  cleanlinessScore: number;
  needsCleaning: boolean;
}

export interface IVehicleStatus {
  current: VehicleStatus;
  location: IVehicleLocation;
  heading: number;
  speed: number;
  since: Date;
}

// Main Vehicle interface
export interface IVehicle {
  vehicleId: string;
  profile: IVehicleProfile;
  ownership: IVehicleOwnership;
  status: IVehicleStatus;
  telemetry: IVehicleTelemetry;
  maintenance: IMaintenanceRecord;
  utilization: IVehicleUtilization;
  cleanliness: IVehicleCleanliness;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
