"use strict";
/**
 * Feature Store Configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const config = {
    port: parseInt(process.env.PORT || '4710', 10),
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        keyPrefix: 'hojai:features:',
    },
    featureStore: {
        ttl: parseInt(process.env.FEATURE_TTL || '86400', 10), // 24 hours default
        maxFeaturesPerEntity: parseInt(process.env.MAX_FEATURES_PER_ENTITY || '1000', 10),
        maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '100', 10),
    },
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token',
};
exports.default = config;
//# sourceMappingURL=index.js.map