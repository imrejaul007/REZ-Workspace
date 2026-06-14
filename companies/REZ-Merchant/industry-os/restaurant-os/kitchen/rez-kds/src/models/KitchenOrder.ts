import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus, PriorityLevel, StationType } from '../config';

export interface IOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  modifiers: string[];
  notes?: string;
  station: StationType;
  status: OrderStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IKitchenOrder extends Document {
  orderId: string;
  orderNumber: string;
  source: 'pos' | 'online' | 'kiosk';
  items: IOrderItem[];
  assignedStations: StationType[];
  status: OrderStatus;
  priority: PriorityLevel;
  priorityReason?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionTime?: Date;
  tableNumber?: string;
  serverName?: string;
  customerName?: string;
  notes?: string;
  bumpCount: number;
  lastBumpedAt?: Date;
  timing: {
    totalElapsed: number;
    averageItemTime: number;
    longestItemTime: number;
  };
  analytics: {
    viewCount: number;
    lastViewedAt?: Date;
  };
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  modifiers: { type: [String], default: [] },
  notes: { type: String },
  station: {
    type: String,
    enum: Object.values(StationType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { _id: false });

const KitchenOrderSchema = new Schema<IKitchenOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, index: true },
  source: {
    type: String,
    enum: ['pos', 'online', 'kiosk'],
    default: 'pos'
  },
  items: { type: [OrderItemSchema], required: true },
  assignedStations: {
    type: [String],
    enum: Object.values(StationType),
    index: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true
  },
  priority: {
    type: Number,
    enum: Object.values(PriorityLevel),
    default: PriorityLevel.NORMAL,
    index: true
  },
  priorityReason: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  estimatedCompletionTime: { type: Date },
  tableNumber: { type: String },
  serverName: { type: String },
  customerName: { type: String },
  notes: { type: String },
  bumpCount: { type: Number, default: 0 },
  lastBumpedAt: { type: Date },
  timing: {
    totalElapsed: { type: Number, default: 0 },
    averageItemTime: { type: Number, default: 0 },
    longestItemTime: { type: Number, default: 0 }
  },
  analytics: {
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
KitchenOrderSchema.index({ status: 1, priority: -1, createdAt: 1 });
KitchenOrderSchema.index({ assignedStations: 1, status: 1 });
KitchenOrderSchema.index({ createdAt: -1, status: 1 });

// Virtual for elapsed time calculation
KitchenOrderSchema.virtual('elapsedSeconds').get(function() {
  const start = this.startedAt || this.createdAt;
  if (!start) return 0;
  return Math.floor((Date.now() - start.getTime()) / 1000);
});

// Method to check if order is overdue
KitchenOrderSchema.methods.isOverdue = function(thresholdSeconds: number): boolean {
  return this.elapsedSeconds > thresholdSeconds;
};

// Method to get orders by status for a station
KitchenOrderSchema.statics.findByStation = function(
  station: StationType,
  status?: OrderStatus
) {
  const query: Record<string, unknown> = {
    assignedStations: station,
    status: { $ne: OrderStatus.COMPLETED }
  };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ priority: -1, createdAt: 1 });
};

export const KitchenOrder = mongoose.model<IKitchenOrder>('KitchenOrder', KitchenOrderSchema);
