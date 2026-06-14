/**
 * RisaCare Environment Validation
 * Validates required environment variables at startup
 */
import { z } from 'zod';
export declare const ServiceEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    PORT: z.ZodDefault<z.ZodString>;
    SERVICE_VERSION: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    SERVICE_VERSION: string;
    PORT: string;
    NODE_ENV: "development" | "staging" | "production";
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
}, {
    SERVICE_VERSION?: string | undefined;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "staging" | "production" | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
}>;
export declare const RezIntelligenceEnvSchema: z.ZodObject<{
    REZ_INTELLIGENCE_URL: z.ZodDefault<z.ZodString>;
    REZ_INTELLIGENCE_API_KEY: z.ZodString;
    HEALTH_EXPERT_URL: z.ZodDefault<z.ZodString>;
    MEMORY_LAYER_URL: z.ZodDefault<z.ZodString>;
    SIGNAL_AGGREGATOR_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    REZ_INTELLIGENCE_URL: string;
    REZ_INTELLIGENCE_API_KEY: string;
    HEALTH_EXPERT_URL: string;
    MEMORY_LAYER_URL: string;
    SIGNAL_AGGREGATOR_URL: string;
}, {
    REZ_INTELLIGENCE_API_KEY: string;
    REZ_INTELLIGENCE_URL?: string | undefined;
    HEALTH_EXPERT_URL?: string | undefined;
    MEMORY_LAYER_URL?: string | undefined;
    SIGNAL_AGGREGATOR_URL?: string | undefined;
}>;
export declare const RabtulEnvSchema: z.ZodObject<{
    AUTH_SERVICE_URL: z.ZodDefault<z.ZodString>;
    PAYMENT_SERVICE_URL: z.ZodDefault<z.ZodString>;
    WALLET_SERVICE_URL: z.ZodDefault<z.ZodString>;
    NOTIFICATION_SERVICE_URL: z.ZodDefault<z.ZodString>;
    BOOKING_SERVICE_URL: z.ZodDefault<z.ZodString>;
    PROFILE_SERVICE_URL: z.ZodDefault<z.ZodString>;
    INTERNAL_SERVICE_TOKEN: z.ZodString;
}, "strip", z.ZodTypeAny, {
    AUTH_SERVICE_URL: string;
    PAYMENT_SERVICE_URL: string;
    WALLET_SERVICE_URL: string;
    NOTIFICATION_SERVICE_URL: string;
    BOOKING_SERVICE_URL: string;
    PROFILE_SERVICE_URL: string;
    INTERNAL_SERVICE_TOKEN: string;
}, {
    INTERNAL_SERVICE_TOKEN: string;
    AUTH_SERVICE_URL?: string | undefined;
    PAYMENT_SERVICE_URL?: string | undefined;
    WALLET_SERVICE_URL?: string | undefined;
    NOTIFICATION_SERVICE_URL?: string | undefined;
    BOOKING_SERVICE_URL?: string | undefined;
    PROFILE_SERVICE_URL?: string | undefined;
}>;
export declare const DatabaseEnvSchema: z.ZodObject<{
    MONGODB_URI: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    MONGODB_URI: string;
}, {
    MONGODB_URI?: string | undefined;
}>;
export declare const SecurityEnvSchema: z.ZodObject<{
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    ENCRYPTION_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    JWT_SECRET?: string | undefined;
    ENCRYPTION_KEY?: string | undefined;
}, {
    JWT_SECRET?: string | undefined;
    ENCRYPTION_KEY?: string | undefined;
}>;
export interface EnvValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    env: Record<string, string>;
}
export declare function validateEnvironment(): EnvValidationResult;
export declare function getRequiredEnv(key: string): string;
export declare function getOptionalEnv(key: string, defaultValue: string): string;
export declare function isProduction(): boolean;
export declare function isDevelopment(): boolean;
export declare function initEnvironment(): void;
