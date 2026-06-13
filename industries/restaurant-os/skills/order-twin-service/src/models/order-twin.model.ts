import mongoose, { Schema, Document } from 'mongoose';
import {
  OrderTwinDocument,
  OrderStatus,
  OrderType,
  OrderSource,
  ItemStatus,
  PaymentStatus,
  OrderItem,
  OrderTiming,
  PaymentMethod,
  defaultTiming
} from '../schemas/order-twin.schema';

export interface IOrderTwinModel extends Omit<OrderTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Order Item Schema
const OrderItemSchema = new Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  modifiers: [{ type: String }],
  specialInstructions: { type: String },
  status: {
    type: String,
    enum: Object.values(ItemStatus),
    default: ItemStatus.PENDING
  },
  stationId: { type: String },
  startedAt: { type: String },
  completedAt: { type: String }
}, { _id: false });

// Order Timing Schema
const OrderTimingSchema = new Schema({
  createdAt: { type: String, required: true },
  confirmedAt: { type: String },
  startedAt: { type: String },
  readyAt: { type: String },
  servedAt: { type: String },
  completedAt: { type: String },
  cancelledAt: { type: String }
}, { _id: false });

// Payment Method Schema
const PaymentMethodSchema = new Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet', 'points'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  transactionId: { type: String }
}, { _id: false });

// Main Order Twin Schema
const OrderTwinSchema = new Schema<IOrderTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    restaurantId: {
      type: String,
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: true
    },
    source: {
      type: String,
      enum: Object.values(OrderSource),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.RECEIVED
    },
    tableId: { type: String, index: true },
    customerId: { type: String, index: true },
    items: [{
      type: OrderItemSchema,
      required: true
    }],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    timing: {
      type: OrderTimingSchema,
      default: () => ({})
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    paymentMethods: [{
      type: PaymentMethodSchema
    }],
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    notes: { type: String },
    priority: {
      type: String,
      enum: ['normal', 'rush', 'vip'],
      default: 'normal'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
OrderTwinSchema.index({ restaurantId: 1, status: 1 });
OrderTwinSchema.index({ restaurantId: 1, createdAt: -1 });
OrderTwinSchema.index({ tableId: 1, status: 1 });
OrderTwinSchema.index({ customerId: 1 });
OrderTwinSchema.index({ 'items.menuItemId': 1 });

// Compound index for order number uniqueness per restaurant
OrderTwinSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });

// Instance methods
OrderTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.order.${this.orderId}`;
};

OrderTwinSchema.methods.calculateTotals = function(): void {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  this.total = this.subtotal + this.tax - this.discount;
};

OrderTwinSchema.methods.getTotalPaid = function(): number {
  return this.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
};

OrderTwinSchema.methods.getRemainingBalance = function(): number {
  return this.total - this.getTotalPaid();
};

OrderTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    orderId: obj.orderId,
    restaurantId: obj.restaurantId,
    orderNumber: obj.orderNumber,
    orderType: obj.orderType,
    source: obj.source,
    status: obj.status,
    tableId: obj.tableId,
    customerId: obj.customerId,
    items: obj.items,
    subtotal: obj.subtotal,
    tax: obj.tax,
    discount: obj.discount,
    total: obj.total,
    timing: obj.timing,
    paymentStatus: obj.paymentStatus,
    paymentMethods: obj.paymentMethods,
    loyaltyPointsEarned: obj.loyaltyPointsEarned,
    loyaltyPointsRedeemed: obj.loyaltyPointsRedeemed,
    notes: obj.notes,
    priority: obj.priority,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
OrderTwinSchema.statics.findByOrderId = function(orderId: string) {
  return this.findOne({ orderId });
};

OrderTwinSchema.statics.findByRestaurant = function(restaurantId: string) {
  return this.find({ restaurantId }).sort({ createdAt: -1 });
};

OrderTwinSchema.statics.findByTable = function(tableId: string) {
  return this.find({ tableId, status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } });
};

OrderTwinSchema.statics.findByStatus = function(restaurantId: string, status: OrderStatus) {
  return this.find({ restaurantId, status }).sort({ createdAt: -1 });
};

OrderTwinSchema.statics.findActiveOrders = function(restaurantId: string) {
  return this.find({
    restaurantId,
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
  }).sort({ priority: -1, createdAt: 1 });
};

// Export model
export const OrderTwin = mongoose.model<IOrderTwinModel>('OrderTwin', OrderTwinSchema);
