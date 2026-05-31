/**
 * Hojai Flow - Intent Detection Service
 *
 * Fast intent classification (1-10ms target)
 * Runs locally for low latency
 */
export declare enum IntentType {
    DICTATION = "DICTATION",
    QUERY = "QUERY",
    ACTION = "ACTION",
    WORKFLOW = "WORKFLOW",
    AGENT = "AGENT",
    MULTI_AGENT = "MULTI_AGENT",
    UNKNOWN = "UNKNOWN"
}
export interface IntentResult {
    type: IntentType;
    confidence: number;
    entities: Record<string, string>;
    suggestedAction?: string;
    metadata?: Record<string, unknown>;
}
export interface IntentPattern {
    type: IntentType;
    patterns: RegExp[];
    keywords: string[];
    weight: number;
}
export declare class IntentService {
    private patterns;
    private entityPatterns;
    private contextCache;
    constructor();
    /**
     * Detect intent from text (target: 1-10ms)
     */
    detect(text: string, context?: Record<string, unknown>): IntentResult;
    /**
     * Detect intent from context hints
     */
    private detectFromContext;
    /**
     * Extract entities from text
     */
    private extractEntities;
    /**
     * Get suggested action based on intent
     */
    private getSuggestedAction;
    /**
     * Batch intent detection
     */
    detectBatch(texts: string[], context?: Record<string, unknown>): IntentResult[];
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Add custom pattern
     */
    addPattern(pattern: IntentPattern): void;
    /**
     * Get processing stats
     */
    getStats(): {
        cacheSize: number;
        patternCount: number;
    };
}
export declare const intentService: IntentService;
export default intentService;
//# sourceMappingURL=intentService.d.ts.map