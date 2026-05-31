/**
 * Zod validation schemas for HOJAI AI LTV Model Service
 */
import { z } from 'zod';
export declare const ltvFeaturesSchema: z.ZodObject<{
    totalRevenue: z.ZodNumber;
    orderCount: z.ZodNumber;
    averageOrderValue: z.ZodNumber;
    daysActive: z.ZodNumber;
    retentionRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    daysActive: number;
    retentionRate: number;
}, {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    daysActive: number;
    retentionRate: number;
}>;
export declare const ltvPredictionRequestSchema: z.ZodObject<{
    customerId: z.ZodString;
    features: z.ZodObject<{
        totalRevenue: z.ZodNumber;
        orderCount: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        daysActive: z.ZodNumber;
        retentionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    }, {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    }>;
}, "strip", z.ZodTypeAny, {
    features: {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    };
    customerId: string;
}, {
    features: {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    };
    customerId: string;
}>;
export declare const ltvTrainSampleSchema: z.ZodObject<{
    customerId: z.ZodString;
    features: z.ZodObject<{
        totalRevenue: z.ZodNumber;
        orderCount: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        daysActive: z.ZodNumber;
        retentionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    }, {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    }>;
    actualLTV: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    features: {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    };
    customerId: string;
    actualLTV: number;
}, {
    features: {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        daysActive: number;
        retentionRate: number;
    };
    customerId: string;
    actualLTV: number;
}>;
export declare const ltvBatchTrainRequestSchema: z.ZodObject<{
    samples: z.ZodArray<z.ZodObject<{
        customerId: z.ZodString;
        features: z.ZodObject<{
            totalRevenue: z.ZodNumber;
            orderCount: z.ZodNumber;
            averageOrderValue: z.ZodNumber;
            daysActive: z.ZodNumber;
            retentionRate: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        }, {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        }>;
        actualLTV: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        features: {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        };
        customerId: string;
        actualLTV: number;
    }, {
        features: {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        };
        customerId: string;
        actualLTV: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    samples: {
        features: {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        };
        customerId: string;
        actualLTV: number;
    }[];
}, {
    samples: {
        features: {
            totalRevenue: number;
            orderCount: number;
            averageOrderValue: number;
            daysActive: number;
            retentionRate: number;
        };
        customerId: string;
        actualLTV: number;
    }[];
}>;
export declare const modelIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type LTVPredictionRequestInput = z.infer<typeof ltvPredictionRequestSchema>;
export type LTVTrainSampleInput = z.infer<typeof ltvTrainSampleSchema>;
export type LTVBatchTrainRequestInput = z.infer<typeof ltvBatchTrainRequestSchema>;
export type ModelIdInput = z.infer<typeof modelIdSchema>;
//# sourceMappingURL=validation.d.ts.map