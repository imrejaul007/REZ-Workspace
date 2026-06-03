import mongoose from 'mongoose';
import { EntityType, TrustLevel, TrustScore, Verification, Review, TrustEdge } from '../types/index.js';
export declare const TrustScoreModel: mongoose.Model<{
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    qualityScore: number;
    reliabilityScore: number;
    overallScore: number;
    responsivenessScore: number;
    deliveryScore: number;
    trustLevel: TrustLevel;
    scoreHistory: mongoose.Types.DocumentArray<{
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }> & {
        date?: NativeDate | null | undefined;
        score?: number | null | undefined;
    }>;
    factors?: {
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
    } | null | undefined;
    lastUpdated?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const VerificationModel: mongoose.Model<{
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: string;
    status: "pending" | "rejected" | "expired" | "verified";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    metadata?: Map<string, any> | null | undefined;
    expiresAt?: NativeDate | null | undefined;
    level?: "standard" | "basic" | "premium" | "enhanced" | null | undefined;
    externalId?: string | null | undefined;
    provider?: string | null | undefined;
    verifiedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ReviewModel: mongoose.Model<{
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "hidden" | "flagged" | "published" | "disputed";
    tenantId: string;
    entityType: EntityType;
    entityId: string;
    rating: number;
    reviewerId: string;
    helpful: number;
    reviewerType: EntityType;
    isVerified: boolean;
    isAnonymous: boolean;
    unhelpful: number;
    title?: string | null | undefined;
    content?: string | null | undefined;
    response?: {
        content?: string | null | undefined;
        respondedAt?: NativeDate | null | undefined;
        respondedBy?: string | null | undefined;
    } | null | undefined;
    categories?: Map<string, number> | null | undefined;
    orderId?: string | null | undefined;
    transactionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const TrustEdgeModel: mongoose.Model<{
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    relationship: string;
    sourceType: EntityType;
    sourceId: string;
    targetId: string;
    targetType: EntityType;
    strength: number;
    isVerified: boolean;
    interactionCount: number;
    verifiedAt?: NativeDate | null | undefined;
    lastInteraction?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const BadgeModel: mongoose.Model<{
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    active: boolean;
    tenantId: string;
    color?: string | null | undefined;
    description?: string | null | undefined;
    criteria?: {
        requiredVerifications: string[];
        minTransactions?: number | null | undefined;
        minRating?: number | null | undefined;
        minTrustScore?: number | null | undefined;
        maxDisputeRate?: number | null | undefined;
    } | null | undefined;
    icon?: string | null | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class TrustService {
    /**
     * Calculate trust score
     */
    calculateScore(params: {
        tenantId: string;
        entityType: EntityType;
        entityId: string;
    }): Promise<TrustScore>;
    private getFactors;
    private countMessages;
    private countMessagesResponded;
    private countDeliveredTransactions;
    private countDisputes;
    private calcReliabilityScore;
    private calcQualityScore;
    private calcResponsivenessScore;
    private calcDeliveryScore;
    private getTrustLevel;
    /**
     * Get trust score
     */
    getScore(params: {
        tenantId: string;
        entityType: EntityType;
        entityId: string;
    }): Promise<TrustScore | null>;
    /**
     * Create review
     */
    createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review>;
    /**
     * Get reviews
     */
    getReviews(params: {
        tenantId: string;
        entityId: string;
        limit?: number;
    }): Promise<Review[]>;
    /**
     * Add verification
     */
    addVerification(verification: Omit<Verification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Verification>;
    /**
     * Get trust graph connections
     */
    getConnections(params: {
        tenantId: string;
        entityId: string;
        relationship?: string;
    }): Promise<TrustEdge[]>;
    /**
     * Add trust edge
     */
    addEdge(edge: Omit<TrustEdge, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrustEdge>;
    /**
     * Get top merchants by trust
     */
    getTopMerchants(tenantId: string, limit?: number): Promise<TrustScore[]>;
}
export declare const trustService: TrustService;
//# sourceMappingURL=trustService.d.ts.map