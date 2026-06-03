/**
 * Hojai Data Models - Conversation Entity
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Conversation represents customer interactions across all channels.
 */
import { z } from 'zod';
export type ConversationChannel = 'whatsapp' | 'instagram' | 'facebook' | 'webchat' | 'api' | 'voice' | 'sms';
export type ConversationStatus = 'open' | 'pending' | 'closed' | 'archived';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ResolutionType = 'resolved' | 'escalated' | 'closed_no_resolution' | 'transferred';
export type AssigneeType = 'user' | 'ai_employee' | 'team';
export interface Conversation {
    id: string;
    tenant_id: string;
    customer_id: string;
    merchant_id?: string;
    assigned_to_type?: AssigneeType;
    assigned_to_id?: string;
    channel: ConversationChannel;
    channel_conversation_id?: string;
    channel_user_id?: string;
    status: ConversationStatus;
    priority: ConversationPriority;
    subject?: string;
    first_message: string;
    last_message: string;
    message_count: number;
    tags: string[];
    category?: string;
    resolution_type?: ResolutionType;
    resolution_time_minutes?: number;
    csat_score?: number;
    csat_submitted_at?: string;
    resolution_summary?: string;
    detected_intent?: string;
    detected_entities?: Record<string, string>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    created_at: string;
    updated_at: string;
    last_message_at?: string;
    closed_at?: string;
    first_response_at?: string;
}
export interface ConversationSummary {
    id: string;
    tenant_id: string;
    customer_id: string;
    channel: ConversationChannel;
    status: ConversationStatus;
    priority: ConversationPriority;
    last_message: string;
    last_message_at: string;
    assigned_to?: string;
    unread_count: number;
}
export interface Message {
    id: string;
    tenant_id: string;
    conversation_id: string;
    sender_type: 'customer' | 'user' | 'ai';
    sender_id: string;
    content: string;
    content_type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'location' | 'sticker' | 'template' | 'button_response';
    media_url?: string;
    ai_metadata?: {
        generated: boolean;
        model?: string;
        confidence?: number;
        intent?: string;
    };
    delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    timestamps: {
        sent_at?: string;
        delivered_at?: string;
        read_at?: string;
    };
    created_at: string;
}
export declare const ConversationCreateSchema: z.ZodObject<{
    customer_id: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "instagram", "facebook", "webchat", "api", "voice", "sms"]>;
    subject: z.ZodOptional<z.ZodString>;
    first_message: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    channel: "api" | "whatsapp" | "sms" | "instagram" | "facebook" | "webchat" | "voice";
    tags: string[];
    priority: "low" | "high" | "normal" | "urgent";
    customer_id: string;
    first_message: string;
    subject?: string | undefined;
}, {
    channel: "api" | "whatsapp" | "sms" | "instagram" | "facebook" | "webchat" | "voice";
    customer_id: string;
    first_message: string;
    subject?: string | undefined;
    tags?: string[] | undefined;
    priority?: "low" | "high" | "normal" | "urgent" | undefined;
}>;
export declare const ConversationUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "pending", "closed", "archived"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    assigned_to_type: z.ZodOptional<z.ZodEnum<["user", "ai_employee", "team"]>>;
    assigned_to_id: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    resolution_type: z.ZodOptional<z.ZodEnum<["resolved", "escalated", "closed_no_resolution", "transferred"]>>;
    resolution_summary: z.ZodOptional<z.ZodString>;
    csat_score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    status?: "pending" | "archived" | "open" | "closed" | undefined;
    priority?: "low" | "high" | "normal" | "urgent" | undefined;
    assigned_to_type?: "user" | "ai_employee" | "team" | undefined;
    assigned_to_id?: string | undefined;
    resolution_type?: "transferred" | "resolved" | "escalated" | "closed_no_resolution" | undefined;
    resolution_summary?: string | undefined;
    csat_score?: number | undefined;
}, {
    tags?: string[] | undefined;
    status?: "pending" | "archived" | "open" | "closed" | undefined;
    priority?: "low" | "high" | "normal" | "urgent" | undefined;
    assigned_to_type?: "user" | "ai_employee" | "team" | undefined;
    assigned_to_id?: string | undefined;
    resolution_type?: "transferred" | "resolved" | "escalated" | "closed_no_resolution" | undefined;
    resolution_summary?: string | undefined;
    csat_score?: number | undefined;
}>;
export declare function createConversation(tenantId: string, data: z.infer<typeof ConversationCreateSchema>): Conversation;
export declare function closeConversation(conversation: Conversation, resolution: ResolutionType, resolutionTimeMinutes: number): Conversation;
export type { Conversation, ConversationSummary, Message, };
//# sourceMappingURL=conversation.d.ts.map