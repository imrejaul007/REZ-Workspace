import { Injectable } from '@nestjs/common';

interface MockRedis {
  data: Map<string, string>;
  hashes: Map<string, Map<string, string>>;
  sets: Map<string, Set<string>>;
  expirations: Map<string, number>;
  counters: Map<string, number>;
  subscribers: Map<string, Array<(message: string) => void>>;
}

@Injectable()
export class MockRedisService {
  private storage: MockRedis = {
    data: new Map<string, string>(),
    hashes: new Map<string, Map<string, string>>(),
    sets: new Map<string, Set<string>>(),
    expirations: new Map<string, number>(),
    counters: new Map<string, number>(),
    subscribers: new Map<string, Array<(message: string) => void>>(),
  };

  constructor() {
    // Clean up expired keys periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.storage.expirations.entries()) {
        if (now > expiry) {
          this.storage.data.delete(key);
          this.storage.hashes.delete(key);
          this.storage.sets.delete(key);
          this.storage.counters.delete(key);
          this.storage.expirations.delete(key);
        }
      }
    }, 60000); // Check every minute
  }

  async get(key: string): Promise<string | null> {
    this.checkExpiry(key);
    return this.storage.data.get(key) || null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.storage.data.set(key, value);
    if (ttl) {
      this.storage.expirations.set(key, Date.now() + ttl * 1000);
    } else {
      this.storage.expirations.delete(key);
    }
  }

  async del(key: string): Promise<void> {
    this.storage.data.delete(key);
    this.storage.hashes.delete(key);
    this.storage.sets.delete(key);
    this.storage.counters.delete(key);
    this.storage.expirations.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    this.checkExpiry(key);
    return this.storage.data.has(key) || 
           this.storage.hashes.has(key) || 
           this.storage.sets.has(key) ||
           this.storage.counters.has(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (await this.exists(key)) {
      this.storage.expirations.set(key, Date.now() + ttl * 1000);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    this.checkExpiry(key);
    const hash = this.storage.hashes.get(key);
    return hash?.get(field) || null;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.storage.hashes.has(key)) {
      this.storage.hashes.set(key, new Map<string, string>());
    }
    this.storage.hashes.get(key)!.set(field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.checkExpiry(key);
    const hash = this.storage.hashes.get(key);
    if (!hash) return {};
    
    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    return result;
  }

  async hdel(key: string, field: string): Promise<void> {
    const hash = this.storage.hashes.get(key);
    if (hash) {
      hash.delete(field);
      if (hash.size === 0) {
        this.storage.hashes.delete(key);
      }
    }
  }

  async sadd(key: string, member: string): Promise<void> {
    if (!this.storage.sets.has(key)) {
      this.storage.sets.set(key, new Set<string>());
    }
    this.storage.sets.get(key)!.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    const set = this.storage.sets.get(key);
    if (set) {
      set.delete(member);
      if (set.size === 0) {
        this.storage.sets.delete(key);
      }
    }
  }

  async smembers(key: string): Promise<string[]> {
    this.checkExpiry(key);
    const set = this.storage.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async sismember(key: string, member: string): Promise<boolean> {
    this.checkExpiry(key);
    const set = this.storage.sets.get(key);
    return set?.has(member) || false;
  }

  async incr(key: string): Promise<number> {
    const current = this.storage.counters.get(key) || 0;
    const newValue = current + 1;
    this.storage.counters.set(key, newValue);
    return newValue;
  }

  async decr(key: string): Promise<number> {
    const current = this.storage.counters.get(key) || 0;
    const newValue = current - 1;
    this.storage.counters.set(key, newValue);
    return newValue;
  }

  async publish(channel: string, message: string): Promise<void> {
    const callbacks = this.storage.subscribers.get(channel);
    if (callbacks) {
      // Execute callbacks asynchronously to mimic Redis behavior
      setImmediate(() => {
        callbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error(`Error in Redis subscriber callback for channel ${channel}:`, error);
          }
        });
      });
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.storage.subscribers.has(channel)) {
      this.storage.subscribers.set(channel, []);
    }
    this.storage.subscribers.get(channel)!.push(callback);
  }

  async unsubscribe(channel: string): Promise<void> {
    this.storage.subscribers.delete(channel);
  }

  async flushall(): Promise<void> {
    this.storage.data.clear();
    this.storage.hashes.clear();
    this.storage.sets.clear();
    this.storage.counters.clear();
    this.storage.expirations.clear();
    this.storage.subscribers.clear();
  }

  getClient(): unknown {
    // Return a mock client that has the same interface
    return this;
  }

  getSubscriber(): unknown {
    // Return a mock subscriber that has the same interface
    return this;
  }

  private checkExpiry(key: string): void {
    const expiry = this.storage.expirations.get(key);
    if (expiry && Date.now() > expiry) {
      this.storage.data.delete(key);
      this.storage.hashes.delete(key);
      this.storage.sets.delete(key);
      this.storage.counters.delete(key);
      this.storage.expirations.delete(key);
    }
  }
}