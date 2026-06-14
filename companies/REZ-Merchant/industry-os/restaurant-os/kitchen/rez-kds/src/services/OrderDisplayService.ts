import { Server as SocketServer, Socket } from 'socket.io';
import { KitchenOrder, IKitchenOrder } from '../models/KitchenOrder';
import { Station } from '../models/Station';
import { OrderStatus, StationType, PriorityLevel, TimingThresholds } from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface OrderDisplayItem {
  itemId: string;
  name: string;
  quantity: number;
  modifiers: string[];
  notes?: string;
  station: StationType;
  status: OrderStatus;
  elapsedSeconds: number;
  timingStatus: 'ok' | 'warning' | 'critical' | 'overdue';
}

export interface OrderDisplayDTO {
  orderId: string;
  orderNumber: string;
  source: string;
  items: OrderDisplayItem[];
  status: OrderStatus;
  priority: PriorityLevel;
  priorityLabel: string;
  priorityReason?: string;
  createdAt: Date;
  elapsedSeconds: number;
  timingStatus: 'ok' | 'warning' | 'critical' | 'overdue';
  tableNumber?: string;
  serverName?: string;
  customerName?: string;
  notes?: string;
  stations: StationType[];
  allItemsComplete: boolean;
}

export interface NewOrderEvent {
  orderId: string;
  orderNumber: string;
  priority: PriorityLevel;
  source: string;
  itemCount: number;
  stations: StationType[];
}

export class OrderDisplayService {
  private io: SocketServer | null = null;
  private activeConnections: Map<string, { socket: Socket; stations: StationType[] }> = new Map();

  constructor() {}

  setSocketServer(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`KDS Client connected: ${socket.id}`);

      // Subscribe to specific stations
      socket.on('subscribe:stations', (stations: StationType[]) => {
        this.activeConnections.set(socket.id, { socket, stations });
        socket.join(`stations:${stations.join(':')}`);
        console.log(`Socket ${socket.id} subscribed to stations: ${stations.join(', ')}`);
      });

      // Unsubscribe from stations
      socket.on('unsubscribe:stations', (stations: StationType[]) => {
        socket.leave(`stations:${stations.join(':')}`);
        this.activeConnections.delete(socket.id);
      });

      // Request active orders for a station
      socket.on('request:orders', async (station: StationType) => {
        const orders = await this.getOrdersForStation(station);
        socket.emit('orders:list', orders);
      });

      socket.on('disconnect', () => {
        this.activeConnections.delete(socket.id);
        console.log(`KDS Client disconnected: ${socket.id}`);
      });
    });
  }

  private calculateTimingStatus(elapsedSeconds: number): 'ok' | 'warning' | 'critical' | 'overdue' {
    if (elapsedSeconds > TimingThresholds.OVERDUE) return 'overdue';
    if (elapsedSeconds > TimingThresholds.CRITICAL) return 'critical';
    if (elapsedSeconds > TimingThresholds.WARNING) return 'warning';
    return 'ok';
  }

  private getPriorityLabel(priority: PriorityLevel): string {
    switch (priority) {
      case PriorityLevel.RUSH: return 'RUSH';
      case PriorityLevel.URGENT: return 'URGENT';
      case PriorityLevel.HIGH: return 'HIGH';
      case PriorityLevel.NORMAL: return 'NORMAL';
      case PriorityLevel.LOW: return 'LOW';
      default: return 'NORMAL';
    }
  }

  private async transformToDisplayDTO(order: IKitchenOrder): Promise<OrderDisplayDTO> {
    const elapsedSeconds = Math.floor((Date.now() - (order.startedAt || order.createdAt).getTime()) / 1000);
    const items = order.items.map(item => ({
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      modifiers: item.modifiers,
      notes: item.notes,
      station: item.station,
      status: item.status,
      elapsedSeconds: item.startedAt
        ? Math.floor((Date.now() - item.startedAt.getTime()) / 1000)
        : elapsedSeconds,
      timingStatus: item.startedAt
        ? this.calculateTimingStatus(Math.floor((Date.now() - item.startedAt.getTime()) / 1000))
        : this.calculateTimingStatus(elapsedSeconds)
    }));

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      source: order.source,
      items,
      status: order.status,
      priority: order.priority,
      priorityLabel: this.getPriorityLabel(order.priority),
      priorityReason: order.priorityReason,
      createdAt: order.createdAt,
      elapsedSeconds,
      timingStatus: this.calculateTimingStatus(elapsedSeconds),
      tableNumber: order.tableNumber,
      serverName: order.serverName,
      customerName: order.customerName,
      notes: order.notes,
      stations: order.assignedStations,
      allItemsComplete: order.items.every(item => item.status === OrderStatus.COMPLETED)
    };
  }

  async createOrder(orderData: {
    orderId?: string;
    orderNumber: string;
    source: 'pos' | 'online' | 'kiosk';
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      modifiers?: string[];
      notes?: string;
      station: StationType;
    }>;
    tableNumber?: string;
    serverName?: string;
    customerName?: string;
    notes?: string;
    priority?: PriorityLevel;
    priorityReason?: string;
  }): Promise<OrderDisplayDTO> {
    const orderId = orderData.orderId || uuidv4();
    const assignedStations = [...new Set(orderData.items.map(item => item.station))];

    const order = new KitchenOrder({
      orderId,
      orderNumber: orderData.orderNumber,
      source: orderData.source,
      items: orderData.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
        notes: item.notes,
        station: item.station,
        status: OrderStatus.PENDING
      })),
      assignedStations,
      status: OrderStatus.PENDING,
      priority: orderData.priority || PriorityLevel.NORMAL,
      priorityReason: orderData.priorityReason,
      tableNumber: orderData.tableNumber,
      serverName: orderData.serverName,
      customerName: orderData.customerName,
      notes: orderData.notes,
      bumpCount: 0
    });

    await order.save();

    // Update station order counts
    for (const stationType of assignedStations) {
      await Station.findOneAndUpdate(
        { stationType, isActive: true },
        { $inc: { currentOrderCount: 1 } }
      );
    }

    const displayDTO = await this.transformToDisplayDTO(order);

    // Emit new order event
    this.emitNewOrder({
      orderId: displayDTO.orderId,
      orderNumber: displayDTO.orderNumber,
      priority: displayDTO.priority,
      source: displayDTO.source,
      itemCount: displayDTO.items.length,
      stations: displayDTO.stations
    });

    // Emit to specific station rooms
    this.emitToStations(displayDTO);

    return displayDTO;
  }

  async getOrdersForStation(station: StationType): Promise<OrderDisplayDTO[]> {
    const orders = await KitchenOrder.find({
      assignedStations: station,
      status: { $ne: OrderStatus.COMPLETED }
    }).sort({ priority: -1, createdAt: 1 });

    const displayOrders = await Promise.all(
      orders.map(order => this.transformToDisplayDTO(order))
    );

    return displayOrders;
  }

  async getOrder(orderId: string): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;
    return this.transformToDisplayDTO(order);
  }

  async bumpOrder(orderId: string, station: StationType): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    order.bumpCount += 1;
    order.lastBumpedAt = new Date();

    // Mark items for this station as in progress
    const stationItems = order.items.filter(item =>
      item.station === station && item.status === OrderStatus.PENDING
    );

    if (stationItems.length > 0 && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.IN_PROGRESS;
      order.startedAt = new Date();
    }

    // Check if all items are complete
    const allComplete = order.items.every(item => item.status === OrderStatus.COMPLETED);
    if (allComplete) {
      order.status = OrderStatus.READY;
    }

    await order.save();

    // Update station metrics
    for (const stationType of order.assignedStations) {
      const stationDoc = await Station.findOne({ stationType, isActive: true });
      if (stationDoc) {
        stationDoc.currentOrderCount = Math.max(0, stationDoc.currentOrderCount - 1);
        await stationDoc.save();
      }
    }

    const displayDTO = await this.transformToDisplayDTO(order);
    this.emitOrderUpdate(displayDTO);

    return displayDTO;
  }

  async completeItem(orderId: string, itemId: string): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    const item = order.items.find(i => i.itemId === itemId);
    if (!item) return null;

    item.status = OrderStatus.COMPLETED;
    item.completedAt = new Date();

    // Update item timing
    if (item.startedAt) {
      const itemTime = Math.floor((item.completedAt.getTime() - item.startedAt.getTime()) / 1000);
      const currentTotal = order.timing.averageItemTime * (order.items.filter(i => i.completedAt).length - 1);
      order.timing.averageItemTime = order.items.every(i => i.completedAt)
        ? (currentTotal + itemTime) / order.items.filter(i => i.completedAt).length
        : currentTotal;
      order.timing.longestItemTime = Math.max(order.timing.longestItemTime, itemTime);
    }

    // Check if all items complete
    if (order.items.every(i => i.status === OrderStatus.COMPLETED)) {
      order.status = OrderStatus.READY;
      order.completedAt = new Date();
      order.timing.totalElapsed = Math.floor(
        (order.completedAt.getTime() - (order.startedAt || order.createdAt).getTime()) / 1000
      );

      // Update station metrics
      for (const stationType of order.assignedStations) {
        const stationDoc = await Station.findOne({ stationType, isActive: true });
        if (stationDoc) {
          stationDoc.recordCompletion(order.timing.totalElapsed);
          await stationDoc.save();
        }
      }
    }

    await order.save();

    const displayDTO = await this.transformToDisplayDTO(order);
    this.emitOrderUpdate(displayDTO);

    return displayDTO;
  }

  async markOrderComplete(orderId: string): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();

    // Complete any pending items
    for (const item of order.items) {
      if (item.status !== OrderStatus.COMPLETED) {
        item.status = OrderStatus.COMPLETED;
        item.completedAt = new Date();
      }
    }

    order.timing.totalElapsed = Math.floor(
      (order.completedAt.getTime() - (order.startedAt || order.createdAt).getTime()) / 1000
    );

    await order.save();

    // Update all station metrics
    for (const stationType of order.assignedStations) {
      const stationDoc = await Station.findOne({ stationType, isActive: true });
      if (stationDoc) {
        stationDoc.recordCompletion(order.timing.totalElapsed);
        await stationDoc.save();
      }
    }

    const displayDTO = await this.transformToDisplayDTO(order);
    this.emitOrderComplete(displayDTO);

    return displayDTO;
  }

  async updatePriority(orderId: string, priority: PriorityLevel, reason?: string): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    order.priority = priority;
    if (reason) order.priorityReason = reason;

    await order.save();

    const displayDTO = await this.transformToDisplayDTO(order);
    this.emitOrderUpdate(displayDTO);

    // Emit priority change event for audio alerts
    this.io?.emit('order:priority-changed', {
      orderId,
      priority: displayDTO.priority,
      priorityLabel: displayDTO.priorityLabel,
      reason: displayDTO.priorityReason
    });

    return displayDTO;
  }

  async recallOrder(orderId: string): Promise<OrderDisplayDTO | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    // Reset order status
    order.status = OrderStatus.IN_PROGRESS;
    order.completedAt = undefined;
    order.bumpCount += 1;
    order.lastBumpedAt = new Date();

    // Reset item statuses
    for (const item of order.items) {
      item.status = OrderStatus.PENDING;
      item.completedAt = undefined;
    }

    await order.save();

    // Re-increment station counts
    for (const stationType of order.assignedStations) {
      await Station.findOneAndUpdate(
        { stationType, isActive: true },
        { $inc: { currentOrderCount: 1 } }
      );
    }

    const displayDTO = await this.transformToDisplayDTO(order);
    this.emitNewOrder({
      orderId: displayDTO.orderId,
      orderNumber: displayDTO.orderNumber,
      priority: displayDTO.priority,
      source: displayDTO.source,
      itemCount: displayDTO.items.length,
      stations: displayDTO.stations
    });
    this.emitToStations(displayDTO);

    return displayDTO;
  }

  async getOrderHistory(filters: {
    startDate?: Date;
    endDate?: Date;
    station?: StationType;
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderDisplayDTO[]; total: number }> {
    const query: Record<string, unknown> = {
      status: OrderStatus.COMPLETED
    };

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
    }

    if (filters.station) {
      query.assignedStations = filters.station;
    }

    const total = await KitchenOrder.countDocuments(query);
    const orders = await KitchenOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(filters.offset || 0)
      .limit(filters.limit || 50);

    const displayOrders = await Promise.all(
      orders.map(order => this.transformToDisplayDTO(order))
    );

    return { orders: displayOrders, total };
  }

  private emitNewOrder(event: NewOrderEvent) {
    this.io?.emit('order:new', event);

    // Emit to specific station rooms
    for (const station of event.stations) {
      this.io?.to(`stations:${station}`).emit('order:new', event);
    }

    // Emit audio alert based on priority
    if (event.priority >= PriorityLevel.HIGH) {
      this.io?.emit('audio:alert', {
        type: event.priority >= PriorityLevel.RUSH ? 'rush' : 'priority',
        orderId: event.orderId
      });
    } else {
      this.io?.emit('audio:alert', { type: 'new_order', orderId: event.orderId });
    }
  }

  private emitToStations(order: OrderDisplayDTO) {
    for (const station of order.stations) {
      this.io?.to(`stations:${station}`).emit('order:update', order);
    }
    this.io?.emit('order:update', order);
  }

  private emitOrderUpdate(order: OrderDisplayDTO) {
    this.emitToStations(order);
  }

  private emitOrderComplete(order: OrderDisplayDTO) {
    this.io?.emit('order:completed', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      stations: order.stations
    });

    for (const station of order.stations) {
      this.io?.to(`stations:${station}`).emit('order:completed', {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        station
      });
    }

    this.io?.emit('audio:alert', { type: 'ready', orderId: order.orderId });
  }

  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }
}

export const orderDisplayService = new OrderDisplayService();
