"use strict";
/**
 * RisaCare Environment Validation
 * Validates required environment variables at startup
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEnvSchema = exports.DatabaseEnvSchema = exports.RabtulEnvSchema = exports.RezIntelligenceEnvSchema = exports.ServiceEnvSchema = void 0;
exports.validateEnvironment = validateEnvironment;
exports.getRequiredEnv = getRequiredEnv;
exports.getOptionalEnv = getOptionalEnv;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.initEnvironment = initEnvironment;
const zod_1 = require("zod");
// ============================================
// SCHEMAS
// ============================================
exports.ServiceEnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production']).default('development'),
    PORT: zod_1.z.string().default('4700'),
    SERVICE_VERSION: zod_1.z.string().default('1.0.0'),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
exports.RezIntelligenceEnvSchema = zod_1.z.object({
    REZ_INTELLIGENCE_URL: zod_1.z.string().url().default('http://localhost:4018'),
    REZ_INTELLIGENCE_API_KEY: zod_1.z.string().min(1),
    HEALTH_EXPERT_URL: zod_1.z.string().url().default('http://localhost:3011'),
    MEMORY_LAYER_URL: zod_1.z.string().url().default('http://localhost:4201'),
    SIGNAL_AGGREGATOR_URL: zod_1.z.string().url().default('http://localhost:4142'),
});
exports.RabtulEnvSchema = zod_1.z.object({
    AUTH_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4002'),
    PAYMENT_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4001'),
    WALLET_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4004'),
    NOTIFICATION_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4011'),
    BOOKING_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4020'),
    PROFILE_SERVICE_URL: zod_1.z.string().url().default('http://localhost:4013'),
    INTERNAL_SERVICE_TOKEN: zod_1.z.string().min(1),
});
exports.DatabaseEnvSchema = zod_1.z.object({
    MONGODB_URI: zod_1.z.string().url().default('mongodb://localhost:27017/risa_care'),
});
exports.SecurityEnvSchema = zod_1.z.object({
    JWT_SECRET: zod_1.z.string().min(32).optional(),
    ENCRYPTION_KEY: zod_1.z.string().min(32).optional(),
});
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    const env = {};
    // Validate Service env
    try {
        const serviceEnv = exports.ServiceEnvSchema.parse({
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            SERVICE_VERSION: process.env.SERVICE_VERSION,
            LOG_LEVEL: process.env.LOG_LEVEL,
        });
        Object.assign(env, serviceEnv);
    }
    catch (e) {
        errors.push(`Service env: ${e.message}`);
    }
    // Validate REZ Intelligence env
    try {
        const rezEnv = exports.RezIntelligenceEnvSchema.parse({
            REZ_INTELLIGENCE_URL: process.env.REZ_INTELLIGENCE_URL,
            REZ_INTELLIGENCE_API_KEY: process.env.REZ_INTELLIGENCE_API_KEY,
            HEALTH_EXPERT_URL: process.env.HEALTH_EXPERT_URL,
            MEMORY_LAYER_URL: process.env.MEMORY_LAYER_URL,
            SIGNAL_AGGREGATOR_URL: process.env.SIGNAL_AGGREGATOR_URL,
        });
        Object.assign(env, rezEnv);
    }
    catch (e) {
        errors.push(`REZ Intelligence env: ${e.message}`);
    }
    // Validate RABTUL env
    try {
        const rabtulEnv = exports.RabtulEnvSchema.parse({
            AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
            PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
            WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL,
            NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL,
            BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL,
            PROFILE_SERVICE_URL: process.env.PROFILE_SERVICE_URL,
            INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
        });
        Object.assign(env, rabtulEnv);
    }
    catch (e) {
        errors.push(`RABTUL env: ${e.message}`);
    }
    // Validate Database env
    try {
        const dbEnv = exports.DatabaseEnvSchema.parse({
            MONGODB_URI: process.env.MONGODB_URI,
        });
        Object.assign(env, dbEnv);
    }
    catch (e) {
        errors.push(`Database env: ${e.message}`);
    }
    // Warnings for production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.JWT_SECRET) {
            warnings.push('JWT_SECRET not set in production');
        }
        if (!process.env.ENCRYPTION_KEY) {
            warnings.push('ENCRYPTION_KEY not set in production');
        }
        if (!process.env.SENTRY_DSN) {
            warnings.push('SENTRY_DSN not set - error tracking disabled');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        env,
    };
}
// ============================================
// HELPERS
// ============================================
function getRequiredEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}
function getOptionalEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}
// ============================================
// INIT FUNCTION
// ============================================
function initEnvironment() {
    const result = validateEnvironment();
    if (!result.valid) {
        console.error('❌ Environment validation failed:');
        result.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }
    if (result.warnings.length > 0) {
        console.warn('⚠️  Environment warnings:');
        result.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    console.log('✅ Environment validated successfully');
}
//# sourceMappingURL=env.js.map