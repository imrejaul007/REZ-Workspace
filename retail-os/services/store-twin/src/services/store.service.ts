import { Store } from '../schemas/store.schema';
import { StoreModel } from '../models/store.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export class StoreService {
  private redisClient: Redis.RedisType | null = null;
  private stores: Map<string, Store> = new Map();
  private storesByCode: Map<string, string> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
      logger.info('Store twin connected to Redis');
    }
  }

  async createStore(data: any): Promise<Store> {
    const existingStore = this.storesByCode.get(data.storeCode);
    if (existingStore) {
      throw new Error(`Store with code ${data.storeCode} already exists`);
    }

    const store = StoreModel.createStore(data);
    this.stores.set(store.id, store);
    this.storesByCode.set(store.storeCode, store.id);
    await this.saveToCache(store);

    logger.info(`Created store: ${store.id} (${store.storeCode})`);
    return store;
  }

  async getStore(id: string): Promise<Store | null> {
    const cached = await this.getFromCache(id);
    if (cached) return cached;

    const store = this.stores.get(id);
    if (store) {
      await this.saveToCache(store);
      return store;
    }
    return null;
  }

  async getStoreByCode(storeCode: string): Promise<Store | null> {
    const id = this.storesByCode.get(storeCode);
    if (!id) return null;
    return this.getStore(id);
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
    const store = await this.getStore(id);
    if (!store) return null;

    const updated = StoreModel.updateStore(store, updates);
    this.stores.set(id, updated);
    await this.invalidateCache(id);
    logger.info(`Updated store: ${id}`);
    return updated;
  }

  async deleteStore(id: string): Promise<boolean> {
    const store = this.stores.get(id);
    if (store) {
      this.storesByCode.delete(store.storeCode);
      this.stores.delete(id);
      await this.invalidateCache(id);
      logger.info(`Deleted store: ${id}`);
      return true;
    }
    return false;
  }

  async listStores(filter?: { type?: string; status?: string; city?: string }): Promise<Store[]> {
    let stores = Array.from(this.stores.values());

    if (filter?.type) {
      stores = stores.filter(s => s.type === filter.type);
    }
    if (filter?.status) {
      stores = stores.filter(s => s.status === filter.status);
    }
    if (filter?.city) {
      stores = stores.filter(s => s.address.city.toLowerCase() === filter.city?.toLowerCase());
    }

    return stores;
  }

  async addDepartment(storeId: string, department: any): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.addDepartment(store, department);
    this.stores.set(storeId, updated);
    await this.invalidateCache(storeId);
    logger.info(`Added department ${department.name} to store ${storeId}`);
    return updated;
  }

  async updateDepartmentMetrics(storeId: string, departmentId: string, salesDelta: number): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.updateDepartmentMetrics(store, departmentId, salesDelta);
    this.stores.set(storeId, updated);
    await this.invalidateCache(storeId);
    return updated;
  }

  async updateCustomerCount(storeId: string, count: number): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.updateCustomerCount(store, count);
    this.stores.set(storeId, updated);
    await this.saveToCache(updated);
    return updated;
  }

  async updateActiveCheckouts(storeId: string, count: number): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.updateActiveCheckouts(store, count);
    this.stores.set(storeId, updated);
    await this.saveToCache(updated);
    return updated;
  }

  async updateStaff(storeId: string, role: string, count: number): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.updateStaffCount(store, role, count);
    this.stores.set(storeId, updated);
    await this.invalidateCache(storeId);
    return updated;
  }

  async closeStore(storeId: string, temporary: boolean = true): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.closeStore(store, temporary);
    this.stores.set(storeId, updated);
    await this.invalidateCache(storeId);
    logger.info(`Store ${storeId} closed (temporary: ${temporary})`);
    return updated;
  }

  async reopenStore(storeId: string): Promise<Store | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    const updated = StoreModel.reopenStore(store);
    this.stores.set(storeId, updated);
    await this.invalidateCache(storeId);
    logger.info(`Store ${storeId} reopened`);
    return updated;
  }

  async getStoreMetrics(storeId: string): Promise<any | null> {
    const store = await this.getStore(storeId);
    if (!store) return null;

    return StoreModel.getStoreMetrics(store);
  }

  async getNearbyStores(latitude: number, longitude: number, radiusKm: number): Promise<Store[]> {
    const allStores = Array.from(this.stores.values()).filter(s => s.status === 'active');

    return allStores.filter(store => {
      if (!store.coordinates || store.coordinates.latitude === 0) return false;
      const distance = this.calculateDistance(
        latitude, longitude,
        store.coordinates.latitude, store.coordinates.longitude
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async saveToCache(store: Store): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`store:${store.id}`, 3600, JSON.stringify(store));
      await this.redisClient.setEx(`store:code:${store.storeCode}`, 3600, store.id);
    } catch (error) {
      logger.error(`Cache write error: ${error}`);
    }
  }

  private async getFromCache(id: string): Promise<Store | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`store:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache read error: ${error}`);
      return null;
    }
  }

  private async invalidateCache(id: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`store:${id}`);
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
