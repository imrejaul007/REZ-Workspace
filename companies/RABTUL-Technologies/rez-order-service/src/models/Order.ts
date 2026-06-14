/**
 * Order model — strict:false so it reads the monolith's 'orders' collection
 * without requiring an exact schema match.
 *
 * Canonical reference: @rez/shared/entities/order
 * OrderStatus enum: placed, confirmed, preparing, ready, dispatched, out_for_delivery, delivered, cancelled, cancelling, returned, refunded
 * PaymentStatus enum (11 canonical values): pending, processing, completed, failed, cancelled, expired, refund_initiated, refund_processing, refunded, refund_failed, partially_refunded
 *
 * MIGRATED: Using OrderStatus from @rez/shared (aligned, Feb 2026)
 */
import mongoose, { Schema, Types } from 'mongoose';
import { OrderStatus } from '@rez/shared';
// MIGRATED: Using OrderStatus from @rez/shared

/**
 * Core fields that are guaranteed to exist on every order document.
 * The IOrder interface extends this with `[key: string]: unknown` to allow
 * additional fields from the monolith schema without breaking reads.
 */
export interface IOrderFields {
  _id: Types.ObjectId;
  orderNumber?: string;
  // Using OrderStatus from @rez/shared
  status: OrderStatus;
  user: Types.ObjectId | string;
  store: Types.ObjectId | string;
  // FIXED: Added merchantId for efficient querying
  merchantId: Types.ObjectId | string;
  items: Array<{
    itemId?: Types.ObjectId | string;
    name?: string;
    quantity?: number;
    price?: number;
    [key: string];
  }>;
  totals?: {
    subtotal?: number;
    tax?: number;
    discount?: number;
    deliveryFee?: number;
    total?: number;
    [key: string];
  };
  payment?: {
    method?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refund_initiated' | 'refund_processing' | 'refunded' | 'refund_failed' | 'partially_refunded';
    amount?: number;
    [key: string];
  };
  delivery?: {
    type?: string;
    address?;
    [key: string];
  };
  currency?: string;
  clientIdempotencyKey?: string;
  correlationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder extends IOrderFields {
  [key: string];
}

// strict:false is required for monolith compatibility — the monolith's 'orders' collection
// contains fields not declared here (e.g., timeline, cancellation, delivery sub-documents).
// Without strict:false, Mongoose would silently strip those fields on read, breaking queries
// and losing data on findOneAndUpdate. All writes in worker.ts use explicit $set with named
// fields only, so no arbitrary data can be injected through the loose schema.
const OrderSchema = new Schema({}, { strict: false, collection: 'orders', timestamps: true });

// CRIT FIX: Enforce order status lifecycle transitions in pre-save hook.
// Terminal states (delivered, cancelled, returned, refunded) can only transition
// to refund-related terminal states. Within the fulfillment path, transitions
// can skip forward but cannot jump backward by more than one step.
OrderSchema.post('init', function () {
  (this as unknown)._previousStatus = (this as unknown).status;
});
OrderSchema.pre('save', function (next) {
  const doc = this as unknown;
  if (!doc.isModified('status')) return next();

  const terminalStates = ['delivered', 'cancelled', 'returned', 'refunded'];
  const fulfillmentLifecycle = ['pending', 'placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered'];

  const from = doc._previousStatus ?? doc.status;
  const to = doc.status;

  // Allow terminal → refund-terminal transitions (e.g., delivered → returned)
  if (terminalStates.includes(from) && terminalStates.includes(to)) {
    if (['refunded', 'returned'].includes(to)) return next();
    return next(new Error(`Invalid order status transition from terminal state: ${from} → ${to}`));
  }

  // Block backward jumps beyond one step in the fulfillment lifecycle
  const fromIdx = fulfillmentLifecycle.indexOf(from);
  const toIdx = fulfillmentLifecycle.indexOf(to);
  if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx - 1) {
    return next(new Error(`Invalid order status transition: ${from} → ${to}`));
  }

  next();
});

// Index for common query patterns
OrderSchema.index({ 'user': 1, 'createdAt': -1 });
OrderSchema.index({ '_id': 1 });
OrderSchema.index({ 'status': 1 });
OrderSchema.index({ 'status': 1, 'createdAt': -1 });
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ 'user': 1, 'status': 1 });

// PERFORMANCE: Add compound index for merchant order queries
OrderSchema.index({ 'items.itemId': 1, 'status': 1 });

// PERFORMANCE: Add sparse index for payment lookup
OrderSchema.index({ 'payment.id': 1 }, { sparse: true });

// DB-HEALTH-011: Unique index for orderNumber lookup
OrderSchema.index({ 'orderNumber': 1 }, { unique: true });

// DB-HEALTH-012: Compound index for merchant order status queries
OrderSchema.index({ 'merchant': 1, 'status': 1, 'createdAt': -1 });

// DB-HEALTH-013: FIXED - Add explicit merchantId index for efficient querying
OrderSchema.index({ 'merchantId': 1, 'createdAt': -1 });
OrderSchema.index({ 'merchantId': 1, 'status': 1 });

// DB-HEALTH-013: Compound index for store order status queries
OrderSchema.index({ 'store': 1, 'status': 1 });

// DB-HEALTH-014: Soft delete index
OrderSchema.index({ 'deletedAt': 1 });

// PERFORMANCE FIX (Agent 17): Add missing indexes for common query patterns
// Index for amount-based queries (e.g., "orders over 1000")
OrderSchema.index({ 'totals.total': 1 });
// Index for user orders by status over time
OrderSchema.index({ 'user': 1, 'status': 1, 'createdAt': -1 });
// Index for store orders by status
OrderSchema.index({ 'store': 1, 'status': 1, 'createdAt': -1 });
// Index for delivery tracking
OrderSchema.index({ 'delivery.status': 1 });

// ORDER-IDEM-001 FIX: Partial unique index for idempotency.
// Allows multiple orders without clientIdempotencyKey, but prevents
// duplicate orders when clientIdempotencyKey is provided.
OrderSchema.index(
  { user: 1, clientIdempotencyKey: 1 },
  { unique: true, partialFilterExpression: { clientIdempotencyKey: { $exists: true, $nin: [null, ''] } } }
);

// CS-L1 FIX: Use 'Order' as the model name. The previous 'OrderService_Order'
// guard was cargo-cult code from when services shared a Mongoose instance. In
// the microservice setup each service has its own connection, so there is no
// collision risk with the monolith's 'Order' model.
export const Order = mongoose.models['Order']
  ? (mongoose.model('Order') as mongoose.Model<IOrder>)
  : mongoose.model<IOrder>('Order', OrderSchema);
