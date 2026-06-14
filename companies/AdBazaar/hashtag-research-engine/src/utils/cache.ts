interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();

  set(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instances
export const trendingCache = new InMemoryCache<unknown>();
export const searchCache = new InMemoryCache<unknown>();
export const hashtagDetailsCache = new InMemoryCache<unknown>();

// Cleanup every 5 minutes
setInterval(() => {
  trendingCache.cleanup();
  searchCache.cleanup();
  hashtagDetailsCache.cleanup();
}, 5 * 60 * 1000);

export default InMemoryCache;