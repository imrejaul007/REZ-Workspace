import { v4 as uuidv4 } from 'uuid';
import { Distributor, Order, Inventory, Retailer, OrderItem } from '../models/distribution';

class DistributionService {
  private distributors: Map<string, Distributor> = new Map();
  private orders: Map<string, Order> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private retailers: Map<string, Retailer> = new Map();

  // Distributor operations
  createDistributor(data: Omit<Distributor, 'id' | 'createdAt' | 'updatedAt'>): Distributor {
    const now = new Date().toISOString();
    const distributor: Distributor = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    this.distributors.set(distributor.id, distributor);
    return distributor;
  }

  getDistributor(id: string): Distributor | undefined {
    return this.distributors.get(id);
  }

  getDistributorByCode(code: string): Distributor | undefined {
    return Array.from(this.distributors.values()).find(d => d.code === code);
  }

  getAllDistributors(filters?: { status?: string; type?: string }): Distributor[] {
    let result = Array.from(this.distributors.values());
    if (filters?.status) {
      result = result.filter(d => d.status === filters.status);
    }
    if (filters?.type) {
      result = result.filter(d => d.type === filters.type);
    }
    return result;
  }

  updateDistributor(id: string, data: Partial<Distributor>): Distributor | undefined {
    const distributor = this.distributors.get(id);
    if (!distributor) return undefined;
    const updated = { ...distributor, ...data, updatedAt: new Date().toISOString() };
    this.distributors.set(id, updated);
    return updated;
  }

  deleteDistributor(id: string): boolean {
    return this.distributors.delete(id);
  }

  // Order operations
  createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const order: Order = {
      ...data,
      id: uuidv4(),
      orderNumber,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(order.id, order);
    return order;
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber);
  }

  getOrdersByDistributor(distributorId: string): Order[] {
    return Array.from(this.orders.values()).filter(o => o.distributorId === distributorId);
  }

  updateOrderStatus(id: string, status: Order['status']): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status, updatedAt: new Date().toISOString() };
    this.orders.set(id, updated);
    return updated;
  }

  // Inventory operations
  addInventory(data: Omit<Inventory, 'id'>): Inventory {
    const inventory: Inventory = { ...data, id: uuidv4() };
    this.inventory.set(inventory.id, inventory);
    return inventory;
  }

  getInventory(distributorId: string): Inventory[] {
    return Array.from(this.inventory.values()).filter(i => i.distributorId === distributorId);
  }

  getInventoryItem(id: string): Inventory | undefined {
    return this.inventory.get(id);
  }

  updateInventory(id: string, quantity: number): Inventory | undefined {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    const updated = { ...item, quantity, availableQuantity: quantity - item.reservedQuantity };
    this.inventory.set(id, updated);
    return updated;
  }

  reserveInventory(id: string, amount: number): boolean {
    const item = this.inventory.get(id);
    if (!item || item.availableQuantity < amount) return false;
    item.reservedQuantity += amount;
    item.availableQuantity -= amount;
    this.inventory.set(id, item);
    return true;
  }

  // Retailer operations
  createRetailer(data: Omit<Retailer, 'id' | 'createdAt'>): Retailer {
    const retailer: Retailer = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    this.retailers.set(retailer.id, retailer);
    return retailer;
  }

  getRetailer(id: string): Retailer | undefined {
    return this.retailers.get(id);
  }

  getRetailersByDistributor(distributorId: string): Retailer[] {
    return Array.from(this.retailers.values()).filter(r => r.distributorId === distributorId);
  }

  // Stats
  getStats() {
    return {
      totalDistributors: this.distributors.size,
      activeDistributors: Array.from(this.distributors.values()).filter(d => d.status === 'active').length,
      totalOrders: this.orders.size,
      pendingOrders: Array.from(this.orders.values()).filter(o => o.status === 'pending').length,
      totalRetailers: this.retailers.size,
      inventoryItems: this.inventory.size
    };
  }
}

export default new DistributionService();
