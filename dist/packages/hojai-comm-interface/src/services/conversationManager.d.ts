import { Conversation, ConversationStatus, Message, MessageDirection, MessageType, Source } from '../types/index.js';
export interface CreateConversationOptions {
    tenantId: string;
    userId: string;
    userName?: string;
    employeeId?: string;
    source?: Source;
    metadata?: Record<string, unknown>;
}
export interface SendMessageOptions {
    tenantId: string;
    conversationId?: string;
    userId: string;
    userName?: string;
    employeeId?: string;
    direction: MessageDirection;
    source: Source;
    type?: MessageType;
    content: {
        text?: string;
        mediaUrl?: string;
        mediaCaption?: string;
        buttons?: Array<{
            id: string;
            text: string;
        }>;
        location?: {
            latitude: number;
            longitude: number;
            name?: string;
        };
    };
    metadata?: Record<string, unknown>;
    externalId?: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
}
export interface ConversationContext {
    recentMessages: Message[];
    context: {
        intent?: string;
        entities?: Record<string, unknown>;
        sentiment?: 'positive' | 'neutral' | 'negative';
        language?: string;
    };
}
declare class ConversationManager {
    private initialized;
    initialize(): Promise<void>;
    /**
     * Get or create an active conversation for a user
     */
    getOrCreateConversation(options: CreateConversationOptions): Promise<Conversation>;
    /**
     * Find conversation by ID
     */
    findById(id: string, tenantId: string): Promise<Conversation | null>;
    /**
     * Find conversation by external ID (e.g., WhatsApp chat ID)
     */
    findByExternalId(tenantId: string, externalId: string): Promise<Conversation | null>;
    /**
     * List conversations for a user
     */
    listByUser(tenantId: string, userId: string, limit?: number): Promise<Conversation[]>;
    /**
     * List conversations assigned to an employee
     */
    listByEmployee(tenantId: string, employeeId: string, status?: ConversationStatus): Promise<Conversation[]>;
    /**
     * Assign conversation to an employee
     */
    assignToEmployee(conversationId: string, tenantId: string, employeeId: string): Promise<Conversation | null>;
    /**
     * Close a conversation
     */
    close(conversationId: string, tenantId: string): Promise<Conversation | null>;
    /**
     * Update conversation context
     */
    updateContext(conversationId: string, tenantId: string, context: Partial<Conversation['context']>): Promise<Conversation | null>;
    /**
     * Increment unread count
     */
    incrementUnread(conversationId: string, tenantId: string): Promise<void>;
    /**
     * Reset unread count
     */
    resetUnread(conversationId: string, tenantId: string): Promise<void>;
    /**
     * Send a message in a conversation
     */
    sendMessage(options: SendMessageOptions): Promise<Message>;
    /**
     * Find message by ID
     */
    findMessageById(id: string): Promise<Message | null>;
    /**
     * Find message by external ID (e.g., WhatsApp message ID)
     */
    findMessageByExternalId(externalId: string): Promise<Message | null>;
    /**
     * Get message history for a conversation
     */
    getMessageHistory(conversationId: string, tenantId: string, limit?: number, before?: Date): Promise<Message[]>;
    /**
     * Get recent conversation context for AI
     */
    getConversationContext(conversationId: string, tenantId: string, messageCount?: number): Promise<ConversationContext | null>;
    /**
     * Update message status
     */
    updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): Promise<Message | null>;
    /**
     * Get unread count for a user
     */
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    /**
     * Mark messages as read
     */
    markAsRead(conversationId: string, tenantId: string): Promise<void>;
}
export declare const conversationManager: ConversationManager;
export {};
//# sourceMappingURL=conversationManager.d.ts.map