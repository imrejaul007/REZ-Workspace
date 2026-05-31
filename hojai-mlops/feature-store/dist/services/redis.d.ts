/**
 * Redis Client Service
 */
import Redis from 'ioredis';
declare class RedisService {
    private client;
    private isConnected;
    /**
     * Initialize Redis connection
     */
    connect(): Promise<void>;
    /**
     * Get Redis client
     */
    getClient(): Redis;
    /**
     * Check connection status
     */
    getConnectionStatus(): boolean;
    /**
     * Build prefixed key
     */
    buildKey(entityId: string, featureName?: string): string;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Ping Redis to check health
     */
    ping(): Promise<boolean>;
}
export declare const redisService: RedisService;
export {};
//# sourceMappingURL=redis.d.ts.map