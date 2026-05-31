import { z } from 'zod';
export declare enum EntityType {
    MERCHANT = "merchant",
    CUSTOMER = "customer",
    SERVICE_PROVIDER = "service_provider",
    GIG_WORKER = "gig_worker",
    COMMUNITY = "community",
    PRODUCT = "product",
    BRAND = "brand"
}
export declare enum TrustLevel {
    UNVERIFIED = "unverified",
    BASIC = "basic",
    VERIFIED = "verified",
    TRUSTED = "trusted",
    ELITE = "elite"
}
export declare const TrustScoreSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    entityType: z.ZodNativeEnum<typeof EntityType>;
    entityId: z.ZodString;
    overallScore: z.ZodNumber;
    reliabilityScore: z.ZodNumber;
    qualityScore: z.ZodNumber;
    responsivenessScore: z.ZodNumber;
    deliveryScore: z.ZodNumber;
    trustLevel: z.ZodNativeEnum<typeof TrustLevel>;
    factors: z.ZodObject<{
        positiveReviews: z.ZodDefault<z.ZodNumber>;
        negativeReviews: z.ZodDefault<z.ZodNumber>;
        totalTransactions: z.ZodDefault<z.ZodNumber>;
        avgRating: z.ZodDefault<z.ZodNumber>;
        responseRate: z.ZodDefault<z.ZodNumber>;
        deliveryRate: z.ZodDefault<z.ZodNumber>;
        disputeRate: z.ZodDefault<z.ZodNumber>;
        verifiedBadges: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tenure: z.ZodDefault<z.ZodNumber>;
        volumeScore: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        tenure: number;
        positiveReviews: number;
        negativeReviews: number;
        totalTransactions: number;
        avgRating: number;
        responseRate: number;
        deliveryRate: number;
        disputeRate: number;
        verifiedBadges: string[];
        volumeScore: number;
    }, {
        tenure?: number | undefined;
        positiveReviews?: number | undefined;
        negativeReviews?: number | undefined;
        totalTransactions?: number | undefined;
        avgRating?: number | undefined;
        responseRate?: number | undefined;
        deliveryRate?: number | undefined;
        disputeRate?: number | undefined;
        verifiedBadges?: string[] | undefined;
        volumeScore?: number | undefined;
    }>;
    lastUpdated: z.ZodDate;
    scoreHistory: z.ZodArray<z.ZodObject<{
        date: z.ZodDate;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: Date;
        score: number;
    }, {
        date: Date;
        score: number;
    }>, "many">;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    factors: {
        tenure: number;
        positiveReviews: number;
        negativeReviews: number;
        totalTransactions: number;
        avgRating: number;
        responseRate: number;
        deliveryRate: number;
        disputeRate: number;
        verifiedBadges: string[];
        volumeScore: number;
    };
    overallScore: number;
    reliabilityScore: number;
    qualityScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    lastUpdated: Date;
    scoreHistory: {
        date: Date;
        score: number;
    }[];
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    factors: {
        tenure?: number | undefined;
        positiveReviews?: number | undefined;
        negativeReviews?: number | undefined;
        totalTransactions?: number | undefined;
        avgRating?: number | undefined;
        responseRate?: number | undefined;
        deliveryRate?: number | undefined;
        disputeRate?: number | undefined;
        verifiedBadges?: string[] | undefined;
        volumeScore?: number | undefined;
    };
    overallScore: number;
    reliabilityScore: number;
    qualityScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    lastUpdated: Date;
    scoreHistory: {
        date: Date;
        score: number;
    }[];
}>;
export type TrustScore = z.infer<typeof TrustScoreSchema>;
export declare const VerificationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    entityType: z.ZodNativeEnum<typeof EntityType>;
    entityId: z.ZodString;
    type: z.ZodEnum<["identity", "business", "address", "phone", "email", "bank_account", "document", "social", "kyc"]>;
    status: z.ZodEnum<["pending", "verified", "rejected", "expired"]>;
    level: z.ZodEnum<["basic", "standard", "enhanced", "premium"]>;
    provider: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodString>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "identity" | "business" | "email" | "phone" | "document" | "address" | "social" | "bank_account" | "kyc";
    status: "pending" | "expired" | "verified" | "rejected";
    tenantId: string;
    level: "standard" | "basic" | "premium" | "enhanced";
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
    expiresAt?: Date | undefined;
    provider?: string | undefined;
    verifiedAt?: Date | undefined;
}, {
    id: string;
    type: "identity" | "business" | "email" | "phone" | "document" | "address" | "social" | "bank_account" | "kyc";
    status: "pending" | "expired" | "verified" | "rejected";
    tenantId: string;
    level: "standard" | "basic" | "premium" | "enhanced";
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
    expiresAt?: Date | undefined;
    provider?: string | undefined;
    verifiedAt?: Date | undefined;
}>;
export type Verification = z.infer<typeof VerificationSchema>;
export declare const ReviewSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    reviewerId: z.ZodString;
    reviewerType: z.ZodNativeEnum<typeof EntityType>;
    entityId: z.ZodString;
    entityType: z.ZodNativeEnum<typeof EntityType>;
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    isVerified: z.ZodDefault<z.ZodBoolean>;
    isAnonymous: z.ZodDefault<z.ZodBoolean>;
    orderId: z.ZodOptional<z.ZodString>;
    transactionValue: z.ZodOptional<z.ZodNumber>;
    helpful: z.ZodDefault<z.ZodNumber>;
    unhelpful: z.ZodDefault<z.ZodNumber>;
    response: z.ZodOptional<z.ZodObject<{
        content: z.ZodString;
        respondedAt: z.ZodDate;
        respondedBy: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        respondedAt: Date;
        respondedBy: string;
    }, {
        content: string;
        respondedAt: Date;
        respondedBy: string;
    }>>;
    status: z.ZodEnum<["published", "hidden", "flagged", "disputed"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "flagged" | "hidden" | "published" | "disputed";
    tenantId: string;
    helpful: number;
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    response?: {
        content: string;
        respondedAt: Date;
        respondedBy: string;
    } | undefined;
    title?: string | undefined;
    content?: string | undefined;
    categories?: Record<string, number> | undefined;
    orderId?: string | undefined;
    transactionValue?: number | undefined;
}, {
    id: string;
    status: "flagged" | "hidden" | "published" | "disputed";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    reviewerType: EntityType;
    response?: {
        content: string;
        respondedAt: Date;
        respondedBy: string;
    } | undefined;
    title?: string | undefined;
    helpful?: number | undefined;
    content?: string | undefined;
    categories?: Record<string, number> | undefined;
    orderId?: string | undefined;
    isVerified?: boolean | undefined;
    isAnonymous?: boolean | undefined;
    transactionValue?: number | undefined;
    unhelpful?: number | undefined;
}>;
export type Review = z.infer<typeof ReviewSchema>;
export declare const TrustEdgeSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    sourceType: z.ZodNativeEnum<typeof EntityType>;
    sourceId: z.ZodString;
    targetType: z.ZodNativeEnum<typeof EntityType>;
    targetId: z.ZodString;
    relationship: z.ZodEnum<["customer_of", "partner_with", "employee_of", "supplier_of", "member_of", "endorsed_by", "referred", "blocked", "flagged"]>;
    strength: z.ZodNumber;
    isVerified: z.ZodDefault<z.ZodBoolean>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    lastInteraction: z.ZodOptional<z.ZodDate>;
    interactionCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    relationship: "blocked" | "flagged" | "customer_of" | "partner_with" | "employee_of" | "supplier_of" | "member_of" | "endorsed_by" | "referred";
    sourceType: EntityType;
    strength: number;
    isVerified: boolean;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
    interactionCount: number;
    verifiedAt?: Date | undefined;
    lastInteraction?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    relationship: "blocked" | "flagged" | "customer_of" | "partner_with" | "employee_of" | "supplier_of" | "member_of" | "endorsed_by" | "referred";
    sourceType: EntityType;
    strength: number;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
    verifiedAt?: Date | undefined;
    isVerified?: boolean | undefined;
    lastInteraction?: Date | undefined;
    interactionCount?: number | undefined;
}>;
export type TrustEdge = z.infer<typeof TrustEdgeSchema>;
export declare const BadgeSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    criteria: z.ZodObject<{
        minTransactions: z.ZodOptional<z.ZodNumber>;
        minRating: z.ZodOptional<z.ZodNumber>;
        minTrustScore: z.ZodOptional<z.ZodNumber>;
        requiredVerifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        maxDisputeRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        minTransactions?: number | undefined;
        minRating?: number | undefined;
        minTrustScore?: number | undefined;
        requiredVerifications?: string[] | undefined;
        maxDisputeRate?: number | undefined;
    }, {
        minTransactions?: number | undefined;
        minRating?: number | undefined;
        minTrustScore?: number | undefined;
        requiredVerifications?: string[] | undefined;
        maxDisputeRate?: number | undefined;
    }>;
    tier: z.ZodEnum<["bronze", "silver", "gold", "platinum"]>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    criteria: {
        minTransactions?: number | undefined;
        minRating?: number | undefined;
        minTrustScore?: number | undefined;
        requiredVerifications?: string[] | undefined;
        maxDisputeRate?: number | undefined;
    };
    tier: "bronze" | "silver" | "gold" | "platinum";
    icon?: string | undefined;
    color?: string | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    criteria: {
        minTransactions?: number | undefined;
        minRating?: number | undefined;
        minTrustScore?: number | undefined;
        requiredVerifications?: string[] | undefined;
        maxDisputeRate?: number | undefined;
    };
    tier: "bronze" | "silver" | "gold" | "platinum";
    active?: boolean | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}>;
export type Badge = z.infer<typeof BadgeSchema>;
//# sourceMappingURL=index.d.ts.map