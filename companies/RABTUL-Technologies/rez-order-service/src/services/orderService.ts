/**
 * Order Service
 *
 * Business logic layer for order operations with BullMQ queue integration.
 * Provides idempotent order creation and processing through Redis-backed
 * deduplication.
 *
 * Architecture:
 * - Service layer handles business logic
 * - OrderQueue handles async processing and idempotency
 * - Mongoose handles persistence
 *
 * Usage:
 * ```typescript
 * const service = new OrderService();
 * const result = await service.createOrder(orderData);
 * ```
 */

import { Types } from 'mongoose';
import { Order, IOrder } from '../models/Order';
import {
  OrderQueue,
  OrderJobData,
  OrderProcessingResult,
  OrderItem,
  getOrderQueue,
} from './orderQueue';
import { createServiceLogger } from '../config/logger';
import { OrderStatus } from '../state/orderStateMachine';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { emitOrderCancelled } from '../utils/careEventEmitter';

const logger = createServiceLogger('order-service');

/**
 * Order creation input
 */
export interface CreateOrderInput {
  userId: string;
  merchantId: string;
  storeId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  delivery?: {
    type: 'pickup' | 'delivery';
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  paymentMethod?: string;
  currency?: string;
  clientIdempotencyKey?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Order service response
 */
export interface OrderServiceResponse {
  success: boolean;
  order?: IOrder;
  jobId?: string;
  orderId?: string;
  message?: string;
  duplicate?: boolean;
  statusCode: number;
}

/**
 * Order service with idempotency support
 *
 * Features:
 * - Idempotent order creation using client-provided idempotency key
 * - Automatic job queueing for async processing
 * - Duplicate detection returns existing order
 * - Full audit trail with correlation IDs
 */
export class OrderService {
  private queue: OrderQueue;

  constructor(queue?: OrderQueue) {
    this.queue = queue || getOrderQueue();
  }

  /**
   * Create a new order with idempotency protection
   *
   * If the clientIdempotencyKey matches an existing order, returns the
   * existing order instead of creating a duplicate.
   *
   * @param input - Order creation input
   * @returns Service response with order details
   */
  async createOrder(input: CreateOrderInput): Promise<OrderServiceResponse> {
    const correlationId = uuidv4();
    const startTime = Date.now();

    logger.info('Creating order', {
      userId: input.userId,
      merchantId: input.merchantId,
      clientIdempotencyKey: input.clientIdempotencyKey,
      correlationId,
    });

    try {
      // Step 1: Check for duplicate using client idempotency key
      if (input.clientIdempotencyKey) {
        const existingOrder = await this.findByIdempotencyKey(input.clientIdempotencyKey);
        if (existingOrder) {
          logger.info('Duplicate order found', {
            orderId: existingOrder._id.toString(),
            clientIdempotencyKey: input.clientIdempotencyKey,
            correlationId,
          });
          return {
            success: true,
            order: existingOrder,
            orderId: existingOrder._id.toString(),
            message: 'Order already exists',
            duplicate: true,
            statusCode: 200,
          };
        }
      }

      // Step 2: Calculate totals
      const items: OrderItem[] = input.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const currency = input.currency || 'USD';

      // Step 3: Create order in database
      const order = new Order({
        orderNumber: await this.generateOrderNumber(),
        status: 'placed',
        user: new Types.ObjectId(input.userId),
        store: new Types.ObjectId(input.storeId),
        items,
        totals: {
          subtotal,
          tax: subtotal * 0.0875, // Default tax rate
          deliveryFee: input.delivery?.type === 'delivery' ? 4.99 : 0,
          total: subtotal * 1.0875 + (input.delivery?.type === 'delivery' ? 4.99 : 0),
        },
        payment: {
          method: input.paymentMethod || 'card',
          status: 'pending',
        },
        delivery: input.delivery,
        currency,
        clientIdempotencyKey: input.clientIdempotencyKey,
        correlationId,
        metadata: {
          ...input.metadata,
          createdBy: 'order-service',
          processingStartTime: startTime,
        },
      });

      // Save to database
      await order.save();

      logger.info('Order saved to database', {
        orderId: order._id.toString(),
        correlationId,
      });

      // Step 4: Queue for async processing with idempotency
      const orderId = order._id.toString();
      const jobData: Partial<OrderJobData> = {
        orderId,
        merchantId: input.merchantId,
        customerId: input.userId,
        items,
        totalAmount: order.totals?.total || subtotal,
        currency,
        metadata: {
          correlationId,
          orderNumber: order.orderNumber,
        },
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      };

      // Add to queue with idempotency
      const queueResult = await this.queue.addWithIdempotency(orderId, jobData);

      if (!queueResult.success) {
        logger.warn('Order queued but with warning', {
          orderId,
          jobId: queueResult.jobId,
          message: queueResult.message,
          correlationId,
        });
      }

      // Step 5: Return success response
      const duration = Date.now() - startTime;
      logger.info('Order created successfully', {
        orderId,
        jobId: queueResult.jobId,
        duration,
        correlationId,
      });

      return {
        success: true,
        order,
        jobId: queueResult.jobId,
        orderId,
        message: 'Order created and queued for processing',
        statusCode: 201,
      };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to create order', {
        error: err.message,
        correlationId,
      });

      // Handle duplicate key error from MongoDB
      if (err.message?.includes('E11000 duplicate key error')) {
        // Try to find the existing order
        if (input.clientIdempotencyKey) {
          const existingOrder = await this.findByIdempotencyKey(input.clientIdempotencyKey);
          if (existingOrder) {
            return {
              success: true,
              order: existingOrder,
              orderId: existingOrder._id.toString(),
              message: 'Order already exists (concurrent creation)',
              duplicate: true,
              statusCode: 200,
            };
          }
        }
      }

      return {
        success: false,
        message: `Failed to create order: ${err.message}`,
        statusCode: 500,
      };
    }
  }

  /**
   * Find order by client idempotency key
   *
   * @param clientIdempotencyKey - The client-provided idempotency key
   * @returns The existing order or null
   */
  async findByIdempotencyKey(clientIdempotencyKey: string): Promise<IOrder | null> {
    return Order.findOne({ clientIdempotencyKey }).exec();
  }

  /**
   * Get order by ID
   *
   * @param orderId - The order ID
   * @returns The order or null
   */
  async getOrder(orderId: string): Promise<IOrder | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }
    return Order.findById(orderId).exec();
  }

  /**
   * Get order by order number
   *
   * @param orderNumber - The order number
   * @returns The order or null
   */
  async getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber }).exec();
  }

  /**
   * Update order status
   *
   * @param orderId - The order ID
   * @param status - The new status
   * @param metadata - Optional metadata to merge
   * @returns Updated order or null
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: Record<string, unknown>
  ): Promise<IOrder | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const update: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (metadata) {
      Object.assign(update, metadata);
    }

    return Order.findByIdAndUpdate(
      orderId,
      { $set: update },
      { new: true }
    ).exec();
  }

  /**
   * Check if an order is currently being processed
   *
   * @param orderId - The order ID
   * @returns True if order is being processed
   */
  async isProcessing(orderId: string): Promise<boolean> {
    return this.queue.isProcessed(orderId);
  }

  /**
   * Get processing result for an order
   *
   * @param orderId - The order ID
   * @returns The processing result or null
   */
  async getProcessingResult(orderId: string): Promise<OrderProcessingResult | null> {
    return this.queue.getResult(orderId);
  }

  /**
   * Retry a failed order by clearing its idempotency
   *
   * @param orderId - The order ID
   * @returns True if successful
   */
  async retryOrder(orderId: string): Promise<boolean> {
    const order = await this.getOrder(orderId);
    if (!order) {
      logger.warn('Cannot retry: order not found', { orderId });
      return false;
    }

    // Clear idempotency to allow re-processing
    await this.queue.clearIdempotency(orderId);

    // Reset to placed status
    await this.updateOrderStatus(orderId, 'placed' as OrderStatus, {
      'metadata.retryAt': new Date().toISOString(),
    });

    logger.info('Order marked for retry', { orderId });
    return true;
  }

  /**
   * Generate unique order number
   *
   * Format: ORD-{YYYYMMDD}-{random6}
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    // FIX: Use crypto for secure random order numbers instead of Math.random()
    const random = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Get orders for a user
   *
   * @param userId - The user ID
   * @param options - Query options
   * @returns List of orders
   */
  async getOrdersByUser(
    userId: string,
    options: { limit?: number; skip?: number; status?: OrderStatus } = {}
  ): Promise<IOrder[]> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };

    if (options.status) {
      query.status = options.status;
    }

    return Order.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 20)
      .skip(options.skip || 0)
      .exec();
  }

  /**
   * Get orders for a store
   *
   * @param storeId - The store ID
   * @param options - Query options
   * @returns List of orders
   */
  async getOrdersByStore(
    storeId: string,
    options: { limit?: number; skip?: number; status?: OrderStatus } = {}
  ): Promise<IOrder[]> {
    const query: Record<string, unknown> = { store: new Types.ObjectId(storeId) };

    if (options.status) {
      query.status = options.status;
    }

    return Order.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0)
      .exec();
  }

  /**
   * Cancel an order
   *
   * @param orderId - The order ID
   * @param reason - Cancellation reason
   * @returns Updated order or null
   */
  async cancelOrder(orderId: string, reason?: string): Promise<IOrder | null> {
    const order = await this.getOrder(orderId);
    if (!order) {
      return null;
    }

    // Check if order can be cancelled
    const cancellableStatuses: OrderStatus[] = [
      'placed',
      'confirmed',
      'preparing',
    ];

    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      logger.warn('Order cannot be cancelled', {
        orderId,
        currentStatus: order.status,
      });
      return null;
    }

    const result = await this.updateOrderStatus(orderId, 'cancelled' as OrderStatus, {
      'cancellation.reason': reason,
      'cancellation.cancelledAt': new Date().toISOString(),
    });

    // Emit event to REZ Care for support tracking
    if (result) {
      emitOrderCancelled({
        customerId: result.userId,
        customerPhone: (result.customerPhone as string) || '',
        orderId: result.orderId as string,
        merchantId: result.merchantId,
        reason: reason || 'No reason provided',
        platform: (result.metadata?.platform as string) || 'restaurant',
        cancelledBy: 'customer'
      }).catch(() => {});
    }

    return result;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return this.queue.getStats();
  }
}

// Singleton instance
let orderServiceInstance: OrderService | null = null;

/**
 * Get the singleton OrderService instance
 */
export function getOrderService(): OrderService {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService();
  }
  return orderServiceInstance;
}
