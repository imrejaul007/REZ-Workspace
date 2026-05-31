"use strict";
/**
 * Redis Client Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../config"));
class RedisService {
    client = null;
    isConnected = false;
    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.client && this.isConnected) {
            return;
        }
        this.client = new ioredis_1.default({
            host: config_1.default.redis.host,
            port: config_1.default.redis.port,
            password: config_1.default.redis.password || undefined,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('Redis connection failed after 3 retries');
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });
        this.client.on('connect', () => {
            console.log('Redis connected');
            this.isConnected = true;
        });
        this.client.on('error', (err) => {
            console.error('Redis error:', err.message);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            console.log('Redis connection closed');
            this.isConnected = false;
        });
        try {
            await this.client.connect();
            this.isConnected = true;
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
        }
    }
    /**
     * Get Redis client
     */
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }
    /**
     * Check connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Build prefixed key
     */
    buildKey(entityId, featureName) {
        if (featureName) {
            return `${config_1.default.redis.keyPrefix}${entityId}:${featureName}`;
        }
        return `${config_1.default.redis.keyPrefix}${entityId}`;
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
    /**
     * Ping Redis to check health
     */
    async ping() {
        if (!this.client || !this.isConnected) {
            return false;
        }
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=redis.js.map