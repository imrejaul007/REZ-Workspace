/**
 * HOJAI Training Pipeline - Learner Service
 * Core learning engine that learns from conversations, actions, corrections, and feedback
 * Implements the continuous loop: Capture -> Analyze -> Learn -> Improve -> Deploy
 */
import { v4 as uuidv4 } from 'uuid';
import { LearningSource, LearningType, LearningStage, LearningStatus } from '../types/index.js';
import { LearnedPattern as LearnedPatternModel, LearningEvent, TrainingBatch as TrainingBatchModel } from '../models/learning.js';
import { logger } from '../utils/logger.js';
/**
 * Confidence thresholds for learning progression
 */
const CONFIDENCE_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.85,
    ARCHIVE: 0.15 // Archive if confidence drops below this
};
/**
 * Frequency thresholds for stage transitions
 */
const FREQUENCY_THRESHOLDS = {
    SHORT_TO_MEDIUM: 3,
    MEDIUM_TO_LONG: 10,
    LONG_TO_MODEL: 50
};
/**
 * Learner Service - Core learning engine
 */
export class Learner {
    /**
     * Capture learning from any source
     */
    async capture(payload) {
        const startTime = Date.now();
        try {
            // Validate payload
            const validated = this.validatePayload(payload);
            // Create learning event for audit
            const eventId = uuidv4();
            await LearningEvent.create({
                eventId,
                tenantId: validated.tenantId,
                userId: validated.userId,
                source: validated.source,
                sourceId: validated.sourceId,
                type: validated.type,
                rawContent: validated.content
            });
            // Determine initial stage
            const stage = this.determineInitialStage(validated);
            // Create pattern
            const patternId = uuidv4();
            const now = new Date().toISOString();
            // Set expiration for short-term patterns
            const expiresAt = stage === LearningStage.SHORT_TERM
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                : undefined;
            await LearnedPatternModel.create({
                patternId,
                tenantId: validated.tenantId,
                userId: validated.userId,
                source: validated.source,
                type: validated.type,
                stage,
                status: LearningStatus.CAPTURED,
                content: validated.content,
                confidence: validated.confidence,
                frequency: 1,
                metadata: {
                    capturedFrom: validated.source,
                    capturedAt: now
                },
                expiresAt
            });
            // Trigger async analysis
            this.analyzeAndLearn(patternId).catch((err) => {
                logger.error('Async analysis failed', { patternId, error: err.message });
            });
            const latencyMs = Date.now() - startTime;
            logger.info('Learning captured', {
                patternId,
                source: validated.source,
                type: validated.type,
                stage,
                latencyMs
            });
            return { patternId, status: LearningStatus.CAPTURED };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Learning capture failed', { error: message, payload });
            throw new Error(`Failed to capture learning: ${message}`);
        }
    }
    /**
     * Process learning from conversations
     */
    async learnFromConversation(conversationId, messages, options) {
        const patternsLearned = [];
        const intents = [];
        try {
            // Extract Q&A pairs from messages
            for (let i = 0; i < messages.length - 1; i++) {
                const current = messages[i];
                const next = messages[i + 1];
                if (current.role === 'user' && next.role === 'assistant') {
                    // Learn response pattern
                    const patternId = await this.learnResponsePattern(current.content, next.content, conversationId, options?.tenantId, options?.userId);
                    if (patternId)
                        patternsLearned.push(patternId);
                }
            }
            // Extract intents from user messages
            for (const msg of messages) {
                if (msg.role === 'user') {
                    const intent = this.extractIntent(msg.content);
                    if (intent) {
                        const patternId = await this.learnIntent(intent, msg.content, conversationId, options?.tenantId, options?.userId);
                        if (patternId) {
                            intents.push(intent);
                            patternsLearned.push(patternId);
                        }
                    }
                }
            }
            // Extract context from follow-up patterns
            const contextPatterns = this.extractFollowupContext(messages);
            for (const ctx of contextPatterns) {
                const patternId = await this.learnContext(ctx.context, ctx.followup, conversationId, options?.tenantId, options?.userId);
                if (patternId)
                    patternsLearned.push(patternId);
            }
            logger.info('Conversation learning complete', {
                conversationId,
                patternsLearned: patternsLearned.length,
                intents: intents.length
            });
            return { patternsLearned: patternsLearned.length, intents };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Conversation learning failed', { conversationId, error: message });
            throw error;
        }
    }
    /**
     * Process learning from user actions
     */
    async learnFromAction(action, options) {
        const learningType = this.actionToLearningType(action.type);
        const confidence = this.actionToConfidence(action.type);
        const payload = {
            source: LearningSource.SIGNAL,
            sourceId: uuidv4(),
            type: learningType,
            content: {
                action: action.type,
                entityType: action.entityType,
                entityId: action.entityId,
                properties: action.properties
            },
            confidence,
            tenantId: options?.tenantId,
            userId: options?.userId
        };
        const result = await this.capture(payload);
        return { patternId: result.patternId, type: learningType };
    }
    /**
     * Process learning from corrections
     */
    async learnFromCorrection(original, corrected, reason, options) {
        // Calculate improvement score
        const improvement = this.calculateImprovement(original, corrected);
        const payload = {
            source: LearningSource.CORRECTION,
            sourceId: uuidv4(),
            type: LearningType.QUALITY,
            content: {
                wrong: original,
                correct: corrected,
                reason,
                context: options?.context,
                improvement
            },
            confidence: Math.min(0.95, 0.5 + improvement * 0.3),
            tenantId: options?.tenantId,
            userId: options?.userId
        };
        const result = await this.capture(payload);
        // Decay confidence of similar wrong patterns
        await this.decaySimilarWrongPatterns(original, options?.tenantId, options?.userId);
        return { patternId: result.patternId, improvement };
    }
    /**
     * Process learning from feedback
     */
    async learnFromFeedback(feedback, options) {
        const source = feedback.type === 'correction' ? LearningSource.CORRECTION : LearningSource.FEEDBACK;
        const type = feedback.type === 'positive' ? LearningType.SUCCESS :
            feedback.type === 'negative' ? LearningType.FAILURE :
                LearningType.QUALITY;
        const confidence = feedback.score ? feedback.score / 5 : 0.5;
        const payload = {
            source,
            sourceId: uuidv4(),
            type,
            content: {
                feedbackType: feedback.type,
                score: feedback.score,
                content: feedback.content,
                itemType: feedback.itemType,
                itemId: feedback.itemId
            },
            confidence,
            tenantId: options?.tenantId,
            userId: options?.userId
        };
        const result = await this.capture(payload);
        // If high-quality feedback, boost related patterns
        if (feedback.score && feedback.score >= 4) {
            await this.boostRelatedPatterns(feedback.itemType, feedback.itemId, options?.tenantId, options?.userId);
        }
        return { patternId: result.patternId, newConfidence: confidence };
    }
    /**
     * Get learned patterns based on query
     */
    async getPatterns(query) {
        const filter = {};
        if (query.tenantId)
            filter.tenantId = query.tenantId;
        if (query.userId)
            filter.userId = query.userId;
        if (query.type)
            filter.type = query.type;
        if (query.source)
            filter.source = query.source;
        if (query.stage)
            filter.stage = query.stage;
        if (query.status)
            filter.status = query.status;
        const limit = query.limit || 100;
        const offset = query.offset || 0;
        const [patterns, total] = await Promise.all([
            LearnedPatternModel
                .find(filter)
                .sort({ lastUpdated: -1, confidence: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            LearnedPatternModel.countDocuments(filter)
        ]);
        return {
            patterns: patterns.map(this.mapToLearnedPattern),
            total,
            hasMore: offset + patterns.length < total
        };
    }
    /**
     * Get learning insights for a tenant/user
     */
    async getInsights(options) {
        const filter = {};
        if (options?.tenantId)
            filter.tenantId = options.tenantId;
        if (options?.userId)
            filter.userId = options.userId;
        const [patterns, recentPatterns] = await Promise.all([
            LearnedPatternModel.find(filter).lean(),
            LearnedPatternModel
                .find(filter)
                .sort({ lastUpdated: -1 })
                .limit(20)
                .lean()
        ]);
        // Calculate statistics
        const byType = {};
        const bySource = {};
        let highConfidenceCount = 0;
        let totalConfidence = 0;
        for (const p of patterns) {
            byType[p.type] = (byType[p.type] || 0) + 1;
            bySource[p.source] = (bySource[p.source] || 0) + 1;
            if (p.confidence >= CONFIDENCE_THRESHOLDS.HIGH)
                highConfidenceCount++;
            totalConfidence += p.confidence;
        }
        // Find top patterns by frequency and confidence
        const topPatterns = patterns
            .sort((a, b) => (b.confidence * b.frequency) - (a.confidence * a.frequency))
            .slice(0, 10)
            .map(this.mapToLearnedPattern);
        const accuracy = patterns.length > 0 ? totalConfidence / patterns.length : 0;
        const improvementRate = patterns.length > 10
            ? patterns.filter((p) => p.confidence > 0.7).length / patterns.length
            : 0;
        return {
            totalPatterns: patterns.length,
            byType: byType,
            bySource: bySource,
            topPatterns,
            recentLearning: recentPatterns.map(this.mapToLearnedPattern),
            accuracy,
            improvementRate
        };
    }
    /**
     * Run training batch process
     */
    async runTrainingBatch(options) {
        const batchId = uuidv4();
        const startTime = new Date();
        try {
            // Create batch record
            await TrainingBatchModel.create({
                batchId,
                tenantId: options?.tenantId,
                status: 'processing',
                startedAt: startTime
            });
            // Find patterns to process
            const filter = { status: LearningStatus.LEARNED };
            if (options?.tenantId)
                filter.tenantId = options.tenantId;
            const patterns = await LearnedPatternModel
                .find(filter)
                .limit(options?.batchSize || 1000)
                .lean();
            const statistics = {
                totalPatterns: patterns.length,
                byType: {},
                bySource: {},
                highConfidenceCount: 0,
                archivedCount: 0
            };
            // Process each pattern
            for (const pattern of patterns) {
                // Update stage based on frequency
                if (pattern.frequency >= FREQUENCY_THRESHOLDS.LONG_TO_MODEL) {
                    pattern.stage = LearningStage.MODEL;
                    pattern.status = LearningStatus.DEPLOYED;
                }
                else if (pattern.frequency >= FREQUENCY_THRESHOLDS.MEDIUM_TO_LONG) {
                    pattern.stage = LearningStage.LONG_TERM;
                }
                // Track statistics
                statistics.byType[pattern.type] = (statistics.byType[pattern.type] || 0) + 1;
                statistics.bySource[pattern.source] = (statistics.bySource[pattern.source] || 0) + 1;
                if (pattern.confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
                    statistics.highConfidenceCount++;
                }
                // Archive low-confidence patterns
                if (pattern.confidence < CONFIDENCE_THRESHOLDS.ARCHIVE) {
                    pattern.status = LearningStatus.ARCHIVED;
                    statistics.archivedCount++;
                }
                await pattern.save();
            }
            const endTime = new Date();
            // Update batch with results
            await TrainingBatchModel.findOneAndUpdate({ batchId }, {
                patterns: patterns.map((p) => p.patternId),
                statistics,
                status: 'completed',
                completedAt: endTime
            });
            logger.info('Training batch completed', {
                batchId,
                patternsProcessed: patterns.length,
                archivedCount: statistics.archivedCount,
                durationMs: endTime.getTime() - startTime.getTime()
            });
            return {
                batchId,
                patterns: patterns.map(this.mapToLearnedPattern),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                statistics
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            await TrainingBatchModel.findOneAndUpdate({ batchId }, { status: 'failed', error: message });
            logger.error('Training batch failed', { batchId, error: message });
            throw error;
        }
    }
    /**
     * Archive old patterns
     */
    async archiveOldPatterns(olderThanDays = 90) {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        const result = await LearnedPatternModel.updateMany({
            stage: LearningStage.SHORT_TERM,
            status: { $ne: LearningStatus.ARCHIVED },
            lastUpdated: { $lt: cutoffDate }
        }, {
            $set: { status: LearningStatus.ARCHIVED }
        });
        logger.info('Archived old patterns', {
            count: result.modifiedCount,
            olderThanDays
        });
        return result.modifiedCount;
    }
    // =========================================================================
    // Private Methods
    // =========================================================================
    validatePayload(payload) {
        if (!payload.source)
            throw new Error('Source is required');
        if (!payload.sourceId)
            throw new Error('Source ID is required');
        if (!payload.type)
            throw new Error('Type is required');
        if (!payload.content)
            throw new Error('Content is required');
        return {
            ...payload,
            confidence: payload.confidence ?? 0.5,
            timestamp: payload.timestamp || new Date().toISOString()
        };
    }
    determineInitialStage(payload) {
        // High-value signals go to long-term immediately
        if (payload.source === LearningSource.CORRECTION || payload.source === LearningSource.CONVERSION) {
            return LearningStage.LONG_TERM;
        }
        // Default to short-term, will be promoted based on frequency
        return LearningStage.SHORT_TERM;
    }
    async analyzeAndLearn(patternId) {
        const pattern = await LearnedPatternModel.findOne({ patternId });
        if (!pattern)
            return;
        // Update status to processing
        pattern.status = LearningStatus.PROCESSING;
        await pattern.save();
        // Perform analysis
        const newConfidence = this.calculateNewConfidence(pattern);
        pattern.confidence = newConfidence;
        pattern.status = LearningStatus.LEARNED;
        pattern.lastUpdated = new Date();
        // Check for stage promotion
        if (pattern.frequency >= FREQUENCY_THRESHOLDS.SHORT_TO_MEDIUM) {
            pattern.stage = LearningStage.LONG_TERM;
        }
        await pattern.save();
    }
    calculateNewConfidence(pattern) {
        let confidence = pattern.confidence;
        // Boost based on frequency
        confidence += Math.log(pattern.frequency + 1) * 0.05;
        // Boost based on source quality
        const sourceBoost = {
            [LearningSource.CORRECTION]: 0.15,
            [LearningSource.FEEDBACK]: 0.1,
            [LearningSource.CONVERSION]: 0.2,
            [LearningSource.CHAT]: 0.05,
            [LearningSource.SIGNAL]: 0.02,
            [LearningSource.EVENT]: 0.03
        };
        confidence += sourceBoost[pattern.source] || 0;
        // Clamp to [0, 1]
        return Math.max(0, Math.min(1, confidence));
    }
    async learnResponsePattern(input, output, conversationId, tenantId, userId) {
        // Check for existing similar pattern
        const existing = await LearnedPatternModel.findOne({
            tenantId,
            userId,
            source: LearningSource.CHAT,
            type: LearningType.RESPONSE_PATTERN,
            'content.input': { $regex: this.escapeRegex(input), $options: 'i' }
        });
        if (existing) {
            // Update existing pattern
            existing.frequency += 1;
            existing.content = { input, output, conversationId };
            existing.lastUpdated = new Date();
            existing.status = LearningStatus.LEARNED;
            await existing.save();
            return existing.patternId;
        }
        // Create new pattern
        const pattern = await LearnedPatternModel.create({
            patternId: uuidv4(),
            tenantId,
            userId,
            source: LearningSource.CHAT,
            type: LearningType.RESPONSE_PATTERN,
            stage: LearningStage.SHORT_TERM,
            status: LearningStatus.LEARNED,
            content: { input, output, conversationId },
            confidence: 0.5,
            frequency: 1,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        return pattern.patternId;
    }
    extractIntent(content) {
        const intentPatterns = [
            { pattern: /^(buy|purchase|order|get)\s+/i, intent: 'purchase' },
            { pattern: /^(find|search|look for|show)\s+/i, intent: 'search' },
            { pattern: /^(help|how|what|can you)/i, intent: 'help' },
            { pattern: /^(cancel|stop|remove|delete)\s+/i, intent: 'cancel' },
            { pattern: /^(info|details|tell me about|more)/i, intent: 'info' }
        ];
        for (const { pattern, intent } of intentPatterns) {
            if (pattern.test(content))
                return intent;
        }
        return null;
    }
    async learnIntent(intent, originalText, conversationId, tenantId, userId) {
        const pattern = await LearnedPatternModel.create({
            patternId: uuidv4(),
            tenantId,
            userId,
            source: LearningSource.CHAT,
            type: LearningType.INTENT,
            stage: LearningStage.SHORT_TERM,
            status: LearningStatus.LEARNED,
            content: { intent, originalText, conversationId },
            confidence: 0.6,
            frequency: 1
        });
        return pattern.patternId;
    }
    extractFollowupContext(messages) {
        const contexts = [];
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            if (current.role === 'user' && next.role === 'user') {
                // This is a follow-up
                contexts.push({
                    context: current.content,
                    followup: next.content
                });
            }
        }
        return contexts;
    }
    async learnContext(context, followup, conversationId, tenantId, userId) {
        const pattern = await LearnedPatternModel.create({
            patternId: uuidv4(),
            tenantId,
            userId,
            source: LearningSource.CHAT,
            type: LearningType.CONTEXT,
            stage: LearningStage.SHORT_TERM,
            status: LearningStatus.LEARNED,
            content: { context, followup, conversationId },
            confidence: 0.5,
            frequency: 1
        });
        return pattern.patternId;
    }
    actionToLearningType(action) {
        const map = {
            click: LearningType.PREFERENCE,
            view: LearningType.INTEREST,
            search: LearningType.NEED,
            purchase: LearningType.SUCCESS,
            cancel: LearningType.FAILURE,
            error: LearningType.FAILURE
        };
        return map[action] || LearningType.PREFERENCE;
    }
    actionToConfidence(action) {
        const map = {
            purchase: 0.9,
            error: 0.85,
            cancel: 0.75,
            search: 0.6,
            click: 0.5,
            view: 0.4
        };
        return map[action] || 0.5;
    }
    calculateImprovement(original, corrected) {
        // Simple heuristic: improvement based on length difference and content difference
        const lengthDiff = Math.abs(corrected.length - original.length) / Math.max(original.length, corrected.length);
        const wordDiff = Math.abs(corrected.split(' ').length - original.split(' ').length) / Math.max(original.split(' ').length, 1);
        return Math.min(1, (lengthDiff + wordDiff) / 2 + 0.5);
    }
    async decaySimilarWrongPatterns(wrongContent, tenantId, userId) {
        const filter = {
            tenantId,
            userId,
            source: LearningSource.CORRECTION,
            type: LearningType.FAILURE
        };
        const patterns = await LearnedPatternModel.find(filter);
        for (const pattern of patterns) {
            const content = pattern.content;
            if (content.wrong && typeof content.wrong === 'string') {
                // Simple similarity check
                const similarity = this.calculateSimilarity(wrongContent, content.wrong);
                if (similarity > 0.7) {
                    pattern.confidence *= 0.8; // Decay confidence
                    if (pattern.confidence < CONFIDENCE_THRESHOLDS.ARCHIVE) {
                        pattern.status = LearningStatus.ARCHIVED;
                    }
                    await pattern.save();
                }
            }
        }
    }
    calculateSimilarity(a, b) {
        const aWords = new Set(a.toLowerCase().split(/\s+/));
        const bWords = new Set(b.toLowerCase().split(/\s+/));
        const intersection = new Set([...aWords].filter((x) => bWords.has(x)));
        const union = new Set([...aWords, ...bWords]);
        return intersection.size / union.size;
    }
    async boostRelatedPatterns(itemType, itemId, tenantId, userId) {
        if (!itemType || !itemId)
            return;
        const patterns = await LearnedPatternModel.find({
            tenantId,
            userId,
            'content.itemType': itemType,
            'content.itemId': itemId
        });
        for (const pattern of patterns) {
            pattern.confidence = Math.min(1, pattern.confidence + 0.1);
            pattern.frequency += 1;
            await pattern.save();
        }
    }
    mapToLearnedPattern(doc) {
        return {
            id: doc.patternId,
            tenantId: doc.tenantId,
            userId: doc.userId,
            source: doc.source,
            type: doc.type,
            stage: doc.stage,
            status: doc.status,
            content: doc.content,
            confidence: doc.confidence,
            frequency: doc.frequency,
            lastUpdated: doc.lastUpdated,
            createdAt: doc.createdAt,
            expiresAt: doc.expiresAt,
            metadata: doc.metadata
        };
    }
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
// Singleton instance
export const learner = new Learner();
//# sourceMappingURL=learner.js.map