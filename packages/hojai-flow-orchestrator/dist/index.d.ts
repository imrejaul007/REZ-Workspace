/**
 * Hojai Flow Orchestrator
 *
 * Unified Memory + Intelligence + Voice Orchestrator
 * Implements Hojai Flow Architecture:
 *
 * Speech → Intent → Context → Memory → Knowledge → Reasoning → Action → Response
 *
 * Core Principles:
 * 1. Local First: Check memory tiers L1 → L2 → L3 → L4 → L5 before calling models
 * 2. Memory Before Models: Never call LLM before checking memory
 * 3. Context Before Reasoning: Load context before AI reasoning
 */
declare const app: import("express-serve-static-core").Express;
export declare enum MemoryTier {
    L1_WORKING = "l1_working",
    L2_EPISODIC = "l2_episodic",
    L3_PROCEDURAL = "l3_procedural",
    L4_SEMANTIC = "l4_semantic",
    L5_WORLD = "l5_world"
}
export interface HojaiFlowRequest {
    tenantId: string;
    userId: string;
    input: string;
    mode: 'voice' | 'text';
    audioData?: string;
    options?: {
        includeTiers?: MemoryTier[];
        maxItemsPerTier?: number;
        useReasoning?: boolean;
        useVoice?: boolean;
    };
}
export interface HojaiFlowResponse {
    flowId: string;
    input: string;
    output: string;
    audioUrl?: string;
    context: {
        memories: ContextMemory[];
        byTier: Record<MemoryTier, ContextMemory[]>;
        contextString: string;
    };
    intent?: {
        predicted: string;
        confidence: number;
    };
    reasoning?: {
        steps: ReasoningStep[];
        conclusion: string;
    };
    timing: {
        totalMs: number;
        memoryMs: number;
        intentMs: number;
        reasoningMs: number;
        llmMs: number;
    };
}
export interface ContextMemory {
    tier: MemoryTier;
    content: string;
    importance: number;
}
export interface ReasoningStep {
    step: number;
    thought: string;
}
export default app;
//# sourceMappingURL=index.d.ts.map