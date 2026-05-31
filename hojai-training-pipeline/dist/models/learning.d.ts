/**
 * HOJAI Training Pipeline - Learning Models
 * MongoDB models for storing learned patterns
 */
import mongoose, { Document } from 'mongoose';
import { LearningSource, LearningType, LearningStage, LearningStatus } from '../types/index.js';
export interface ILearnedPattern extends Document {
    _id: mongoose.Types.ObjectId;
    patternId: string;
    tenantId?: string;
    userId?: string;
    source: LearningSource;
    type: LearningType;
    stage: LearningStage;
    status: LearningStatus;
    content: Record<string, unknown>;
    confidence: number;
    frequency: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    lastUpdated: Date;
    expiresAt?: Date;
}
export declare const LearnedPattern: mongoose.Model<ILearnedPattern, {}, {}, {}, mongoose.Document<unknown, {}, ILearnedPattern, {}, {}> & ILearnedPattern & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ILearningEvent extends Document {
    _id: mongoose.Types.ObjectId;
    eventId: string;
    tenantId?: string;
    userId?: string;
    source: LearningSource;
    sourceId: string;
    type: LearningType;
    rawContent: Record<string, unknown>;
    processed: boolean;
    error?: string;
    createdAt: Date;
    processedAt?: Date;
}
export declare const LearningEvent: mongoose.Model<ILearningEvent, {}, {}, {}, mongoose.Document<unknown, {}, ILearningEvent, {}, {}> & ILearningEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ITrainingBatch extends Document {
    _id: mongoose.Types.ObjectId;
    batchId: string;
    tenantId?: string;
    patterns: string[];
    statistics: {
        totalPatterns: number;
        byType: Record<string, number>;
        bySource: Record<string, number>;
        highConfidenceCount: number;
        archivedCount: number;
    };
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
}
export declare const TrainingBatch: mongoose.Model<ITrainingBatch, {}, {}, {}, mongoose.Document<unknown, {}, ITrainingBatch, {}, {}> & ITrainingBatch & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare function connectDatabase(uri?: string): Promise<typeof mongoose>;
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=learning.d.ts.map