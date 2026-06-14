import { z } from 'zod';

// ==========================================
// MESSAGE SCHEMA
// ==========================================

export const MessageType = z.enum(['text', 'template', 'location', 'system']);
export type MessageType = z.infer<typeof MessageType>;

export const SenderRole = z.enum(['finder', 'owner', 'system']);
export type SenderRole = z.infer<typeof SenderRole>;

export const MessageFlag = z.object({
 type: z.enum(['spam', 'abuse', 'reported', 'suspicious']),
 by: z.string(),
 reason: z.string().optional(),
 at: z.date(),
});
export type MessageFlag = z.infer<typeof MessageFlag>;

export const RelayMessageSchema = z.object({
 messageId: z.string(),
 sessionId: z.string(),
 senderId: z.string(),
 senderRole: SenderRole,
 content: z.string(),
 type: MessageType.default('text'),
 templateId: z.string().optional(),
 read: z.boolean().default(false),
 isFlagged: z.boolean().default(false),
 flags: z.array(MessageFlag).default([]),
 karmaAwarded: z.boolean().default(false),
 expiresAt: z.date(),
 createdAt: z.date(),
});
export type RelayMessageSchema = z.infer<typeof RelayMessageSchema>;

// ==========================================
// SESSION SCHEMA
// ==========================================

export const SessionStatus = z.enum(['active', 'closed', 'resolved', 'expired']);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const RelaySessionSchema = z.object({
 sessionId: z.string(),
 shortcode: z.string(),
 qrId: z.string(),
 mode: z.string(),
 ownerId: z.string(),
 ownerRead: z.boolean().default(false),
 finderId: z.string().optional(),
 finderRead: z.boolean().default(false),
 status: SessionStatus.default('active'),
 messageCount: z.number().default(0),
 expiresAt: z.date(),
 createdAt: z.date(),
 updatedAt: z.date(),
 closedAt: z.date().optional(),
});
export type RelaySessionSchema = z.infer<typeof RelaySessionSchema>;

// ==========================================
// SEND MESSAGE INPUT
// ==========================================

export const SendMessageInput = z.object({
 content: z.string().min(1).max(500),
 type: MessageType.default('text'),
 templateId: z.string().optional(),
 location: z.object({
   lat: z.number(),
   lng: z.number(),
   address: z.string().optional(),
 }).optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

// ==========================================
// SESSION RESPONSE
// ==========================================

export const SessionResponse = z.object({
 sessionId: z.string(),
 shortcode: z.string(),
 mode: z.string(),
 status: SessionStatus,
 ownerName: z.string().optional(),
 finderName: z.string().optional(),
 lastMessage: RelayMessageSchema.optional(),
 unreadCount: z.number(),
 expiresAt: z.date(),
 createdAt: z.date(),
});
export type SessionResponse = z.infer<typeof SessionResponse>;
