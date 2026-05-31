/**
 * Hojai Model Registry Validators (Zod Schemas)
 */
import { z } from 'zod';
export declare const registerModelSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    stage: z.ZodDefault<z.ZodEnum<["dev", "staging", "production"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    stage: "dev" | "staging" | "production";
    description?: string | undefined;
    metrics?: Record<string, number> | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name: string;
    version: string;
    description?: string | undefined;
    metrics?: Record<string, number> | undefined;
    stage?: "dev" | "staging" | "production" | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const updateStageSchema: z.ZodObject<{
    stage: z.ZodEnum<["dev", "staging", "production"]>;
}, "strip", z.ZodTypeAny, {
    stage: "dev" | "staging" | "production";
}, {
    stage: "dev" | "staging" | "production";
}>;
export declare const modelNameParamSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const versionParamSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
}, {
    name: string;
    version: string;
}>;
export type RegisterModelInput = z.infer<typeof registerModelSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ModelNameParam = z.infer<typeof modelNameParamSchema>;
export type VersionParam = z.infer<typeof versionParamSchema>;
//# sourceMappingURL=index.d.ts.map