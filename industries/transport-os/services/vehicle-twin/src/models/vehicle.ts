import mongoose, { Document, Schema } from 'mongoose';
import {
  VehicleCategory,
  VehicleOwnershipType,
  VehicleStatus,
  EngineStatus,
  BrakeStatus,
  IVehicle,
  IVehicleProfile,
  IVehicleOwnership,
  IVehicleStatus,
  IVehicleLocation,
  IVehicleTelemetry,
  IVehicleDiagnostics,
  IMaintenanceRecord,
  IVehicleUtilization,
  IVehicleCleanliness
} from './vehicle.types';

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const VehicleCapacitySchema = new Schema({
  passengers: { type: Number, required: true, min: 1 },
  cargoWeightKg: { type: Number, default: 0 },
  cargoVolumeM3: { type: Number, default: 0 }
}, { _id: false });

const VehicleProfileSchema = new Schema({
  vin: { type: String, required: true, unique: true },
  licensePlate: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true, min: 1900 },
  color: { type: String, required: true },
  category: {
    type: String,
    enum: Object.values(VehicleCategory),
    required: true
  },
  capacity: { type: VehicleCapacitySchema, required: true }
}, { _id: false });

const VehicleOwnershipSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(VehicleOwnershipType),
    required: true
  },
  ownerId: { type: String, required: true },
  fleetId: { type: String, default: null }
}, { _id: false });

const VehicleLocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const VehicleDiagnosticsSchema = new Schema({
  engineStatus: {
    type: String,
    enum: Object.values(EngineStatus),
    default: EngineStatus.OK
  },
  tirePressure: [{ type: Number }],
  brakeStatus: {
    type: String,
    enum: Object.values(BrakeStatus),
    default: BrakeStatus.OK
  },
  oilLevel: { type: Number, default: 100 },
  coolantTemp: { type: Number, default: 90 },
  errorCodes: [{ type: String }]
}, { _id: false });

const VehicleTelemetrySchema = new Schema({
  fuelLevel: { type: Number, default: null, min: 0, max: 100 },
  batteryLevel: { type: Number, default: null, min: 0, max: 100 },
  odometer: { type: Number, default: 0 },
  engineHours: { type: Number, default: 0 },
  diagnostics: { type: VehicleDiagnosticsSchema, default: () => ({}) }
}, { _id: false });

const MaintenanceRecordSchema = new Schema({
  nextServiceDate: { type: Date },
  nextServiceKm: { type: Number },
  lastServiceDate: { type: Date },
  lastServiceKm: { type: Number },
  insuranceExpiry: { type: Date },
  registrationExpiry: { type: Date },
  inspectionExpiry: { type: Date },
  alerts: [{ type: String }]
}, { _id: false });

const VehicleUtilizationSchema = new Schema({
  todayTrips: { type: Number, default: 0 },
  todayRevenue: { type: Number, default: 0 },
  weekTrips: { type: Number, default: 0 },
  weekRevenue: { type: Number, default: 0 },
  utilizationRate: { type: Number, default: 0, min: 0, max: 100 },
  avgTripDistanceKm: { type: Number, default: 0 },
  avgTripDurationMinutes: { type: Number, default: 0 }
}, { _id: false });

const VehicleCleanlinessSchema = new Schema({
  lastCleaned: { type: Date, default: Date.now },
  cleanlinessScore: { type: Number, default: 5, min: 1, max: 5 },
  needsCleaning: { type: Boolean, default: false }
}, { _id: false });

// ============================================================================
// MAIN VEHICLE SCHEMA
// ============================================================================

const VehicleStatusInnerSchema = new Schema({
  current: {
    type: String,
    enum: Object.values(VehicleStatus),
    default: VehicleStatus.OFFLINE
  },
  location: { type: VehicleLocationSchema, default: () => ({}) },
  heading: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  since: { type: Date, default: Date.now }
}, { _id: false });

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    profile: { type: VehicleProfileSchema, required: true },
    ownership: { type: VehicleOwnershipSchema, required: true },
    status: { type: VehicleStatusInnerSchema, default: () => ({}) },
    telemetry: { type: VehicleTelemetrySchema, default: () => ({}) },
    maintenance: { type: MaintenanceRecordSchema, default: () => ({}) },
    utilization: { type: VehicleUtilizationSchema, default: () => ({}) },
    cleanliness: { type: VehicleCleanlinessSchema, default: () => ({}) },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'vehicles'
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
VehicleSchema.index({ 'status.current': 1, 'profile.category': 1 });
VehicleSchema.index({ 'ownership.fleetId': 1, 'status.current': 1 });
VehicleSchema.index({ 'ownership.ownerId': 1 });
VehicleSchema.index({ 'profile.licensePlate': 1 });
VehicleSchema.index({ 'profile.vin': 1 });
VehicleSchema.index({ 'utilization.utilizationRate': 1 });
VehicleSchema.index({ 'maintenance.nextServiceDate': 1 });
VehicleSchema.index({ 'cleanliness.needsCleaning': 1, 'status.current': 1 });
VehicleSchema.index({ createdAt: -1 });

// Geospatial index for location queries
VehicleSchema.index({ 'status.location.lat': 1, 'status.location.lng': 1 });

// ============================================================================
// MODEL EXPORTS
// ============================================================================

export interface IVehicleDocument extends Omit<IVehicle, '_id'>, Document {}

export const Vehicle = mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema);

// Type exports
export type VehicleDocument = IVehicleDocument;