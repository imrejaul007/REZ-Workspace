import mongoose, { Document, Schema } from 'mongoose';

// Enums
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'manual' | 'auto';
export type OwnershipType = '1st' | '2nd' | '3rd';
export type VehicleStatus = 'available' | 'sold' | 'reserved';
export type InsuranceStatus = 'valid' | 'expired' | 'pending';
export type TaxStatus = 'paid' | 'pending' | 'expired';
export type PucStatus = 'valid' | 'expired' | 'pending';
export type ServiceType = 'regular' | 'repair' | 'inspection';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type PartCategory = 'engine' | 'brake' | 'suspension' | 'electrical' | 'body' | 'interior';

// Base interfaces
export interface IBaseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle interfaces
export interface IVehicle extends IBaseDocument {
  vehicleId: string;
  merchantId: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  registrationNumber: string;
  vin: string;
  color: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  kilometerReading: number;
  ownership: OwnershipType;
  insuranceStatus: InsuranceStatus;
  insuranceExpiry?: Date;
  taxStatus: TaxStatus;
  pucStatus: PucStatus;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  images: string[];
  status: VehicleStatus;
  price: number;
  priceNegotiable: boolean;
  notes?: string;
}

// Service Record interfaces
export interface IServiceItem {
  name: string;
  description: string;
  cost: number;
}

export interface IServiceRecord extends IBaseDocument {
  recordId: string;
  vehicleId: string;
  merchantId: string;
  customerId: string;
  serviceDate: Date;
  serviceType: ServiceType;
  kilometersAtService: number;
  items: IServiceItem[];
  totalCost: number;
  nextServiceDue?: Date;
  nextServiceKm?: number;
  mechanicName: string;
  notes?: string;
}

// Appointment interfaces
export interface IAppointment extends IBaseDocument {
  appointmentId: string;
  merchantId: string;
  customerId: string;
  vehicleId: string;
  date: Date;
  time: string;
  serviceType: ServiceType;
  status: AppointmentStatus;
  estimatedDuration: number;
  estimatedCost: number;
  notes?: string;
}

// Spare Part interfaces
export interface ISparePart extends IBaseDocument {
  partId: string;
  merchantId: string;
  name: string;
  partNumber: string;
  category: PartCategory;
  vehicleCompatibility: string[];
  stock: number;
  minStock: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  supplierId?: string;
  oem: boolean;
  alternatePartNumber?: string;
}

// Query/Filter interfaces
export interface IVehicleFilters {
  merchantId?: string;
  make?: string;
  model?: string;
  year?: { min?: number; max?: number };
  fuelType?: FuelType;
  transmission?: TransmissionType;
  status?: VehicleStatus;
  priceRange?: { min?: number; max?: number };
  kilometerRange?: { min?: number; max?: number };
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response interfaces
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ICalendarEvent {
  appointmentId: string;
  merchantId: string;
  customerId: string;
  vehicleId: string;
  date: Date;
  time: string;
  serviceType: ServiceType;
  status: AppointmentStatus;
  estimatedDuration: number;
}

// Stock Alert interface
export interface ILowStockAlert {
  partId: string;
  name: string;
  partNumber: string;
  category: PartCategory;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  shortage: number;
}
