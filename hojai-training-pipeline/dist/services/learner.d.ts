/**
 * HOJAI Training Pipeline - Learner Service
 * Core learning engine that learns from conversations, actions, corrections, and feedback
 * Implements the continuous loop: Capture -> Analyze -> Learn -> Improve -> Deploy
 */
import { LearningType, LearningStatus, LearnedPattern, LearningPayload, QueryLearning, LearningInsights, TrainingBatch } from '../types/index.js';
/**
 * Learner Service - Core learning engine
 */
export declare class Learner {
    /**
     * Capture learning from any source
     */
    capture(payload: LearningPayload): Promise<{
        patternId: string;
        status: LearningStatus;
    }>;
    /**
     * Process learning from conversations
     */
    learnFromConversation(conversationId: string, messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        metadata?: Record<string, unknown>;
    }>, options?: {
        tenantId?: string;
        userId?: string;
    }): Promise<{
        patternsLearned: number;
        intents: string[];
    }>;
    /**
     * Process learning from user actions
     */
    learnFromAction(action: {
        type: 'click' | 'view' | 'search' | 'purchase' | 'cancel' | 'error';
        entityType?: string;
        entityId?: string;
        properties?: Record<string, unknown>;
    }, options?: {
        tenantId?: string;
        userId?: string;
    }): Promise<{
        patternId: string;
        type: LearningType;
    }>;
    /**
     * Process learning from corrections
     */
    learnFromCorrection(original: string, corrected: string, reason?: string, options?: {
        tenantId?: string;
        userId?: string;
        context?: Record<string, unknown>;
    }): Promise<{
        patternId: string;
        improvement: number;
    }>;
    /**
     * Process learning from feedback
     */
    learnFromFeedback(feedback: {
        type: 'positive' | 'negative' | 'rating' | 'correction';
        score?: number;
        content?: string;
        itemType?: string;
        itemId?: string;
    }, options?: {
        tenantId?: string;
        userId?: string;
    }): Promise<{
        patternId: string;
        newConfidence: number;
    }>;
    /**
     * Get learned patterns based on query
     */
    getPatterns(query: QueryLearning): Promise<{
        patterns: LearnedPattern[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get learning insights for a tenant/user
     */
    getInsights(options?: {
        tenantId?: string;
        userId?: string;
    }): Promise<LearningInsights>;
    /**
     * Run training batch process
     */
    runTrainingBatch(options?: {
        tenantId?: string;
        batchSize?: number;
        minConfidence?: number;
    }): Promise<TrainingBatch>;
    /**
     * Archive old patterns
     */
    archiveOldPatterns(olderThanDays?: number): Promise<number>;
    private validatePayload;
    private determineInitialStage;
    private analyzeAndLearn;
    private calculateNewConfidence;
    private learnResponsePattern;
    private extractIntent;
    private learnIntent;
    private extractFollowupContext;
    private learnContext;
    private actionToLearningType;
    private actionToConfidence;
    private calculateImprovement;
    private decaySimilarWrongPatterns;
    private calculateSimilarity;
    private boostRelatedPatterns;
    private mapToLearnedPattern;
    private escapeRegex;
}
export declare const learner: Learner;
//# sourceMappingURL=learner.d.ts.map