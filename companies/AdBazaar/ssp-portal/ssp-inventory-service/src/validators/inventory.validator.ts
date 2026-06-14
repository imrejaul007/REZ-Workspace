import { z } from 'zod';

// Time slot regex: HH-HH format (e.g., 00-01, 13-14)
const timeSlotRegex = /^\d{2}-\d{2}$/;

// Status enum
export const SlotStatusSchema = z.enum(['available', 'booked', 'reserved', 'blocked']);
export type SlotStatusInput = z.infer<typeof SlotStatusSchema>;

// Create inventory slot schema
export const CreateInventorySlotSchema = z.object({
  slotId: z.string().min(1, 'slotId is required'),
  screenId: z.string().min(1, 'screenId is required'),
  date: z.string().datetime({ message: 'Invalid date format' }).or(z.date()),
  timeSlot: z.string().regex(timeSlotRegex, 'timeSlot must be in format HH-HH'),
  status: SlotStatusSchema.optional().default('available'),
  price: z.number().min(0, 'price must be non-negative'),
  minDuration: z.number().int().min(1).optional().default(1),
  maxDuration: z.number().int().min(1).optional().default(24),
  bookingId: z.string().optional(),
  advertiserId: z.string().optional(),
});

// Update inventory slot schema
export const UpdateInventorySlotSchema = z.object({
  screenId: z.string().min(1).optional(),
  date: z.string().datetime().or(z.date()).optional(),
  timeSlot: z.string().regex(timeSlotRegex).optional(),
  status: SlotStatusSchema.optional(),
  price: z.number().min(0).optional(),
  minDuration: z.number().int().min(1).optional(),
  maxDuration: z.number().int().min(1).optional(),
  bookingId: z.string().optional().nullable(),
  advertiserId: z.string().optional().nullable(),
});

// Book slot schema
export const BookSlotSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  advertiserId: z.string().min(1, 'advertiserId is required'),
  duration: z.number().int().min(1).optional(),
});

// Available slots query schema
export const AvailableSlotsQuerySchema = z.object({
  screenId: z.string().optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  duration: z.coerce.number().int().min(1).optional(),
  startTime: z.string().regex(timeSlotRegex).optional(),
  endTime: z.string().regex(timeSlotRegex).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Batch create schema
export const BatchCreateSchema = z.object({
  slots: z.array(CreateInventorySlotSchema).min(1).max(1000),
});

// Release slot schema
export const ReleaseSlotSchema = z.object({
  reason: z.string().optional(),
});

// Screen ID params schema
export const ScreenIdParamsSchema = z.object({
  screenId: z.string().min(1),
});

// Date params schema
export const ScreenDateParamsSchema = z.object({
  screenId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});

// ID params schema
export const IdParamsSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export type CreateInventorySlotInput = z.infer<typeof CreateInventorySlotSchema>;
export type UpdateInventorySlotInput = z.infer<typeof UpdateInventorySlotSchema>;
export type BookSlotInput = z.infer<typeof BookSlotSchema>;
export type AvailableSlotsQueryInput = z.infer<typeof AvailableSlotsQuerySchema>;
export type BatchCreateInput = z.infer<typeof BatchCreateSchema>;
export type ReleaseSlotInput = z.infer<typeof ReleaseSlotSchema>;