export interface SDKConfig {
    apiKey: string;
    baseUrl?: string;
    debug?: boolean;
}
export interface EmitOptions {
    source: string;
    event: string;
    userId?: string;
    data: Record<string, any>;
    privacy?: 'public' | 'internal' | 'sensitive';
}
export interface WellnessCheckIn {
    userId: string;
    mood: 'radiant' | 'bright' | 'balanced' | 'clouded' | 'stormy' | 'peaceful' | 'restless' | 'tired';
    energy: 1 | 2 | 3 | 4 | 5;
    note?: string;
    gratitude?: string;
}
export interface WellnessResult {
    success: boolean;
    mood: {
        current: string;
        energy: number;
        stress: number;
        socialEnergy: number;
    };
    cosmic: {
        energyLevel: 'high' | 'medium' | 'low';
        emotionalTone: string;
        focusScore: number;
        socialEnergy: number;
    };
    affirmation: string;
    insight: string;
}
export interface CosmicContext {
    cosmic: {
        energyLevel: 'high' | 'medium' | 'low';
        emotionalTone: string;
        focusScore: number;
        socialEnergy: number;
    };
    dailyReading?: {
        primaryTheme: string;
        affirmation: string;
    };
    suggestedActions: string[];
}
export declare class HojaiSDK {
    private apiKey;
    private baseUrl;
    private cosmicUrl;
    private debug;
    private queue;
    private flushing;
    constructor(config: SDKConfig);
    emit(options: EmitOptions): Promise<void>;
    private flush;
    trackCommerce(data: {
        userId: string;
        action: string;
        value?: number;
    }): Promise<void>;
    trackPurchase(data: {
        userId: string;
        amount: number;
        category: string;
    }): Promise<void>;
    trackCart(data: {
        userId: string;
        action: 'add' | 'remove' | 'abandon';
        items: any[];
    }): Promise<void>;
    trackHealth(data: {
        userId: string;
        metrics: any;
    }): Promise<void>;
    trackFitness(data: {
        userId: string;
        activity: string;
        duration?: number;
        calories?: number;
    }): Promise<void>;
    trackSleep(data: {
        userId: string;
        hours: number;
        quality?: number;
    }): Promise<void>;
    /**
     * Record a mood check-in with cosmic interpretation
     */
    wellnessCheckIn(data: WellnessCheckIn): Promise<WellnessResult>;
    /**
     * Get cosmic context for a user
     */
    getCosmicContext(userId: string): Promise<CosmicContext>;
    /**
     * Get domain-specific guidance
     */
    getGuidance(userId: string, domain: string): Promise<{
        guidance: string;
        practicalSteps: string[];
        symbolic: string;
    }>;
    trackMobility(data: {
        userId: string;
        rideType: string;
        location: any;
    }): Promise<void>;
    trackTravel(data: {
        userId: string;
        destination: string;
        class: string;
    }): Promise<void>;
    identify(userId: string, traits?: Record<string, any>): Promise<void>;
    private getEmotionalTone;
    private estimateSocialEnergy;
    private getAffirmation;
    private getInsight;
}
export declare function createSDK(config: SDKConfig): HojaiSDK;
//# sourceMappingURL=index.d.ts.map