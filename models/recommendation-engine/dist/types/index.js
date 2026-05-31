"use strict";
/**
 * HOJAI AI Recommendation Engine - Type Definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendingRequestSchema = exports.SimilarItemsRequestSchema = exports.RecommendationRequestSchema = void 0;
// Query validation schemas (for Zod)
exports.RecommendationRequestSchema = {
    limit: { min: 1, max: 100, default: 10 },
};
exports.SimilarItemsRequestSchema = {
    productId: { required: true },
    limit: { min: 1, max: 50, default: 10 },
};
exports.TrendingRequestSchema = {
    limit: { min: 1, max: 50, default: 10 },
    timeframe: { min: 1, max: 30, default: 7 },
};
//# sourceMappingURL=index.js.map