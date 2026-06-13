import { Basket, BasketItem, BasketStatus, BasketMetrics, Discount } from '../schemas/basket.schema';
import { BasketModel } from '../models/basket.model';
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

export class BasketService {
  private redisClient: Redis.RedisType | null = null;
  private baskets: Map<string, Basket> = new Map();
  private shopperBaskets: Map<string, string[]> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
      logger.info('Basket twin connected to Redis');
    }
  }

  async createBasket(data: { shopperId: string; storeId?: string; sessionId?: string; currency?: string }): Promise<Basket> {
    const existingActive = await this.getActiveBasketForShopper(data.shopperId);
    if (existingActive) {
      return existingActive;
    }

    const basket = BasketModel.createBasket(data);
    this.saveBasket(basket);
    this.addToShopperBaskets(data.shopperId, basket.id);
    logger.info(`Created basket: ${basket.id} for shopper: ${data.shopperId}`);
    return basket;
  }

  async getBasket(id: string): Promise<Basket | null> {
    const cached = await this.getFromCache(id);
    if (cached) return cached;
    return this.baskets.get(id) || null;
  }

  async getActiveBasketForShopper(shopperId: string): Promise<Basket | null> {
    const basketIds = this.shopperBaskets.get(shopperId) || [];
    for (const id of basketIds) {
      const basket = await this.getBasket(id);
      if (basket && basket.status === 'active') {
        return basket;
      }
    }
    return null;
  }

  async getShopperBaskets(shopperId: string, status?: BasketStatus): Promise<Basket[]> {
    const basketIds = this.shopperBaskets.get(shopperId) || [];
    const baskets: Basket[] = [];

    for (const id of basketIds) {
      const basket = await this.getBasket(id);
      if (basket && (!status || basket.status === status)) {
        baskets.push(basket);
      }
    }

    return baskets;
  }

  async addItem(basketId: string, item: Omit<BasketItem, 'id' | 'totalPrice'>): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;
    if (basket.status !== 'active') {
      throw new Error('Cannot modify non-active basket');
    }

    const updated = BasketModel.addItem(basket, item);
    this.saveBasket(updated);
    logger.info(`Added item to basket ${basketId}: ${item.productId}`);
    return updated;
  }

  async updateItemQuantity(basketId: string, productId: string, quantity: number): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;
    if (basket.status !== 'active') {
      throw new Error('Cannot modify non-active basket');
    }

    const updated = BasketModel.updateItemQuantity(basket, productId, quantity);
    this.saveBasket(updated);
    logger.info(`Updated item ${productId} quantity to ${quantity} in basket ${basketId}`);
    return updated;
  }

  async removeItem(basketId: string, productId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;
    if (basket.status !== 'active') {
      throw new Error('Cannot modify non-active basket');
    }

    const updated = BasketModel.removeItem(basket, productId);
    this.saveBasket(updated);
    logger.info(`Removed item ${productId} from basket ${basketId}`);
    return updated;
  }

  async applyItemDiscount(basketId: string, productId: string, discount: any): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.applyItemDiscount(basket, productId, discount);
    this.saveBasket(updated);
    return updated;
  }

  async applyBasketDiscount(basketId: string, discount: Omit<Discount, 'id' | 'appliedAt'>): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.applyBasketDiscount(basket, discount);
    this.saveBasket(updated);
    logger.info(`Applied discount ${discount.code || discount.type} to basket ${basketId}`);
    return updated;
  }

  async removeDiscount(basketId: string, discountId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.removeDiscount(basket, discountId);
    this.saveBasket(updated);
    return updated;
  }

  async saveBasket(basketId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.save(basket);
    this.saveBasket(updated);
    return updated;
  }

  async restoreBasket(basketId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.restore(basket);
    this.saveBasket(updated);
    return updated;
  }

  async abandonBasket(basketId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const updated = BasketModel.updateStatus(basket, 'abandoned');
    this.saveBasket(updated);
    logger.info(`Basket ${basketId} marked as abandoned`);
    return updated;
  }

  async convertBasket(basketId: string): Promise<Basket | null> {
    const basket = await this.getBasket(basketId);
    if (!basket) return null;

    const validation = BasketModel.validateBasket(basket);
    if (!validation.valid) {
      throw new Error(`Invalid basket: ${validation.errors.join(', ')}`);
    }

    const updated = BasketModel.updateStatus(basket, 'converted');
    this.saveBasket(updated);
    logger.info(`Basket ${basketId} converted to order`);
    return updated;
  }

  async deleteBasket(basketId: string): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (basket) {
      this.baskets.delete(basketId);
      await this.invalidateCache(basketId);

      const basketIds = this.shopperBaskets.get(basket.shopperId) || [];
      this.shopperBaskets.set(
        basket.shopperId,
        basketIds.filter(id => id !== basketId)
      );

      logger.info(`Deleted basket: ${basketId}`);
      return true;
    }
    return false;
  }

  async getMetrics(): Promise<BasketMetrics> {
    const allBaskets = Array.from(this.baskets.values());

    const totalBaskets = allBaskets.length;
    const activeBaskets = allBaskets.filter(b => b.status === 'active').length;
    const abandonedBaskets = allBaskets.filter(b => b.status === 'abandoned').length;
    const convertedBaskets = allBaskets.filter(b => b.status === 'converted').length;

    const activeBasketValues = allBaskets
      .filter(b => b.status === 'active')
      .map(b => b.total);

    const averageBasketValue = activeBasketValues.length > 0
      ? activeBasketValues.reduce((sum, val) => sum + val, 0) / activeBasketValues.length
      : 0;

    const allItemCounts = allBaskets.map(b => BasketModel.getItemCount(b));
    const averageItemsPerBasket = allItemCounts.length > 0
      ? allItemCounts.reduce((sum, count) => sum + count, 0) / allItemCounts.length
      : 0;

    const conversionRate = totalBaskets > 0 ? (convertedBaskets / totalBaskets) * 100 : 0;
    const abandonmentRate = totalBaskets > 0 ? (abandonedBaskets / totalBaskets) * 100 : 0;

    return {
      totalBaskets,
      activeBaskets,
      abandonedBaskets,
      convertedBaskets,
      averageBasketValue: Math.round(averageBasketValue * 100) / 100,
      averageItemsPerBasket: Math.round(averageItemsPerBasket * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      abandonmentRate: Math.round(abandonmentRate * 100) / 100,
    };
  }

  async getAbandonedBaskets(since?: Date): Promise<Basket[]> {
    const allBaskets = Array.from(this.baskets.values());
    return allBaskets.filter(b => {
      if (b.status !== 'abandoned') return false;
      if (since && b.abandonedAt) {
        return new Date(b.abandonedAt) >= since;
      }
      return true;
    });
  }

  private saveBasket(basket: Basket): void {
    this.baskets.set(basket.id, basket);
    this.setCache(basket.id, basket);
  }

  private addToShopperBaskets(shopperId: string, basketId: string): void {
    const existing = this.shopperBaskets.get(shopperId) || [];
    this.shopperBaskets.set(shopperId, [...existing, basketId]);
  }

  private async setCache(id: string, basket: Basket): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`basket:${id}`, 3600, JSON.stringify(basket));
    } catch (error) {
      logger.error(`Cache write error: ${error}`);
    }
  }

  private async getFromCache(id: string): Promise<Basket | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`basket:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache read error: ${error}`);
      return null;
    }
  }

  private async invalidateCache(id: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`basket:${id}`);
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