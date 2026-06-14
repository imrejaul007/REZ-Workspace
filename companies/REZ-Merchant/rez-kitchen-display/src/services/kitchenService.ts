import { v4 as uuidv4 } from 'uuid';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { KitchenOrder, CreateOrderRequest, OrderStatus, TimerEvent, WSOrderEvent } from '../types';
import { OrderModel } from '../models/Order';
import { OrderTimer, TimerCallback } from '../workers/orderTimer';
import { Server as SocketServer } from 'socket.io';

/**
 * Sound notification types
 */
export type SoundType = 'new_order' | 'delay_alert' | 'order_ready' | 'order_complete';

/**
 * Sound configuration
 */
const SOUNDS: Record<SoundType, { frequency: number; duration: number; pattern: number[] }> = {
  new_order: { frequency: 880, duration: 200, pattern: [200, 100, 200] },
  delay_alert: { frequency: 1000, duration: 500, pattern: [500, 100, 500, 100, 500] },
  order_ready: { frequency: 660, duration: 150, pattern: [150, 50, 150, 50, 300] },
  order_complete: { frequency: 523, duration: 100, pattern: [100, 50, 100] },
};

// =============================================================================
// MongoDB Schema for Order persistence
// =============================================================================

interface IOrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  completed: boolean;
}

interface IOrderDocument extends Document {
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: IOrderItem[];
  status: OrderStatus;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  actualTime?: number;
  isDelayed: boolean;
  notes?: string;
  merchantId?: string;
}

const OrderItemSchema = new Schema<IOrderItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  notes: { type: String },
  completed: { type: Boolean, default: false },
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>({
  orderNumber: { type: String, required: true, index: true },
  tableNumber: { type: String },
  customerName: { type: String },
  items: { type: [OrderItemSchema], required: true },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  estimatedTime: { type: Number },
  actualTime: { type: Number },
  isDelayed: { type: Boolean, default: false, index: true },
  notes: { type: String },
  merchantId: { type: String, index: true },
}, {
  timestamps: false,
  versionKey: false,
});

// Compound indexes for common queries
OrderSchema.index({ status: 1, createdAt: 1 });
OrderSchema.index({ isDelayed: 1, status: 1 });
OrderSchema.index({ merchantId: 1, status: 1 });

let OrderModel: Model<IOrderDocument>;

function getOrderModel(): Model<IOrderDocument> {
  if (!OrderModel) {
    OrderModel = mongoose.model<IOrderDocument>('KitchenOrder', OrderSchema);
  }
  return OrderModel;
}

/**
 * Kitchen service events
 */
export interface KitchenServiceEvents {
  onNewOrder?: (order: KitchenOrder) => void;
  onOrderUpdate?: (order: KitchenOrder) => void;
  onOrderComplete?: (order: KitchenOrder) => void;
  onDelayAlert?: (order: KitchenOrder) => void;
  onSound?: (type: SoundType) => void;
  onTimerEvent?: (event: TimerEvent) => void;
}

// =============================================================================
// Kitchen Service with MongoDB persistence
// =============================================================================

export class KitchenService {
  private io?: SocketServer;
  private events?: KitchenServiceEvents;
  private delayThresholdMs: number;
  private orderTimer: OrderTimer;
  private isLoaded: boolean = false;

  constructor(options?: {
    io?: SocketServer;
    events?: KitchenServiceEvents;
    delayThresholdMs?: number;
  }) {
    this.io = options?.io;
    this.events = options?.events;
    this.delayThresholdMs = options?.delayThresholdMs || 15 * 60 * 1000; // 15 minutes default

    // Initialize timer with callback
    this.orderTimer = new OrderTimer((event: TimerEvent) => {
      this.handleTimerEvent(event);
    });

    // Start the timer
    this.orderTimer.start();

    // Load orders from MongoDB
    this.loadOrdersFromDB();
  }

  /**
   * Load orders from MongoDB on startup
   */
  private async loadOrdersFromDB(): Promise<void> {
    try {
      const Model = getOrderModel();
      const docs = await Model.find({
        status: { $in: ['pending', 'preparing', 'ready'] },
      }).lean();

      // Register active orders with timer
      for (const doc of docs) {
        this.orderTimer.registerOrder(doc._id.toString(), doc.createdAt);
      }

      this.isLoaded = true;
      console.log(`[MongoDB] Loaded ${docs.length} active orders from database`);
    } catch (error) {
      console.error('[MongoDB] Failed to load orders:', error);
    }
  }

  /**
   * Convert MongoDB document to KitchenOrder
   */
  private docToOrder(doc: any): KitchenOrder {
    return {
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      tableNumber: doc.tableNumber,
      customerName: doc.customerName,
      items: doc.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        completed: item.completed,
      })),
      status: doc.status,
      priority: doc.priority,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      estimatedTime: doc.estimatedTime,
      actualTime: doc.actualTime,
      isDelayed: doc.isDelayed,
      notes: doc.notes,
      totalItems: doc.items.length,
      completedItems: doc.items.filter((item: any) => item.completed).length,
    };
  }

  /**
   * Handle timer events
   */
  private handleTimerEvent(event: TimerEvent): void {
    switch (event.type) {
      case 'tick':
        this.updateDelayedStatus();
        break;
      case 'delay_warning':
        this.handleDelayWarning(event);
        break;
      case 'order_completed':
        this.handleOrderCompleted(event);
        break;
    }

    this.events?.onTimerEvent?.(event);
  }

  /**
   * Update delayed status for all active orders in database
   */
  private async updateDelayedStatus(): Promise<void> {
    try {
      const Model = getOrderModel();
      const now = Date.now();
      const threshold = this.delayThresholdMs;

      // Find all active orders that may have changed delayed status
      const activeOrders = await Model.find({
        status: { $in: ['pending', 'preparing'] },
      }).select('_id createdAt isDelayed');

      const updates: Promise<any>[] = [];

      for (const order of activeOrders) {
        const elapsed = now - order.createdAt.getTime();
        const shouldBeDelayed = elapsed > threshold;

        if (shouldBeDelayed !== order.isDelayed) {
          updates.push(
            Model.updateOne(
              { _id: order._id },
              { $set: { isDelayed: shouldBeDelayed } }
            )
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        this.broadcastUpdate();
      }
    } catch (error) {
      console.error('[KitchenService] Failed to update delayed status:', error);
    }
  }

  /**
   * Handle delay warning
   */
  private handleDelayWarning(event: TimerEvent): void {
    this.getOrder(event.orderId).then((order) => {
      if (order) {
        this.events?.onDelayAlert?.(order);
        this.playSound('delay_alert');
      }
    });
  }

  /**
   * Handle order completed event
   */
  private handleOrderCompleted(event: TimerEvent): void {
    this.getOrder(event.orderId).then((order) => {
      if (order) {
        this.events?.onOrderComplete?.(order);
      }
    });
  }

  /**
   * Play sound notification
   */
  private playSound(type: SoundType): void {
    this.events?.onSound?.(type);
  }

  /**
   * Broadcast order update to all clients
   */
  private broadcastUpdate(): void {
    if (this.io) {
      this.getActiveOrders().then((orders) => {
        this.io!.emit('orders_update', orders);
      });
    }
  }

  /**
   * Broadcast WebSocket event
   */
  private broadcastEvent(event: WSOrderEvent): void {
    if (this.io) {
      this.io.emit(event.event, event.data);
    }
  }

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<KitchenOrder> {
    const Model = getOrderModel();
    const now = new Date();

    const items: IOrderItem[] = request.items.map((item) => ({
      id: uuidv4(),
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      completed: false,
    }));

    const orderDoc = new Model({
      orderNumber: request.orderNumber,
      tableNumber: request.tableNumber,
      customerName: request.customerName,
      items,
      status: 'pending',
      priority: request.priority || 'normal',
      createdAt: now,
      updatedAt: now,
      estimatedTime: request.estimatedTime,
      isDelayed: false,
      notes: request.notes,
    });

    await orderDoc.save();

    const order = this.docToOrder(orderDoc);

    // Register order with timer
    this.orderTimer.registerOrder(order.id, order.createdAt);

    // Play new order sound
    this.playSound('new_order');

    // Notify listeners
    this.events?.onNewOrder?.(order);

    // Broadcast to clients
    this.broadcastEvent({
      event: 'new_order',
      data: order,
      timestamp: new Date(),
    });

    return order;
  }

  /**
   * Get all active orders (not completed or cancelled)
   */
  async getActiveOrders(): Promise<KitchenOrder[]> {
    const Model = getOrderModel();
    const docs = await Model.find({
      status: { $nin: ['completed', 'cancelled'] },
    })
      .sort({ createdAt: 1 })
      .lean();

    const orders = docs.map((doc) => this.docToOrder(doc));
    return OrderModel.sortByPriority(orders);
  }

  /**
   * Get all orders including completed and cancelled
   */
  async getAllOrders(): Promise<KitchenOrder[]> {
    const Model = getOrderModel();
    const docs = await Model.find({})
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => this.docToOrder(doc));
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(statuses: OrderStatus[]): Promise<KitchenOrder[]> {
    const Model = getOrderModel();
    const docs = await Model.find({ status: { $in: statuses } })
      .sort({ createdAt: 1 })
      .lean();

    const orders = docs.map((doc) => this.docToOrder(doc));
    return OrderModel.sortByPriority(orders);
  }

  /**
   * Get single order by ID
   */
  async getOrder(id: string): Promise<KitchenOrder | undefined> {
    const Model = getOrderModel();
    const doc = await Model.findById(id).lean();
    return doc ? this.docToOrder(doc) : undefined;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<KitchenOrder | null> {
    const Model = getOrderModel();
    const doc = await Model.findById(id);

    if (!doc) {
      return null;
    }

    const now = new Date();
    const updateData: any = {
      status,
      updatedAt: now,
    };

    // Handle status-specific fields
    switch (status) {
      case 'preparing':
        if (!doc.startedAt) {
          updateData.startedAt = now;
        }
        this.orderTimer.startOrderTimer(id);
        break;
      case 'ready':
        this.playSound('order_ready');
        break;
      case 'completed':
        updateData.completedAt = now;
        if (doc.startedAt) {
          updateData.actualTime = Math.round((now.getTime() - doc.startedAt.getTime()) / 60000);
        }
        this.orderTimer.unregisterOrder(id);
        this.playSound('order_complete');
        break;
      case 'cancelled':
        updateData.completedAt = now;
        this.orderTimer.unregisterOrder(id);
        break;
    }

    await Model.updateOne({ _id: id }, { $set: updateData });

    // Fetch updated document
    const updatedDoc = await Model.findById(id).lean();
    if (!updatedDoc) {
      return null;
    }

    const updatedOrder = this.docToOrder(updatedDoc);

    // Notify listeners
    this.events?.onOrderUpdate?.(updatedOrder);

    // Broadcast to clients
    this.broadcastEvent({
      event: status === 'cancelled' ? 'order_cancelled' : 'order_updated',
      data: updatedOrder,
      timestamp: new Date(),
    });

    return updatedOrder;
  }

  /**
   * Toggle item completion
   */
  async toggleItemCompletion(orderId: string, itemId: string): Promise<KitchenOrder | null> {
    const Model = getOrderModel();
    const doc = await Model.findById(orderId);

    if (!doc) {
      return null;
    }

    const item = doc.items.find((i) => i.id === itemId);
    if (!item) {
      return null;
    }

    // Toggle completion
    item.completed = !item.completed;

    // Auto-complete order if all items are done
    const completedItems = doc.items.filter((i) => i.completed).length;
    const previousStatus = doc.status;

    if (completedItems === doc.items.length && doc.status === 'preparing') {
      doc.status = 'ready';
      this.playSound('order_ready');
    }

    doc.updatedAt = new Date();
    await doc.save();

    // Fetch updated document
    const updatedDoc = await Model.findById(orderId).lean();
    if (!updatedDoc) {
      return null;
    }

    const updatedOrder = this.docToOrder(updatedDoc);

    // Notify listeners
    this.events?.onOrderUpdate?.(updatedOrder);

    // Broadcast to clients
    this.broadcastEvent({
      event: 'order_updated',
      data: updatedOrder,
      timestamp: new Date(),
    });

    return updatedOrder;
  }

  /**
   * Get order statistics
   */
  async getStats() {
    const Model = getOrderModel();
    const allOrders = await Model.find({}).lean();
    const orders = allOrders.map((doc) => this.docToOrder(doc));
    return OrderModel.getStats(orders);
  }

  /**
   * Get delayed orders
   */
  async getDelayedOrders(): Promise<KitchenOrder[]> {
    const Model = getOrderModel();
    const docs = await Model.find({
      isDelayed: true,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .sort({ createdAt: 1 })
      .lean();

    return docs.map((doc) => this.docToOrder(doc));
  }

  /**
   * Get next order in priority queue
   */
  async getNextOrder(): Promise<KitchenOrder | null> {
    const activeOrders = await this.getActiveOrders();
    return activeOrders.length > 0 ? activeOrders[0] : null;
  }

  /**
   * Clear all completed orders (cleanup)
   */
  async clearCompletedOrders(): Promise<number> {
    const Model = getOrderModel();
    const result = await Model.deleteMany({
      status: { $in: ['completed', 'cancelled'] },
    });
    return result.deletedCount || 0;
  }

  /**
   * Get sound configuration for client
   */
  getSoundConfig(type: SoundType) {
    return SOUNDS[type];
  }

  /**
   * Stop the service
   */
  stop(): void {
    this.orderTimer.stop();
  }
}

// Export singleton instance getter
let instance: KitchenService | null = null;

export function getKitchenService(options?: {
  io?: SocketServer;
  events?: KitchenServiceEvents;
  delayThresholdMs?: number;
}): KitchenService {
  if (!instance) {
    instance = new KitchenService(options);
  }
  return instance;
}

export function resetKitchenService(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
