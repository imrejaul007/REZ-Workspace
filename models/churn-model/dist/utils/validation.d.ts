/**
 * Zod validation schemas for HOJAI AI Churn Model Service
 */
import { z } from 'zod';
export declare const featuresSchema: z.ZodObject<{
    daysSinceLastPurchase: z.ZodNumber;
    totalOrders: z.ZodNumber;
    averageOrderValue: z.ZodNumber;
    engagementScore: z.ZodNumber;
    supportTickets: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    daysSinceLastPurchase: number;
    totalOrders: number;
    averageOrderValue: number;
    engagementScore: number;
    supportTickets: number;
}, {
    daysSinceLastPurchase: number;
    totalOrders: number;
    averageOrderValue: number;
    engagementScore: number;
    supportTickets: number;
}>;
export declare const churnPredictionRequestSchema: z.ZodObject<{
    customerId: z.ZodString;
    features: z.ZodObject<{
        daysSinceLastPurchase: z.ZodNumber;
        totalOrders: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        engagementScore: z.ZodNumber;
        supportTickets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    }, {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    }>;
}, "strip", z.ZodTypeAny, {
    features: {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    };
    customerId: string;
}, {
    features: {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    };
    customerId: string;
}>;
export declare const trainRequestSchema: z.ZodObject<{
    customerId: z.ZodString;
    features: z.ZodObject<{
        daysSinceLastPurchase: z.ZodNumber;
        totalOrders: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        engagementScore: z.ZodNumber;
        supportTickets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    }, {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    }>;
    label: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    features: {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    };
    customerId: string;
    label: boolean;
}, {
    features: {
        daysSinceLastPurchase: number;
        totalOrders: number;
        averageOrderValue: number;
        engagementScore: number;
        supportTickets: number;
    };
    customerId: string;
    label: boolean;
}>;
export declare const batchTrainRequestSchema: z.ZodObject<{
    samples: z.ZodArray<z.ZodObject<{
        customerId: z.ZodString;
        features: z.ZodObject<{
            daysSinceLastPurchase: z.ZodNumber;
            totalOrders: z.ZodNumber;
            averageOrderValue: z.ZodNumber;
            engagementScore: z.ZodNumber;
            supportTickets: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        }, {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        }>;
        label: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        features: {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        };
        customerId: string;
        label: boolean;
    }, {
        features: {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        };
        customerId: string;
        label: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    samples: {
        features: {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        };
        customerId: string;
        label: boolean;
    }[];
}, {
    samples: {
        features: {
            daysSinceLastPurchase: number;
            totalOrders: number;
            averageOrderValue: number;
            engagementScore: number;
            supportTickets: number;
        };
        customerId: string;
        label: boolean;
    }[];
}>;
export declare const modelIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type ChurnPredictionRequestInput = z.infer<typeof churnPredictionRequestSchema>;
export type TrainRequestInput = z.infer<typeof trainRequestSchema>;
export type BatchTrainRequestInput = z.infer<typeof batchTrainRequestSchema>;
export type ModelIdInput = z.infer<typeof modelIdSchema>;
//# sourceMappingURL=validation.d.ts.map