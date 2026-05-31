"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeSchema = exports.TrustEdgeSchema = exports.ReviewSchema = exports.VerificationSchema = exports.TrustScoreSchema = exports.TrustLevel = exports.EntityType = void 0;
const zod_1 = require("zod");
var EntityType;
(function (EntityType) {
    EntityType["MERCHANT"] = "merchant";
    EntityType["CUSTOMER"] = "customer";
    EntityType["SERVICE_PROVIDER"] = "service_provider";
    EntityType["GIG_WORKER"] = "gig_worker";
    EntityType["COMMUNITY"] = "community";
    EntityType["PRODUCT"] = "product";
    EntityType["BRAND"] = "brand";
})(EntityType || (exports.EntityType = EntityType = {}));
var TrustLevel;
(function (TrustLevel) {
    TrustLevel["UNVERIFIED"] = "unverified";
    TrustLevel["BASIC"] = "basic";
    TrustLevel["VERIFIED"] = "verified";
    TrustLevel["TRUSTED"] = "trusted";
    TrustLevel["ELITE"] = "elite";
})(TrustLevel || (exports.TrustLevel = TrustLevel = {}));
exports.TrustScoreSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    entityType: zod_1.z.nativeEnum(EntityType),
    entityId: zod_1.z.string(),
    // Scores (0-100)
    overallScore: zod_1.z.number().min(0).max(100),
    reliabilityScore: zod_1.z.number().min(0).max(100),
    qualityScore: zod_1.z.number().min(0).max(100),
    responsivenessScore: zod_1.z.number().min(0).max(100),
    deliveryScore: zod_1.z.number().min(0).max(100),
    // Trust level
    trustLevel: zod_1.z.nativeEnum(TrustLevel),
    // Factors
    factors: zod_1.z.object({
        positiveReviews: zod_1.z.number().default(0),
        negativeReviews: zod_1.z.number().default(0),
        totalTransactions: zod_1.z.number().default(0),
        avgRating: zod_1.z.number().min(0).max(5).default(0),
        responseRate: zod_1.z.number().min(0).max(100).default(0),
        deliveryRate: zod_1.z.number().min(0).max(100).default(0),
        disputeRate: zod_1.z.number().min(0).max(100).default(0),
        verifiedBadges: zod_1.z.array(zod_1.z.string()).default([]),
        tenure: zod_1.z.number().default(0), // days
        volumeScore: zod_1.z.number().min(0).max(100).default(0)
    }),
    // Recency
    lastUpdated: zod_1.z.date(),
    scoreHistory: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.date(),
        score: zod_1.z.number()
    })).max(30), // Keep 30 days of history
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.VerificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    entityType: zod_1.z.nativeEnum(EntityType),
    entityId: zod_1.z.string(),
    type: zod_1.z.enum([
        'identity',
        'business',
        'address',
        'phone',
        'email',
        'bank_account',
        'document',
        'social',
        'kyc'
    ]),
    status: zod_1.z.enum(['pending', 'verified', 'rejected', 'expired']),
    level: zod_1.z.enum(['basic', 'standard', 'enhanced', 'premium']),
    provider: zod_1.z.string().optional(),
    externalId: zod_1.z.string().optional(),
    verifiedAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.ReviewSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Reviewer
    reviewerId: zod_1.z.string(),
    reviewerType: zod_1.z.nativeEnum(EntityType),
    // Reviewed entity
    entityId: zod_1.z.string(),
    entityType: zod_1.z.nativeEnum(EntityType),
    // Rating (1-5)
    rating: zod_1.z.number().min(1).max(5),
    title: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    // Categories
    categories: zod_1.z.record(zod_1.z.number().min(1).max(5)).optional(), // e.g., { quality: 5, delivery: 4 }
    // Attributes
    isVerified: zod_1.z.boolean().default(false),
    isAnonymous: zod_1.z.boolean().default(false),
    orderId: zod_1.z.string().optional(),
    transactionValue: zod_1.z.number().optional(),
    // Feedback
    helpful: zod_1.z.number().default(0),
    unhelpful: zod_1.z.number().default(0),
    // Response
    response: zod_1.z.object({
        content: zod_1.z.string(),
        respondedAt: zod_1.z.date(),
        respondedBy: zod_1.z.string()
    }).optional(),
    status: zod_1.z.enum(['published', 'hidden', 'flagged', 'disputed']),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.TrustEdgeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Nodes
    sourceType: zod_1.z.nativeEnum(EntityType),
    sourceId: zod_1.z.string(),
    targetType: zod_1.z.nativeEnum(EntityType),
    targetId: zod_1.z.string(),
    // Relationship
    relationship: zod_1.z.enum([
        'customer_of',
        'partner_with',
        'employee_of',
        'supplier_of',
        'member_of',
        'endorsed_by',
        'referred',
        'blocked',
        'flagged'
    ]),
    // Strength (0-1)
    strength: zod_1.z.number().min(0).max(1),
    // Verification
    isVerified: zod_1.z.boolean().default(false),
    verifiedAt: zod_1.z.date().optional(),
    // Last interaction
    lastInteraction: zod_1.z.date().optional(),
    interactionCount: zod_1.z.number().default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.BadgeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    icon: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    criteria: zod_1.z.object({
        minTransactions: zod_1.z.number().optional(),
        minRating: zod_1.z.number().optional(),
        minTrustScore: zod_1.z.number().optional(),
        requiredVerifications: zod_1.z.array(zod_1.z.string()).optional(),
        maxDisputeRate: zod_1.z.number().optional()
    }),
    tier: zod_1.z.enum(['bronze', 'silver', 'gold', 'platinum']),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date()
});
