import { createClient } from 'redis';
export class SessionService {
    client = null;
    connected = false;
    constructor() {
        this.connect();
    }
    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = createClient({ url: redisUrl });
            this.client.on('error', (err) => {
                console.error('[Redis] Error:', err);
                this.connected = false;
            });
            this.client.on('connect', () => {
                console.log('[Redis] Connected');
                this.connected = true;
            });
            await this.client.connect();
        }
        catch (error) {
            console.error('[Redis] Connection failed:', error);
            this.connected = false;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.connected || !this.client) {
            console.warn('[Redis] Not connected, skipping set');
            return;
        }
        try {
            const data = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, data);
            }
            else {
                await this.client.set(key, data);
            }
        }
        catch (error) {
            console.error('[Redis] Set error:', error);
        }
    }
    async get(key) {
        if (!this.connected || !this.client) {
            return null;
        }
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            console.error('[Redis] Get error:', error);
            return null;
        }
    }
    async delete(key) {
        if (!this.connected || !this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error('[Redis] Delete error:', error);
        }
    }
    async exists(key) {
        if (!this.connected || !this.client)
            return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('[Redis] Exists error:', error);
            return false;
        }
    }
    async increment(key) {
        if (!this.connected || !this.client)
            return 0;
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error('[Redis] Increment error:', error);
            return 0;
        }
    }
    isConnected() {
        return this.connected;
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
        }
    }
}
export const sessionService = new SessionService();
//# sourceMappingURL=SessionService.js.map