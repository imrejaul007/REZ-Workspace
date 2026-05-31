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
exports.RecommendationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RecommendationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    score: { type: Number, required: true, min: 0, max: 1 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: String, required: true },
    context: {
        trigger: String,
        sourceEntityId: String,
        position: Number
    },
    display: {
        imageUrl: String,
        price: Number,
        discount: Number,
        rating: Number
    },
    personalization: {
        demographics: Boolean,
        behavior: Boolean,
        collaborative: Boolean,
        contextual: Boolean
    },
    validFrom: Date,
    validUntil: Date,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    collection: 'recommendations'
});
RecommendationSchema.index({ tenantId: 1, userId: 1, type: 1 });
RecommendationSchema.index({ tenantId: 1, userId: 1, validUntil: 1 });
RecommendationSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
exports.RecommendationModel = mongoose_1.default.model('Recommendation', RecommendationSchema);
//# sourceMappingURL=predictModel.js.map