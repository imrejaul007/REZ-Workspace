import logger from './utils/logger';

/**
 * Aggregator Hub Service
 * Unified Swiggy, Zomato, Magicpin integration
 */

import axios from 'axios';

export interface AggregatorOrder {
  aggregator: 'swiggy' | 'zomato' | 'magicpin';
  aggregatorOrderId: string;
  storeId: string;
  items: { id: string; name: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered';
  customer: { name: string; phone: string; address?: string };
  createdAt: Date;
}

export class AggregatorHub {
  private swiggy;
  private zomato;
  private magicpin;

  constructor() {
    this.swiggy = new SwiggyAdapter();
    this.zomato = new ZomatoAdapter();
    this.magicpin = new MagicpinAdapter();
  }

  /**
   * Fetch orders from all aggregators
   */
  async fetchAllOrders(storeId: string): Promise<AggregatorOrder[]> {
    const [swiggy, zomato, magicpin] = await Promise.allSettled([
      this.swiggy.getOrders(storeId),
      this.zomato.getOrders(storeId),
      this.magicpin.getOrders(storeId)
    ]);

    const orders: AggregatorOrder[] = [];

    if (swiggy.status === 'fulfilled') orders.push(...swiggy.value);
    if (zomato.status === 'fulfilled') orders.push(...zomato.value);
    if (magicpin.status === 'fulfilled') orders.push(...magicpin.value);

    return orders;
  }

  /**
   * Push menu to all aggregators
   */
  async syncMenu(storeId: string, menu: unknown[]): Promise<void> {
    await Promise.allSettled([
      this.swiggy.updateMenu(storeId, menu),
      this.zomato.updateMenu(storeId, menu),
      this.magicpin.updateMenu(storeId, menu)
    ]);
  }

  /**
   * Update order status
   */
  async updateStatus(
    aggregator: string,
    orderId: string,
    status: string
  ): Promise<void> {
    switch (aggregator) {
      case 'swiggy': return this.swiggy.updateStatus(orderId, status);
      case 'zomato': return this.zomato.updateStatus(orderId, status);
      case 'magicpin': return this.magicpin.updateStatus(orderId, status);
    }
  }
}

class SwiggyAdapter {
  async getOrders(storeId: string): Promise<AggregatorOrder[]> {
    // In production: call Swiggy API
    console.log('Fetching Swiggy orders for', storeId);
    return [];
  }

  async updateMenu(storeId: string, menu: unknown[]): Promise<void> {
    logger.info('Updating Swiggy menu');
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    console.log('Updating Swiggy order', orderId, status);
  }
}

class ZomatoAdapter {
  async getOrders(storeId: string): Promise<AggregatorOrder[]> {
    logger.info('Fetching Zomato orders');
    return [];
  }

  async updateMenu(storeId: string, menu: unknown[]): Promise<void> {
    logger.info('Updating Zomato menu');
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    console.log('Updating Zomato order', orderId, status);
  }
}

class MagicpinAdapter {
  async getOrders(storeId: string): Promise<AggregatorOrder[]> {
    logger.info('Fetching Magicpin orders');
    return [];
  }

  async updateMenu(storeId: string, menu: unknown[]): Promise<void> {
    logger.info('Updating Magicpin menu');
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    console.log('Updating Magicpin order', orderId, status);
  }
}

export const aggregatorHub = new AggregatorHub();
