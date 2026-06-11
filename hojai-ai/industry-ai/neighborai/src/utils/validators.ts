/**
 * NEIGHBORAI - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// RESIDENT SCHEMAS
// ============================================

export const residentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  email: z.string().email('Invalid email format'),
  flatNumber: z.string().min(1, 'Flat number is required'),
  wing: z.string().min(1, 'Wing is required'),
  familyMembers: z.array(z.string()).optional().default([]),
  vehicleNumbers: z.array(z.string()).optional().default([]),
  status: z.enum(['owner', 'tenant']).optional().default('owner'),
  emergencyContact: z.string().optional()
});

export const residentUpdateSchema = residentSchema.partial();

// ============================================
// VISITOR SCHEMAS
// ============================================

export const visitorCheckInSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  purpose: z.string().min(1, 'Purpose is required'),
  hostFlat: z.string().min(1, 'Host flat is required')
});

export const visitorPreApproveSchema = z.object({
  flatNumber: z.string().min(1, 'Flat number is required'),
  visitorName: z.string().min(2, 'Visitor name is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  purpose: z.string().min(1, 'Purpose is required')
});

// ============================================
// COMPLAINT SCHEMAS
// ============================================

export const complaintSchema = z.object({
  residentId: z.string().min(1, 'Resident ID is required'),
  flatNumber: z.string().min(1, 'Flat number is required'),
  wing: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
});

export const complaintUpdateSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional()
});

// ============================================
// MAINTENANCE SCHEMAS
// ============================================

export const maintenanceRequestSchema = z.object({
  residentId: z.string().min(1, 'Resident ID is required'),
  flatNumber: z.string().min(1, 'Flat number is required'),
  wing: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  dueDate: z.string().or(z.date()).transform(val => new Date(val))
});

export const maintenanceBillSchema = z.object({
  flatNumber: z.string().min(1, 'Flat number is required'),
  wing: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  dueDate: z.string().or(z.date()).transform(val => new Date(val)),
  category: z.string().optional().default('maintenance')
});

export const maintenancePaySchema = z.object({
  paidAmount: z.number().min(0, 'Amount must be positive')
});

// ============================================
// EVENT SCHEMAS
// ============================================

export const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  time: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  attendees: z.array(z.string()).optional().default([]),
  organizer: z.string().optional()
});

export const eventUpdateSchema = eventSchema.partial();
export const eventRsvpSchema = z.object({
  rsvp: z.enum(['yes', 'no']),
  flatNumber: z.string().min(1, 'Flat number is required')
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['admin', 'resident', 'security']).optional().default('resident'),
  flatNumber: z.string().optional()
});

// ============================================
// AI QUERY SCHEMAS
// ============================================

export const societyQuerySchema = z.object({
  flatNumber: z.string().optional(),
  query: z.string().min(1, 'Query is required')
});

export const complaintTrackSchema = z.object({
  complaintId: z.string().min(1, 'Complaint ID is required')
});

export const eventPlanSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  suggestedDate: z.string().or(z.date()).optional(),
  organizer: z.string().optional()
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ResidentInput = z.infer<typeof residentSchema>;
export type ResidentUpdateInput = z.infer<typeof residentUpdateSchema>;
export type VisitorCheckInInput = z.infer<typeof visitorCheckInSchema>;
export type VisitorPreApproveInput = z.infer<typeof visitorPreApproveSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type ComplaintUpdateInput = z.infer<typeof complaintUpdateSchema>;
export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;
export type MaintenanceBillInput = z.infer<typeof maintenanceBillSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SocietyQueryInput = z.infer<typeof societyQuerySchema>;
export type ComplaintTrackInput = z.infer<typeof complaintTrackSchema>;
export type EventPlanInput = z.infer<typeof eventPlanSchema>;