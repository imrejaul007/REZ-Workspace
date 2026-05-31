import Redis from 'ioredis';
import axios from 'axios';
export class EventBusService {
    redis;
    subscribers = new Map();
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        this.subscribe('__keyevent@0__:hojai_events', (message) => {
            try {
                const event = JSON.parse(message);
                this.notifySubscribers(event.type, event);
            }
            catch { }
        });
    }
    async publish(event) {
        const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const enriched = {
            id,
            ...event,
            timestamp: event.timestamp || new Date().toISOString()
        };
        await this.redis.publish('hojai_events', JSON.stringify(enriched));
        await this.redis.lpush('hojai_events_history', JSON.stringify(enriched));
        await this.redis.ltrim('hojai_events_history', 0, 9999);
        return { id };
    }
    async subscribe(eventType, handler) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(handler);
    }
    async forwardToRez(event) {
        const rezUrl = process.env.REZ_EVENT_BUS_URL;
        if (!rezUrl)
            return;
        try {
            await axios.post(`${rezUrl}/api/events`, event, {
                headers: {
                    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
                }
            });
        }
        catch (e) {
            console.error('[EventBus] Forward failed:', e);
        }
    }
    async notifySubscribers(eventType, event) {
        this.subscribers.get(eventType)?.forEach(handler => handler(event));
        this.subscribers.get('*')?.forEach(handler => handler(event));
    }
    async getHistory(limit = 100) {
        const events = await this.redis.lrange('hojai_events_history', 0, limit - 1);
        return events.map(e => JSON.parse(e)).reverse();
    }
}
export const eventBusService = new EventBusService();
//# sourceMappingURL=eventService.js.map