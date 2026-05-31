/**
 * HOJAI Training Pipeline - Learning Models
 * MongoDB models for storing learned patterns
 */
import mongoose, { Schema } from 'mongoose';
import { LearningSource, LearningType, LearningStage, LearningStatus } from '../types/index.js';
const LearnedPatternSchema = new Schema({
    patternId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tenantId: {
        type: String,
        index: true,
        sparse: true
    },
    userId: {
        type: String,
        index: true,
        sparse: true
    },
    source: {
        type: String,
        enum: Object.values(LearningSource),
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(LearningType),
        required: true,
        index: true
    },
    stage: {
        type: String,
        enum: Object.values(LearningStage),
        required: true,
        default: LearningStage.SHORT_TERM
    },
    status: {
        type: String,
        enum: Object.values(LearningStatus),
        required: true,
        default: LearningStatus.CAPTURED,
        index: true
    },
    content: {
        type: Schema.Types.Mixed,
        required: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.5
    },
    frequency: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    metadata: {
        type: Schema.Types.Mixed
    },
    expiresAt: {
        type: Date,
        index: { expires: 0 }
    }
}, {
    timestamps: true,
    collection: 'learned_patterns'
});
// Compound indexes for common queries
LearnedPatternSchema.index({ tenantId: 1, type: 1, status: 1 });
LearnedPatternSchema.index({ userId: 1, type: 1, status: 1 });
LearnedPatternSchema.index({ source: 1, stage: 1, status: 1 });
LearnedPatternSchema.index({ confidence: 1, frequency: 1 });
// TTL index for short-term patterns
LearnedPatternSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LearnedPattern = mongoose.model('LearnedPattern', LearnedPatternSchema);
const LearningEventSchema = new Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tenantId: {
        type: String,
        index: true,
        sparse: true
    },
    userId: {
        type: String,
        index: true,
        sparse: true
    },
    source: {
        type: String,
        enum: Object.values(LearningSource),
        required: true
    },
    sourceId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(LearningType),
        required: true
    },
    rawContent: {
        type: Schema.Types.Mixed,
        required: true
    },
    processed: {
        type: Boolean,
        default: false,
        index: true
    },
    error: {
        type: String
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'learning_events'
});
LearningEventSchema.index({ tenantId: 1, processed: 1, createdAt: -1 });
LearningEventSchema.index({ createdAt: -1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days TTL
export const LearningEvent = mongoose.model('LearningEvent', LearningEventSchema);
const TrainingBatchSchema = new Schema({
    batchId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tenantId: {
        type: String,
        index: true,
        sparse: true
    },
    patterns: [
        {
            type: String,
            ref: 'LearnedPattern'
        }
    ],
    statistics: {
        totalPatterns: { type: Number, default: 0 },
        byType: { type: Schema.Types.Mixed, default: {} },
        bySource: { type: Schema.Types.Mixed, default: {} },
        highConfidenceCount: { type: Number, default: 0 },
        archivedCount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    error: {
        type: String
    },
    startedAt: {
        type: Date,
        required: true
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'training_batches'
});
export const TrainingBatch = mongoose.model('TrainingBatch', TrainingBatchSchema);
// ============================================================================
// Model Export Helper
// ============================================================================
export async function connectDatabase(uri) {
    const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-training';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB:', mongoUri);
    }
    return mongoose;
}
export async function disconnectDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
//# sourceMappingURL=learning.js.map