import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Zod validation schemas
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const AvailableHoursSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:MM format required'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:MM format required'),
});

export const ScreenTypeSchema = z.enum(['led', 'lcd', 'projection', 'digital_billboard']);
export const ScreenSizeSchema = z.enum(['small', 'medium', 'large', 'mega']);
export const ScreenOrientationSchema = z.enum(['landscape', 'portrait']);
export const ScreenStatusSchema = z.enum(['active', 'inactive', 'maintenance']);

export const CreateScreenSchema = z.object({
  screenId: z.string().min(1, 'Screen ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  locationName: z.string().min(1, 'Location name is required'),
  address: AddressSchema,
  screenType: ScreenTypeSchema,
  size: ScreenSizeSchema,
  width: z.number().int().positive('Width must be a positive integer'),
  height: z.number().int().positive('Height must be a positive integer'),
  orientation: ScreenOrientationSchema,
  status: ScreenStatusSchema.default('active'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  availableHours: z.record(z.string(), AvailableHoursSchema).optional(),
});

export const UpdateScreenSchema = z.object({
  locationName: z.string().min(1).optional(),
  address: AddressSchema.partial().optional(),
  screenType: ScreenTypeSchema.optional(),
  size: ScreenSizeSchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  orientation: ScreenOrientationSchema.optional(),
  ownerId: z.string().min(1).optional(),
  hourlyRate: z.number().positive().optional(),
  availableHours: z.record(z.string(), AvailableHoursSchema).optional(),
});

export const UpdateStatusSchema = z.object({
  status: ScreenStatusSchema,
});

export const AvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'),
});

export type Address = z.infer<typeof AddressSchema>;
export type AvailableHours = z.infer<typeof AvailableHoursSchema>;
export type ScreenType = z.infer<typeof ScreenTypeSchema>;
export type ScreenSize = z.infer<typeof ScreenSizeSchema>;
export type ScreenOrientation = z.infer<typeof ScreenOrientationSchema>;
export type ScreenStatus = z.infer<typeof ScreenStatusSchema>;
export type CreateScreenInput = z.infer<typeof CreateScreenSchema>;
export type UpdateScreenInput = z.infer<typeof UpdateScreenSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;

// Mongoose Document interface
export interface IScreenDocument extends Document {
  screenId: string;
  locationId: string;
  locationName: string;
  address: Address;
  screenType: ScreenType;
  size: ScreenSize;
  width: number;
  height: number;
  orientation: ScreenOrientation;
  status: ScreenStatus;
  ownerId: string;
  hourlyRate: number;
  availableHours: Record<string, AvailableHours>;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const AddressSchemaDefinition = new Schema<Address>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const AvailableHoursSchemaDefinition = new Schema<AvailableHours>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const ScreenSchema = new Schema<IScreenDocument>(
  {
    screenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    locationId: {
      type: String,
      required: true,
      index: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    address: {
      type: AddressSchemaDefinition,
      required: true,
    },
    screenType: {
      type: String,
      enum: ['led', 'lcd', 'projection', 'digital_billboard'],
      required: true,
      index: true,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'mega'],
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    orientation: {
      type: String,
      enum: ['landscape', 'portrait'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    availableHours: {
      type: Map,
      of: AvailableHoursSchemaDefinition,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for common queries
ScreenSchema.index({ 'address.city': 1 });
ScreenSchema.index({ 'address.pincode': 1 });
ScreenSchema.index({ 'address.lat': 1, 'address.lng': 1 });
ScreenSchema.index({ hourlyRate: 1 });
ScreenSchema.index({ createdAt: -1 });

// Pre-save validation
ScreenSchema.pre('save', function (next) {
  // Validate screenId format
  if (!this.screenId || this.screenId.trim() === '') {
    return next(new Error('Screen ID is required'));
  }

  // Validate dimensions
  if (this.width <= 0 || this.height <= 0) {
    return next(new Error('Width and height must be positive'));
  }

  // Validate hourly rate
  if (this.hourlyRate < 0) {
    return next(new Error('Hourly rate cannot be negative'));
  }

  next();
});

export const Screen = mongoose.model<IScreenDocument>('Screen', ScreenSchema);

// Utility function to check availability
export function isTimeSlotAvailable(
  availableHours: Record<string, AvailableHours>,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = dayNames[dayOfWeek];

  const dayHours = availableHours[dayKey];
  if (!dayHours) {
    return false;
  }

  // Compare times (HH:MM format)
  return startTime >= dayHours.start && endTime <= dayHours.end;
}

// Export schema types for external use
export { ScreenSchema };