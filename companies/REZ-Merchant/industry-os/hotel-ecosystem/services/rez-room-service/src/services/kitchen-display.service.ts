import { v4 as uuidv4 } from 'uuid';
import { RoomServiceOrder } from './orders.service';

export interface KitchenOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'cooking' | 'ready';
  station?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface KitchenStation {
  stationId: string;
  name: string;
  type: string;
  orders: KitchenOrderItem[];
  avgCompletionTime: number;
  isActive: boolean;
}

export interface KitchenOrder {
  orderId: string;
  roomNumber: string;
  guestName: string;
  items: KitchenOrderItem[];
  priority: 'normal' | 'rush';
  status: 'new' | 'in_progress' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedReadyTime?: Date;
}

export class KitchenDisplayService {
  private kitchenOrders: Map<string, KitchenOrder> = new Map();
  private stations: Map<string, KitchenStation> = new Map();

  constructor() {
    this.initializeStations();
  }

  private initializeStations() {
    const stationConfigs = [
      { stationId: 'grill-1', name: 'Grill Station', type: 'grill' },
      { stationId: 'saute-1', name: 'Sauté Station', type: 'saute' },
      { stationId: 'fry-1', name: 'Fry Station', type: 'fry' },
      { stationId: 'cold-1', name: 'Cold Kitchen', type: 'cold' },
      { stationId: 'dessert-1', name: 'Dessert Station', type: 'dessert' },
      { stationId: 'beverage-1', name: 'Beverage Bar', type: 'beverage' },
    ];

    stationConfigs.forEach(config => {
      this.stations.set(config.stationId, {
        ...config,
        orders: [],
        avgCompletionTime: 15,
        isActive: true,
      });
    });
  }

  async createKitchenOrder(order: RoomServiceOrder): Promise<KitchenOrder> {
    const kitchenItems: KitchenOrderItem[] = order.items.map(item => ({
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      status: 'pending',
      station: this.assignStation(item.itemId),
    }));

    const kitchenOrder: KitchenOrder = {
      orderId: `K-${order.orderId}`,
      roomNumber: order.roomNumber,
      guestName: order.guestName,
      items: kitchenItems,
      priority: order.dietaryFlags?.includes('rush') ? 'rush' : 'normal',
      status: 'new',
      createdAt: new Date(),
      estimatedReadyTime: order.estimatedDelivery,
    };

    this.kitchenOrders.set(kitchenOrder.orderId, kitchenOrder);

    // Assign items to stations
    kitchenItems.forEach(item => {
      if (item.station) {
        const station = this.stations.get(item.station);
        if (station) {
          station.orders.push(item);
        }
      }
    });

    return kitchenOrder;
  }

  async getStationOrders(hotelId: string, stationId?: string): Promise<{
    stations: KitchenStation[];
    totalOrders: number;
  }> {
    if (stationId) {
      const station = this.stations.get(stationId);
      return {
        stations: station ? [{ ...station }] : [],
        totalOrders: station?.orders.length || 0,
      };
    }

    return {
      stations: Array.from(this.stations.values()),
      totalOrders: Array.from(this.stations.values()).reduce((sum, s) => sum + s.orders.length, 0),
    };
  }

  async startCooking(orderId: string, stationId: string): Promise<KitchenOrder> {
    const order = this.kitchenOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    const station = this.stations.get(stationId);
    if (!station) throw new Error('Station not found');

    // Update items for this station
    order.items.forEach(item => {
      if (item.station === stationId) {
        item.status = 'cooking';
        item.startedAt = new Date();
      }
    });

    if (!order.startedAt) {
      order.startedAt = new Date();
    }
    order.status = 'in_progress';

    this.kitchenOrders.set(orderId, order);
    return order;
  }

  async completeCooking(orderId: string): Promise<KitchenOrder> {
    const order = this.kitchenOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    // Complete all items
    order.items.forEach(item => {
      if (item.status === 'cooking') {
        item.status = 'ready';
        item.completedAt = new Date();

        // Remove from station
        if (item.station) {
          const station = this.stations.get(item.station);
          if (station) {
            station.orders = station.orders.filter(i => i.itemId !== item.itemId);
          }
        }
      }
    });

    // Check if all items are ready
    const allReady = order.items.every(item => item.status === 'ready');
    if (allReady) {
      order.status = 'completed';
      order.completedAt = new Date();
    }

    this.kitchenOrders.set(orderId, order);
    return order;
  }

  async bumpOrder(orderId: string): Promise<KitchenOrder> {
    return this.completeCooking(orderId);
  }

  async recallOrder(orderId: string): Promise<KitchenOrder> {
    const order = this.kitchenOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'in_progress';
    order.items.forEach(item => {
      if (item.status === 'ready') {
        item.status = 'cooking';
        item.completedAt = undefined;

        // Re-add to station
        if (item.station) {
          const station = this.stations.get(item.station);
          if (station) {
            station.orders.push(item);
          }
        }
      }
    });

    this.kitchenOrders.set(orderId, order);
    return order;
  }

  async getActiveOrders(hotelId: string): Promise<KitchenOrder[]> {
    return Array.from(this.kitchenOrders.values()).filter(
      o => o.status !== 'completed'
    );
  }

  async getOrderHistory(hotelId: string, limit: number = 50): Promise<KitchenOrder[]> {
    return Array.from(this.kitchenOrders.values())
      .filter(o => o.status === 'completed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getStationStats(stationId: string): Promise<{
    pending: number;
    inProgress: number;
    avgCompletionTime: number;
    efficiency: number;
  }> {
    const station = this.stations.get(stationId);
    if (!station) throw new Error('Station not found');

    const pending = station.orders.filter(o => o.status === 'pending').length;
    const inProgress = station.orders.filter(o => o.status === 'cooking').length;

    return {
      pending,
      inProgress,
      avgCompletionTime: station.avgCompletionTime,
      efficiency: Math.min(100, ((station.capacity - pending) / station.capacity) * 100),
    };
  }

  private assignStation(itemId: string): string {
    // Simple station assignment based on item type
    if (itemId.includes('BEV')) return 'beverage-1';
    if (itemId.includes('DSR')) return 'dessert-1';
    if (itemId.includes('FRY')) return 'fry-1';
    return 'main-1';
  }
}
