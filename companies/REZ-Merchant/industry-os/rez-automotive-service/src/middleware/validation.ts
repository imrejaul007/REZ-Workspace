import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createAppError } from './errorHandler';

// Common validation schemas
export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Vehicle validation schemas
export const createVehicleSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  make: z.string().min(1, 'Make is required').toUpperCase(),
  model: z.string().min(1, 'Model is required').toUpperCase(),
  variant: z.string().min(1, 'Variant is required'),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(1, 'Registration number is required').toUpperCase(),
  vin: z.string().length(17, 'VIN must be exactly 17 characters').toUpperCase(),
  color: z.string().min(1, 'Color is required'),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'auto']),
  kilometerReading: z.coerce.number().int().min(0).default(0),
  ownership: z.enum(['1st', '2nd', '3rd']),
  insuranceStatus: z.enum(['valid', 'expired', 'pending']).default('pending'),
  insuranceExpiry: z.string().datetime().optional(),
  taxStatus: z.enum(['paid', 'pending', 'expired']).default('pending'),
  pucStatus: z.enum(['valid', 'expired', 'pending']).default('pending'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  status: z.enum(['available', 'sold', 'reserved']).default('available'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  priceNegotiable: z.boolean().default(true),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ merchantId: true });

export const vehicleSearchSchema = z.object({
  ...paginationSchema.shape,
  merchantId: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.coerce.number().int().min(1900).optional(),
  yearMax: z.coerce.number().int().max(new Date().getFullYear() + 1).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
  transmission: z.enum(['manual', 'auto']).optional(),
  status: z.enum(['available', 'sold', 'reserved']).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
});

// Service Record validation schemas
export const createServiceRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  serviceDate: z.string().datetime().default(() => new Date().toISOString()),
  serviceType: z.enum(['regular', 'repair', 'inspection']),
  kilometersAtService: z.coerce.number().int().min(0),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    cost: z.coerce.number().min(0),
  })).min(1, 'At least one service item is required'),
  totalCost: z.coerce.number().min(0),
  nextServiceDue: z.string().datetime().optional(),
  nextServiceKm: z.coerce.number().int().min(0).optional(),
  mechanicName: z.string().min(1, 'Mechanic name is required'),
  notes: z.string().optional(),
});

export const updateServiceRecordSchema = createServiceRecordSchema.partial()
  .omit({ merchantId: true, vehicleId: true });

// Appointment validation schemas
export const createAppointmentSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  date: z.string().datetime(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  serviceType: z.enum(['regular', 'repair', 'inspection']),
  estimatedDuration: z.coerce.number().int().min(15).max(480),
  estimatedCost: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  date: z.string().datetime().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  serviceType: z.enum(['regular', 'repair', 'inspection']).optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  estimatedDuration: z.coerce.number().int().min(15).max(480).optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export const appointmentCalendarSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Spare Part validation schemas
export const createSparePartSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  name: z.string().min(1, 'Name is required'),
  partNumber: z.string().min(1, 'Part number is required').toUpperCase(),
  category: z.enum(['engine', 'brake', 'suspension', 'electrical', 'body', 'interior']),
  vehicleCompatibility: z.array(z.string()).default([]),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(5),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  supplierId: z.string().optional(),
  oem: z.boolean().default(false),
  alternatePartNumber: z.string().optional(),
});

export const updateSparePartSchema = createSparePartSchema.partial().omit({ merchantId: true });

export const sparePartSearchSchema = z.object({
  ...paginationSchema.shape,
  merchantId: z.string().optional(),
  category: z.enum(['engine', 'brake', 'suspension', 'electrical', 'body', 'interior']).optional(),
  lowStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.parse(data);

      if (source === 'body') {
        req.body = parsed;
      } else if (source === 'query') {
        req.query = parsed as any;
      } else {
        req.params = parsed as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation helper
export const validateRequired = (field: string, value: unknown): void => {
  if (value === undefined || value === null || value === '') {
    throw createAppError(`${field} is required`, 400, 'MISSING_FIELD');
  }
};

// VIN validation helper
export const validateVin = (vin: string): boolean => {
  if (vin.length !== 17) return false;
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
};

// Registration number validation (Indian format)
export const validateRegistrationNumber = (regNum: string): boolean => {
  const regPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  return regPattern.test(regNum.toUpperCase());
};