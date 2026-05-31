/**
 * HOJAI Training Pipeline - Signal Processor
 * Process signals from various sources: clicks, views, searches, actions, conversions, errors
 */
import { ChatMessage, Correction, Feedback } from '../types/index.js';
/**
 * Signal Processor - Process user signals and extract learning patterns
 */
export declare class SignalProcessor {
    private readonly highValueSignals;
    private readonly signalToLearningType;
    /**
     * Process a raw signal event
     */
    processSignal(signal: unknown): Promise<{
        success: boolean;
        patternId?: string;
        error?: string;
    }>;
    /**
     * Process multiple signals in batch
     */
    processBatch(signals: unknown[]): Promise<{
        processed: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Extract learning pattern from signal event
     */
    private extractPatternFromSignal;
    /**
     * Get base confidence score based on signal type
     */
    private getBaseConfidence;
    /**
     * Upsert pattern (update if exists, create if not)
     */
    private upsertPattern;
    /**
     * Process conversation for learning
     */
    processConversation(conversationId: string, messages: ChatMessage[], metadata?: Record<string, unknown>): Promise<{
        success: boolean;
        patternsCreated: number;
        error?: string;
    }>;
    /**
     * Process correction for learning
     */
    processCorrection(correction: Correction): Promise<{
        success: boolean;
        patternId?: string;
        error?: string;
    }>;
    /**
     * Process feedback for learning
     */
    processFeedback(feedback: Feedback): Promise<{
        success: boolean;
        patternId?: string;
        error?: string;
    }>;
    /**
     * Extract intents from messages
     */
    private extractIntents;
    /**
     * Extract context from messages
     */
    private extractContexts;
}
export declare const signalProcessor: SignalProcessor;
//# sourceMappingURL=signalProcessor.d.ts.map