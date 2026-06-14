import logger from './utils/logger';

import axios from 'axios';

export interface AggregatorOrder {
  aggregatorId: string;
  aggregatorOrderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderTime: Date;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export interface AggregatorMenu {
  aggregatorId: string;
  items: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    modifiers?: Array<{
      name: string;
      options: Array<{ name: string; price: number }>;
    }>;
  }>;
  lastSynced: Date;
}

export class AggregatorAdapter {
  protected aggregatorId: string;
  protected apiKey: string;
  protected storeId: string;

  constructor(aggregatorId: string, apiKey: string, storeId: string) {
    this.aggregatorId = aggregatorId;
    this.apiKey = apiKey;
    this.storeId = storeId;
  }

  async fetchNewOrders(): Promise<AggregatorOrder[]> {
    throw new Error(`${this.aggregatorId}: fetchNewOrders not implemented`);
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    throw new Error(`${this.aggregatorId}: updateOrderStatus not implemented`);
  }

  async pushMenu(menu: AggregatorMenu): Promise<void> {
    throw new Error(`${this.aggregatorId}: pushMenu not implemented`);
  }

  /**
   * Update item availability on the aggregator platform
   * @param itemId - Local item ID (will be mapped to aggregator item ID)
   * @param isAvailable - true = available, false = unavailable (sold out)
   * @param aggregatorItemId - Optional: direct aggregator item ID (skips mapping)
   */
  async updateItemAvailability(
    itemId: string,
    isAvailable: boolean,
    aggregatorItemId?: string
  ): Promise<void> {
    // Default implementation - override in subclasses
    logger.info(`[${this.aggregatorId}] Item ${itemId} availability: ${isAvailable}`);
    logger.info(`[${this.aggregatorId}] Aggregator item ID: ${aggregatorItemId || 'mapped from local'}`);
  }

  /**
   * Bulk update item availability
   * @param items - Array of {itemId, isAvailable} objects
   */
  async bulkUpdateAvailability(
    items: Array<{ itemId: string; isAvailable: boolean }>
  ): Promise<void> {
    for (const item of items) {
      await this.updateItemAvailability(item.itemId, item.isAvailable);
    }
  }
}

export class SwiggyAdapter extends AggregatorAdapter {
  private baseUrl = 'https://api.swiggy.com/partner/v1';

  async fetchNewOrders(): Promise<AggregatorOrder[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Store-Id': this.storeId
        },
        params: { status: 'pending' }
      });

      return (response.data.orders || []).map(this.transformOrder);
    } catch (error) {
      console.error('Failed to fetch Swiggy orders', error);
      return [];
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    const statusMap: Record<string, string> = {
      'accepted': 'ACCEPTED',
      'preparing': 'PREPARING',
      'ready': 'READY_FOR_PICKUP',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    };

    await axios.post(`${this.baseUrl}/orders/${externalOrderId}/status`, {
      status: statusMap[status] || status
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Store-Id': this.storeId
      }
    });
  }

  async pushMenu(menu: AggregatorMenu): Promise<void> {
    await axios.post(`${this.baseUrl}/menu`, {
      items: menu.items.map(item => ({
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.isAvailable
      }))
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Store-Id': this.storeId
      }
    });
  }

  private transformOrder(order): AggregatorOrder {
    return {
      aggregatorId: 'swiggy',
      aggregatorOrderId: order.id,
      customerName: order.customer?.name || 'Swiggy Customer',
      customerPhone: order.customer?.phone || '',
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.delivery_fee,
      total: order.total,
      status: 'pending',
      orderTime: new Date(order.created_at)
    };
  }
}

export class ZomatoAdapter extends AggregatorAdapter {
  private baseUrl = 'https://api.zomato.com/partner/v1';

  async fetchNewOrders(): Promise<AggregatorOrder[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Restaurant-Id': this.storeId
        },
        params: { order_status: 'received' }
      });

      return (response.data.orders || []).map(this.transformOrder);
    } catch (error) {
      console.error('Failed to fetch Zomato orders', error);
      return [];
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    const statusMap: Record<string, string> = {
      'accepted': 'CONFIRMED',
      'preparing': 'PREPARING',
      'ready': 'READY',
      'completed': 'DELIVERED',
      'cancelled': 'CANCELLED'
    };

    await axios.post(`${this.baseUrl}/orders/${externalOrderId}`, {
      status: statusMap[status] || status
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Restaurant-Id': this.storeId
      }
    });
  }

  async pushMenu(menu: AggregatorMenu): Promise<void> {
    await axios.post(`${this.baseUrl}/menu`, {
      dishes: menu.items.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.isAvailable ? '1' : '0'
      }))
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Restaurant-Id': this.storeId
      }
    });
  }

  private transformOrder(order): AggregatorOrder {
    return {
      aggregatorId: 'zomato',
      aggregatorOrderId: order.order_id,
      customerName: order.user?.name || 'Zomato Customer',
      customerPhone: order.user?.phone || '',
      items: order.items.map((item) => ({
        name: item.dish_name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: order.subtotal,
      tax: order.taxes,
      deliveryFee: order.delivery_charges,
      total: order.total,
      status: 'pending',
      orderTime: new Date(order.order_time)
    };
  }
}

export class ChannelManager {
  private aggregators: Map<string, AggregatorAdapter> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSyncScheduler();
  }

  registerAggregator(aggregatorId: string, adapter: AggregatorAdapter): void {
    this.aggregators.set(aggregatorId, adapter);
    logger.info(`Registered aggregator: ${aggregatorId}`);
  }

  async fetchAllNewOrders(): Promise<AggregatorOrder[]> {
    const allOrders: AggregatorOrder[] = [];

    for (const [aggregatorId, adapter] of this.aggregators) {
      try {
        const orders = await adapter.fetchNewOrders();
        allOrders.push(...orders);
      } catch (error) {
        logger.error(Failed to fetch orders from ${aggregatorId}`, error);
      }
    }

    return allOrders;
  }

  async updateOrderStatus(aggregatorId: string, externalOrderId: string, status: string): Promise<void> {
    const adapter = this.aggregators.get(aggregatorId);
    if (!adapter) {
      throw new Error(`Aggregator ${aggregatorId} not registered`);
    }

    await adapter.updateOrderStatus(externalOrderId, status);
  }

  async pushMenuToAll(menu: AggregatorMenu): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [aggregatorId, adapter] of this.aggregators) {
      promises.push(
        adapter.pushMenu(menu).catch(error => {
          logger.error(Failed to push menu to ${aggregatorId}`, error);
        })
      );
    }

    await Promise.all(promises);
  }

  async updateItemAvailability(aggregatorId: string, itemId: string, isAvailable: boolean): Promise<void> {
    const adapter = this.aggregators.get(aggregatorId);
    if (adapter) {
      await adapter.updateItemAvailability(itemId, isAvailable);
    }
  }

  private startSyncScheduler(): void {
    // Sync orders every minute
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncOrders();
      } catch (error) {
        console.error('Order sync failed', error);
      }
    }, 60000);
  }

  private async syncOrders(): Promise<void> {
    const orders = await this.fetchAllNewOrders();

    for (const order of orders) {
      // Create order in local system
      await this.createLocalOrder(order);
    }
  }

  private async createLocalOrder(order: AggregatorOrder): Promise<void> {
    // Call order service to create order
    try {
      await axios.post(`${process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com'}/api/orders/from-aggregator`, {
        aggregatorId: order.aggregatorId,
        aggregatorOrderId: order.aggregatorOrderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        total: order.total,
        orderTime: order.orderTime
      });
    } catch (error) {
      console.error('Failed to create local order', error);
    }
  }

  stopSyncScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Additional channel management methods

  async processOrder(order): Promise<void> {
    // Process order through channel
    console.log('Processing order through channel:', order.id);
    const adapter = this.aggregators.get(order.aggregatorId);
    if (adapter) {
      await adapter.updateOrderStatus(order.aggregatorOrderId, 'accepted');
    }
  }

  async syncInventory(product): Promise<void> {
    // Sync inventory across all channels
    console.log('Syncing inventory across channels:', product.id);
    const promises: Promise<void>[] = [];

    for (const [aggregatorId, adapter] of this.aggregators) {
      promises.push(
        adapter.updateItemAvailability(product.id, product.isAvailable).catch(error => {
          logger.error(Failed to sync inventory to ${aggregatorId}`, error);
        })
      );
    }

    await Promise.all(promises);
  }

  async getChannelStatus(channelId: string): Promise<{ connected: boolean; lastSync: Date }> {
    // Get channel status
    const adapter = this.aggregators.get(channelId);
    return {
      connected: !!adapter,
      lastSync: new Date()
    };
  }

  async webhookHandler(event): Promise<void> {
    // Handle webhook from channel
    console.log('Webhook received:', event.type, event.channel);

    switch (event.type) {
      case 'order.new':
        // New order from aggregator
        await this.createLocalOrder(event.data);
        break;
      case 'order.cancelled':
        // Order cancelled
        await this.updateOrderStatus(event.channel, event.data.orderId, 'cancelled');
        break;
      case 'inventory.update':
        // Inventory update from aggregator
        await this.syncInventory(event.data);
        break;
      default:
        console.log('Unhandled webhook type:', event.type);
    }
  }
}

export interface ChannelEvent {
  type: string;
  channel: string;
  data;
  timestamp: Date;
}

export interface Order {
  id: string;
  aggregatorId: string;
  aggregatorOrderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderTime: Date;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export interface Product {
  id: string;
  name: string;
  isAvailable: boolean;
  price: number;
  category?: string;
}

export interface ChannelStatus {
  connected: boolean;
  lastSync: Date;
}

export const channelManager = new ChannelManager();
