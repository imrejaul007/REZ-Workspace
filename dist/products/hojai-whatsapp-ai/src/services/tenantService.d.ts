export interface Session {
    userId?: string;
    tenantId: string;
    merchantId: string;
    customerId: string;
    conversationId?: string;
    context: {
        lastIntent?: string;
        lastEntities?: Record<string, unknown>;
        collectedInfo?: Record<string, unknown>;
    };
    state: 'greeting' | 'collecting_info' | 'booking' | 'ordering' | 'resolved' | 'escalated';
    messageCount: number;
    lastMessageAt: Date;
    language?: string;
    preferredService?: string;
    preferredDate?: string;
    preferredTime?: string;
}
export declare class SessionService {
    private redis;
    private readonly SESSION_TTL;
    constructor();
    /**
     * Get session for customer
     */
    getSession(merchantId: string, customerId: string): Promise<Session | null>;
    /**
     * Save session
     */
    saveSession(merchantId: string, customerId: string, session: Partial<Session>): Promise<void>;
    /**
     * Update session context
     */
    updateContext(merchantId: string, customerId: string, context: Partial<Session['context']>): Promise<void>;
    /**
     * Update session state
     */
    updateState(merchantId: string, customerId: string, state: Session['state']): Promise<void>;
    /**
     * Clear session
     */
    clearSession(merchantId: string, customerId: string): Promise<void>;
    /**
     * Get all active sessions for merchant
     */
    getActiveSessions(merchantId: string): Promise<Session[]>;
    /**
     * Get session key
     */
    private getSessionKey;
    /**
     * Cache knowledge base response
     */
    cacheKnowledgeResponse(merchantId: string, query: string, response: string, ttl?: number): Promise<void>;
    /**
     * Get cached knowledge response
     */
    getCachedKnowledgeResponse(merchantId: string, query: string): Promise<string | null>;
    /**
     * Cache AI response
     */
    cacheAIResponse(sessionKey: string, messageHash: string, response: string, ttl?: number): Promise<void>;
    /**
     * Get cached AI response
     */
    getCachedAIResponse(sessionKey: string, messageHash: string): Promise<string | null>;
    /**
     * Increment metric
     */
    incrementMetric(merchantId: string, metric: string): Promise<number>;
    /**
     * Get metric value
     */
    getMetric(merchantId: string, metric: string): Promise<number>;
    /**
     * Close connection
     */
    close(): Promise<void>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=tenantService.d.ts.map