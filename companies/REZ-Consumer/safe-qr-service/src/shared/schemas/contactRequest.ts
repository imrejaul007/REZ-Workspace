import { z } from 'zod';

// ==========================================
// CONTACT REQUEST SCHEMA
// ==========================================

export const ContactRequestStatus = z.enum(['pending', 'approved', 'rejected', 'expired']);
export type ContactRequestStatus = z.infer<typeof ContactRequestStatus>;

export const ContactRequestSchema = z.object({
 requestId: z.string(),
 shortcode: z.string(),
 qrId: z.string(),
 mode: z.string(),
 ownerId: z.string(),
 requesterId: z.string().optional(),
 requesterName: z.string(),
 requesterPhone: z.string().optional(),
 message: z.string().optional(),
 type: z.enum(['template', 'custom']).default('template'),
 templateId: z.string().optional(),
 status: ContactRequestStatus.default('pending'),
 sessionId: z.string().optional(),
 expiresAt: z.date(),
 createdAt: z.date(),
 respondedAt: z.date().optional(),
});
export type ContactRequestSchema = z.infer<typeof ContactRequestSchema>;

// ==========================================
// CONTACT REQUEST INPUT
// ==========================================

export const CreateContactRequestInput = z.object({
 requesterName: z.string().min(1).max(100),
 requesterPhone: z.string().optional(),
 message: z.string().max(200).optional(),
 type: z.enum(['template', 'custom']).default('template'),
 templateId: z.string().optional(),
});
export type CreateContactRequestInput = z.infer<typeof CreateContactRequestInput>;

// ==========================================
// CONTACT REQUEST RESPONSE
// ==========================================

export const ContactRequestResponse = z.object({
 requestId: z.string(),
 shortcode: z.string(),
 mode: z.string(),
 status: ContactRequestStatus,
 requesterName: z.string(),
 message: z.string().optional(),
 type: z.enum(['template', 'custom']),
 createdAt: z.date(),
 expiresAt: z.date(),
});
export type ContactRequestResponse = z.infer<typeof ContactRequestResponse>;
