/**
 * FLEETIQ - Fleet Management AI Operating System
 * Production-Ready MongoDB Models with Zod Validation
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const VehicleSchemaValidation = z.object({
  registrationNumber: z.string().min(2).max(20),
  type: z.enum(['truck', 'van', 'car', 'bike']),
  capacity: z.number().positive(),
  status: z.enum(['available', 'on-trip', 'maintenance', 'idle']).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional()
  }).optional(),
  driverId: z.string().optional()
});

export const DriverSchemaValidation = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/),
  licenseNumber: z.string().min(5).max(30),
  status: z.enum(['available', 'on-trip', 'off-duty']).optional(),
  rating: z.number().min(0).max(5).optional(),
  tripsCompleted: z.number().min(0).optional()
});

export const TripSchemaValidation = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  origin: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  destination: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
  cargoWeight: z.number().positive().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

export const MaintenanceSchemaValidation = z.object({
  vehicleId: z.string(),
  type: z.enum(['scheduled', 'repair', 'emergency']),
  description: z.string().min(5),
  cost: z.number().min(0).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional()
});

// ============================================
// VEHICLE MODEL
// ============================================

export interface IVehicle extends Document {
  registrationNumber: string;
  type: 'truck' | 'van' | 'car' | 'bike';
  capacity: number;
  status: 'available' | 'on-trip' | 'maintenance' | 'idle';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  fuelLevel: number;
  lastServiceDate: Date;
  nextServiceDue?: Date;
  driverId?: mongoose.Types.ObjectId;
  mileage: number;
  insuranceExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  registrationNumber: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['truck', 'van', 'car', 'bike'], required: true },
  capacity: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['available', 'on-trip', 'maintenance', 'idle'], default: 'available', index: true },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String }
  },
  fuelLevel: { type: Number, default: 100, min: 0, max: 100 },
  lastServiceDate: { type: Date, default: Date.now },
  nextServiceDue: { type: Date },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
  mileage: { type: Number, default: 0 },
  insuranceExpiry: { type: Date }
}, { timestamps: true });

VehicleSchema.index({ type: 1 });
VehicleSchema.index({ fuelLevel: 1 });
VehicleSchema.index({ location: '2dsphere' });

// ============================================
// DRIVER MODEL
// ============================================

export interface IDriver extends Document {
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'available' | 'on-trip' | 'off-duty';
  currentVehicleId?: mongoose.Types.ObjectId;
  tripsCompleted: number;
  rating: number;
  totalDistance: number;
  totalTrips: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  name: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'on-trip', 'off-duty'], default: 'available', index: true },
  currentVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
  tripsCompleted: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  totalDistance: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  averageRating: { type: Number, default: 5.0 }
}, { timestamps: true });

DriverSchema.index({ rating: -1 });

// ============================================
// TRIP MODEL
// ============================================

export interface ITrip extends Document {
  vehicleId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  origin: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  distance: number;
  estimatedTime: number;
  estimatedCost: number;
  actualTime?: number;
  actualCost?: number;
  fuelUsed?: number;
  cargoWeight?: number;
  cargoDetails?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  route?: { waypoints: Array<{ lat: number; lng: number }>; instructions: string[] };
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  origin: { address: { type: String, required: true }, lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  destination: { address: { type: String, required: true }, lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending', index: true },
  startTime: { type: Date },
  endTime: { type: Date },
  distance: { type: Number, required: true, min: 0 },
  estimatedTime: { type: Number, required: true, min: 0 },
  estimatedCost: { type: Number, default: 0 },
  actualTime: { type: Number },
  actualCost: { type: Number },
  fuelUsed: { type: Number },
  cargoWeight: { type: Number },
  cargoDetails: { type: String },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  route: {
    waypoints: [{ lat: Number, lng: Number }],
    instructions: [String]
  }
}, { timestamps: true });

TripSchema.index({ createdAt: -1 });

// ============================================
// MAINTENANCE MODEL
// ============================================

export interface IMaintenance extends Document {
  vehicleId: mongoose.Types.ObjectId;
  type: 'scheduled' | 'repair' | 'emergency';
  description: string;
  cost: number;
  date: Date;
  nextDue?: Date;
  status: 'pending' | 'in-progress' | 'completed';
  technician?: string;
  parts?: Array<{ name: string; cost: number; quantity: number }>;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  type: { type: String, enum: ['scheduled', 'repair', 'emergency'], required: true },
  description: { type: String, required: true },
  cost: { type: Number, default: 0, min: 0 },
  date: { type: Date, required: true },
  nextDue: { type: Date },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending', index: true },
  technician: { type: String },
  parts: [{
    name: { type: String },
    cost: { type: Number },
    quantity: { type: Number }
  }],
  notes: { type: String },
  completedAt: { type: Date }
}, { timestamps: true });

MaintenanceSchema.index({ date: -1 });

// ============================================
// EXPORT MODELS
// ============================================

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
export const Maintenance = mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);

export const Models = { Vehicle, Driver, Trip, Maintenance };
export default Models;