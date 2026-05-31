/**
 * Feature Store Validators using Zod
 */
import { z } from 'zod';
/**
 * Store features request schema
 */
export declare const storeFeaturesSchema: z.ZodObject<{
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        name: string;
    }, {
        value: string | number | boolean;
        name: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    features: {
        value: string | number | boolean;
        name: string;
    }[];
}, {
    features: {
        value: string | number | boolean;
        name: string;
    }[];
}>;
/**
 * Batch get request schema
 */
export declare const batchGetSchema: z.ZodObject<{
    entity_ids: z.ZodArray<z.ZodString, "many">;
    feature_names: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    entity_ids: string[];
    feature_names?: string[] | undefined;
}, {
    entity_ids: string[];
    feature_names?: string[] | undefined;
}>;
/**
 * Entity ID parameter schema
 */
export declare const entityIdSchema: z.ZodString;
/**
 * Feature name parameter schema
 */
export declare const featureNameSchema: z.ZodString;
/**
 * Infer types from schemas
 */
export type StoreFeaturesInput = z.infer<typeof storeFeaturesSchema>;
export type BatchGetInput = z.infer<typeof batchGetSchema>;
//# sourceMappingURL=index.d.ts.map