"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBusService = exports.EventBusService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
class EventBusService {
    redis;
    subscribers = new Map();
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
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
            await axios_1.default.post(`${rezUrl}/api/events`, event, {
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
exports.EventBusService = EventBusService;
exports.eventBusService = new EventBusService();
//# sourceMappingURL=eventService.js.map