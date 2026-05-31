export interface CrossAppSignal {
    id: string;
    userId: string;
    tenantId: string;
    merchantId?: string;
    signalType: SignalType;
    signalCategory: SignalCategory;
    confidence: number;
    data: Record<string, any>;
    source: 'hojai' | 'rez';
    sourceApp?: string;
    sourceService: string;
    enriched?: {
        ltv?: number;
        churnRisk?: number;
        segment?: string;
        preferences?: Record<string, any>;
    };
    createdAt: Date;
}
export declare enum SignalType {
    BEHAVIORAL = "behavioral",
    COMMERCE = "commerce",
    INTENT = "intent",
    SEGMENT = "segment",
    PREFERENCE = "preference",
    TRANSACTION = "transaction",
    ENGAGEMENT = "engagement"
}
export declare enum SignalCategory {
    PURCHASE = "purchase",
    BROWSE = "browse",
    CHAT = "chat",
    BOOKING = "booking",
    FEEDBACK = "feedback",
    LOCATION = "location",
    SOCIAL = "social",
    DEVICE = "device"
}
export declare class SignalBridgeService {
    private readonly REZ_EVENT_BUS;
    private readonly REZ_INTELLIGENCE;
    private readonly REZ_IDENTITY;
    private readonly INTERNAL_TOKEN;
    /**
     * Emit signal from Hojai to REZ
     */
    emitSignal(params: {
        tenantId: string;
        merchantId: string;
        userId: string;
        signalType: SignalType;
        signalCategory: SignalCategory;
        data: Record<string, any>;
        confidence?: number;
        sourceApp?: string;
    }): Promise<void>;
    /**
     * Get signals from REZ for user
     */
    getSignals(params: {
        userId: string;
        signalType?: SignalType;
        limit?: number;
    }): Promise<CrossAppSignal[]>;
    /**
     * Get user context from REZ
     */
    getUserContext(userId: string): Promise<{
        ltv?: number;
        churnRisk?: number;
        segment?: string;
        preferences?: Record<string, unknown>;
        loyalty?: {
            points: number;
            tier: string;
        };
        commerce?: {
            totalOrders: number;
            avgOrderValue: number;
        };
        mobility?: {
            homeLocation?: unknown;
            workLocation?: unknown;
        };
        travel?: {
            lastDestination?: string;
            frequentRoutes?: string[];
        };
    } | null>;
    /**
     * Link Hojai user to REZ user
     */
    linkUsers(params: {
        hojaiUserId: string;
        hojaiMerchantId: string;
        rezUserId?: string;
        phone?: string;
    }): Promise<{
        linked: boolean;
        rezUserId?: string;
    }>;
    /**
     * Get enriched user profile
     */
    getEnrichedProfile(params: {
        userId: string;
        merchantId: string;
        signalData: Record<string, any>;
    }): Promise<Record<string, any>>;
    /**
     * Emit order/transaction to REZ
     */
    emitTransaction(params: {
        userId: string;
        merchantId: string;
        transactionType: 'order' | 'booking' | 'payment';
        amount?: number;
        items?: any[];
        source: string;
    }): Promise<void>;
    /**
     * Emit engagement signal
     */
    emitEngagement(params: {
        userId: string;
        merchantId: string;
        action: 'message' | 'click' | 'view' | 'conversion';
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Get user segments from REZ
     */
    getUserSegments(userId: string): Promise<string[]>;
    /**
     * Get LTV prediction from REZ
     */
    getLTVPrediction(userId: string): Promise<number | null>;
    /**
     * Get churn risk from REZ
     */
    getChurnRisk(userId: string): Promise<number | null>;
    /**
     * Get enriched context for AI response
     */
    getEnrichedContext(userId: string, currentContext?: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Emit behavioral signal
     */
    emitBehavioralSignal(params: {
        userId: string;
        merchantId: string;
        signal: string;
        value: number;
        metadata?: Record<string, any>;
    }): Promise<void>;
}
export declare const signalBridge: SignalBridgeService;
//# sourceMappingURL=bridgeService.d.ts.map