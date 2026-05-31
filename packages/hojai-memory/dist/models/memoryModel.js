"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = exports.ProfileModel = exports.ContextModel = exports.TimelineEventModel = exports.MemoryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const index_js_1 = require("../types/index.js");
// ============================================================================
// MEMORY MODEL
// ============================================================================
const MemorySchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['user', 'merchant', 'product', 'session'], required: true },
    entityId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(index_js_1.MemoryType), required: true },
    tier: { type: String, enum: Object.values(index_js_1.MemoryTier), default: 'l4_semantic' },
    content: { type: String, required: true },
    data: { type: mongoose_1.default.Schema.Types.Mixed },
    importance: { type: Number, default: 5 },
    confidence: { type: Number, default: 0.7 },
    source: String,
    eventId: String,
    context: {
        channel: String,
        location: String,
        time: String,
        tags: [String]
    },
    validFrom: Date,
    validUntil: Date,
    isPrivate: Boolean,
    sharedWith: [String],
    lastAccessedAt: Date,
    accessCount: { type: Number, default: 0 }
}, { timestamps: true });
MemorySchema.index({ tenantId: 1, userId: 1, tier: 1 });
MemorySchema.index({ tenantId: 1, userId: 1, type: 1 });
exports.MemoryModel = mongoose_1.default.model('Memory', MemorySchema);
// ============================================================================
// TIMELINE EVENT MODEL
// ============================================================================
const TimelineEventSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    timestamp: { type: Date, required: true },
    title: { type: String, required: true },
    description: String,
    data: mongoose_1.default.Schema.Types.Mixed,
    entityType: String,
    entityId: String,
    impact: { type: String, enum: ['positive', 'negative', 'neutral'] },
    value: Number,
    memoryIds: [String]
}, { timestamps: true });
TimelineEventSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
exports.TimelineEventModel = mongoose_1.default.model('TimelineEvent', TimelineEventSchema);
// ============================================================================
// CONTEXT MODEL
// ============================================================================
const ContextSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, index: true },
    type: { type: String, required: true },
    data: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
    expiresAt: Date
}, { timestamps: true });
ContextSchema.index({ tenantId: 1, userId: 1, sessionId: 1 });
exports.ContextModel = mongoose_1.default.model('Context', ContextSchema);
// ============================================================================
// PROFILE MODEL
// ============================================================================
const ProfileSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, sparse: true, index: true },
    email: { type: String, sparse: true, index: true },
    phone: { type: String, sparse: true, index: true },
    name: String,
    computed: {
        lifetimeValue: { type: Number, default: 0 },
        visitFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'rarely'], default: 'monthly' },
        loyaltyTier: String,
        preferredChannel: String,
        lastActiveAt: Date,
        firstSeenAt: Date
    }
}, { timestamps: true });
ProfileSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
ProfileSchema.index({ tenantId: 1, email: 1 });
ProfileSchema.index({ tenantId: 1, phone: 1 });
exports.ProfileModel = mongoose_1.default.model('Profile', ProfileSchema);
// ============================================================================
// CONVERSATION MODEL
// ============================================================================
const ConversationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    messages: [{
            id: String,
            role: String,
            content: String,
            metadata: mongoose_1.default.Schema.Types.Mixed,
            createdAt: Date
        }],
    lastMessageAt: Date
}, { timestamps: true });
ConversationSchema.index({ tenantId: 1, userId: 1, status: 1 });
exports.ConversationModel = mongoose_1.default.model('Conversation', ConversationSchema);
//# sourceMappingURL=memoryModel.js.map