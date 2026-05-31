/**
 * Hojai Data Models - Conversation Entity
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Conversation represents customer interactions across all channels.
 */
import { z } from 'zod';
// ============================================
// ZOD SCHEMAS
// ============================================
export const ConversationCreateSchema = z.object({
    customer_id: z.string().min(1),
    channel: z.enum(['whatsapp', 'instagram', 'facebook', 'webchat', 'api', 'voice', 'sms']),
    subject: z.string().optional(),
    first_message: z.string().min(1),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    tags: z.array(z.string()).default([]),
});
export const ConversationUpdateSchema = z.object({
    status: z.enum(['open', 'pending', 'closed', 'archived']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assigned_to_type: z.enum(['user', 'ai_employee', 'team']).optional(),
    assigned_to_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
    resolution_type: z.enum(['resolved', 'escalated', 'closed_no_resolution', 'transferred']).optional(),
    resolution_summary: z.string().optional(),
    csat_score: z.number().min(1).max(5).optional(),
});
// ============================================
// FACTORY FUNCTIONS
// ============================================
export function createConversation(tenantId, data) {
    const now = new Date().toISOString();
    return {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        customer_id: data.customer_id,
        channel: data.channel,
        subject: data.subject,
        first_message: data.first_message,
        last_message: data.first_message,
        message_count: 1,
        priority: data.priority,
        tags: data.tags,
        status: 'open',
        created_at: now,
        updated_at: now,
        last_message_at: now,
    };
}
export function closeConversation(conversation, resolution, resolutionTimeMinutes) {
    const now = new Date().toISOString();
    return {
        ...conversation,
        status: 'closed',
        resolution_type: resolution,
        resolution_time_minutes: resolutionTimeMinutes,
        closed_at: now,
        updated_at: now,
    };
}
//# sourceMappingURL=conversation.js.map