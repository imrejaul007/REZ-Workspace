import { ServiceConnector } from './serviceConnector.js';
export interface ConversationContext {
    conversationId: string;
    tenantId: string;
    customerId: string;
    channel: 'whatsapp' | 'instagram' | 'webchat' | 'sms' | 'email';
    recentMessages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
    }>;
    metadata?: Record<string, unknown>;
}
export interface AIResponse {
    message: string;
    action?: {
        type: 'create_order' | 'add_to_cart' | 'create_ticket' | 'send_message' | 'route_to_agent' | 'show_products' | 'show_order' | 'show_ticket';
        data?: Record<string, unknown>;
    };
    context?: {
        intent?: string;
        entities?: Record<string, unknown>;
        confidence?: number;
    };
}
export interface ProcessedIntent {
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
    response: AIResponse;
}
declare class UnifiedBrain {
    private initialized;
    private serviceConnector;
    constructor(connector?: ServiceConnector);
    initialize(): Promise<void>;
    /**
     * Process incoming message and generate AI response
     * This method:
     * 1. Fetches user context from memory
     * 2. Recognizes intent
     * 3. Generates response
     * 4. Stores conversation in memory
     * 5. Emits events to event bus
     * 6. Sends to training pipeline
     */
    processMessage(message: string, context: ConversationContext): Promise<ProcessedIntent>;
    /**
     * Store conversation in memory (async, non-blocking)
     */
    private storeConversationAsync;
    /**
     * Emit events to event bus (async, non-blocking)
     */
    private emitEventsAsync;
    /**
     * Send conversation to training pipeline (async, non-blocking)
     */
    private sendToTrainingAsync;
    /**
     * Store user preference from conversation
     */
    storePreference(tenantId: string, userId: string, preferenceType: string, value: unknown): Promise<boolean>;
    /**
     * Send feedback to training pipeline
     */
    sendFeedback(tenantId: string, userId: string, feedbackType: 'positive' | 'negative' | 'rating' | 'correction', score?: number, content?: string): Promise<boolean>;
    /**
     * Send correction to training pipeline (for AI mistakes)
     */
    sendCorrection(tenantId: string, userId: string, originalContent: string, correctedContent: string, reason?: string): Promise<boolean>;
    /**
     * Recognize intent from message
     */
    private recognizeIntent;
    /**
     * Analyze conversation context to determine intent
     */
    private analyzeContext;
    /**
     * Generate response based on intent
     */
    private generateResponse;
    /**
     * Generate context-aware suggestions
     */
    getSuggestions(context: ConversationContext): string[];
    /**
     * Get last recognized intent from context
     */
    private getLastIntent;
    /**
     * Route to appropriate handler based on intent
     */
    routeToHandler(intent: ProcessedIntent): Promise<{
        handler: string;
        data: Record<string, unknown>;
    } | null>;
    /**
     * Generate conversation summary for handoff
     */
    generateSummary(context: ConversationContext): string;
}
export declare const unifiedBrain: UnifiedBrain;
export default unifiedBrain;
