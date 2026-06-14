import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../modules/orders/dto/create-order.dto';
import { Prisma } from '@prisma/client';

// ==========================================
// Type Definitions
// ==========================================

/**
 * Status of a pending order in the offline queue
 */
export enum QueueStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Result of enqueueing an order
 */
export interface EnqueueResult {
  success: boolean;
  pendingOrderId?: string;
  message: string;
  queuedAt?: Date;
}

/**
 * Result of processing a single order
 */
export interface ProcessResult {
  pendingOrderId: string;
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  attempts: number;
  error?: string;
  processedAt: Date;
}

/**
 * Result of processing the entire queue
 */
export interface QueueProcessResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: ProcessResult[];
  processedAt: Date;
}

/**
 * Status of the queue
 */
export interface QueueStatusResult {
  pending: number;
  processing: number;
  failed: number;
  total: number;
  oldestPendingAt: Date | null;
  newestPendingAt: Date | null;
}

/**
 * Error record in error history
 */
interface ErrorRecord {
  timestamp: Date;
  error: string;
  attempt: number;
}

// ==========================================
// Constants
// ==========================================

/**
 * Exponential backoff delays in milliseconds
 * Attempts: 1, 2, 3, 4, 5 -> 2s, 8s, 32s, 128s, 512s
 */
const RETRY_DELAYS_MS = [2000, 8000, 32000, 128000, 512000];

/**
 * Maximum age for an order before it's marked as expired (24 hours)
 */
const MAX_ORDER_AGE_HOURS = 24;

/**
 * Default maximum retry attempts
 */
const DEFAULT_MAX_ATTEMPTS = 5;

// ==========================================
// Offline Queue Service
// ==========================================

@Injectable()
export class OfflineQueueService {
  private readonly logger = new Logger(OfflineQueueService.name);
  private isProcessingQueue = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {
    // Start periodic queue processing
    this.startPeriodicProcessing();
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * Enqueue an order to the offline queue
   *
   * This method is called when:
   * - Network is offline (detected client-side)
   * - Server returns network error
   * - Request times out
   *
   * @param orderData - The order data to queue
   * @param restaurantId - Restaurant identifier
   * @param idempotencyKey - Optional idempotency key for deduplication
   * @param clientOrderId - Optional client-generated order ID
   * @param source - Source of the order (pos, web, api)
   * @returns Result of enqueueing
   */
  async enqueueOrder(
    orderData: CreateOrderDto,
    restaurantId: string,
    idempotencyKey?: string,
    clientOrderId?: string,
    source: string = 'pos',
  ): Promise<EnqueueResult> {
    const requestId = this.generateRequestId();

    try {
      this.logger.log(
        `[${requestId}] Enqueueing order for restaurant ${restaurantId}`,
      );

      // ========================================
      // Idempotency Check
      // ========================================

      // Check by idempotency key if provided
      if (idempotencyKey) {
        const existingByKey = await this.prisma.pendingOrder.findFirst({
          where: { idempotencyKey },
        });

        if (existingByKey) {
          this.logger.warn(
            `[${requestId}] Duplicate idempotency key: ${idempotencyKey}`,
          );
          return {
            success: true,
            pendingOrderId: existingByKey.id,
            message: 'Order already queued with this idempotency key',
            queuedAt: existingByKey.createdAt,
          };
        }
      }

      // Check by client order ID if provided
      if (clientOrderId) {
        const existingByClientId = await this.prisma.pendingOrder.findFirst({
          where: { clientOrderId },
        });

        if (existingByClientId) {
          this.logger.warn(
            `[${requestId}] Duplicate client order ID: ${clientOrderId}`,
          );
          return {
            success: true,
            pendingOrderId: existingByClientId.id,
            message: 'Order already queued with this client order ID',
            queuedAt: existingByClientId.createdAt,
          };
        }
      }

      // ========================================
      // Create Pending Order
      // ========================================

      const nextRetryAt = new Date(
        Date.now() + RETRY_DELAYS_MS[0],
      );

      const pendingOrder = await this.prisma.pendingOrder.create({
        data: {
          orderData: orderData as unknown as Prisma.JsonObject,
          idempotencyKey,
          clientOrderId,
          status: 'PENDING',
          restaurantId,
          source,
          attempts: 0,
          maxAttempts: DEFAULT_MAX_ATTEMPTS,
          nextRetryAt,
        },
      });

      this.logger.log(
        `[${requestId}] Order queued successfully: ${pendingOrder.id}`,
      );

      return {
        success: true,
        pendingOrderId: pendingOrder.id,
        message: 'Order queued for processing',
        queuedAt: pendingOrder.createdAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[${requestId}] Failed to enqueue order: ${errorMessage}`);

      throw new InternalServerErrorException(
        `Failed to queue order: ${errorMessage}`,
      );
    }
  }

  /**
   * Process all pending orders in the queue
   *
   * This method should be called:
   * - When connection is restored (from client)
   * - Periodically by the server (via cron/scheduler)
   * - Manually via admin endpoint
   *
   * @param limit - Maximum number of orders to process (default: 50)
   * @returns Result of processing the queue
   */
  async processQueue(limit: number = 50): Promise<QueueProcessResult> {
    const requestId = this.generateRequestId();

    // Prevent concurrent processing
    if (this.isProcessingQueue) {
      this.logger.warn(`[${requestId}] Queue processing already in progress`);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        processedAt: new Date(),
      };
    }

    this.isProcessingQueue = true;
    const results: ProcessResult[] = [];

    try {
      this.logger.log(`[${requestId}] Starting queue processing (limit: ${limit})`);

      // Get pending orders that are due for processing
      const pendingOrders = await this.prisma.pendingOrder.findMany({
        where: {
          status: 'PENDING',
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
          createdAt: {
            gte: new Date(Date.now() - MAX_ORDER_AGE_HOURS * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      this.logger.log(
        `[${requestId}] Found ${pendingOrders.length} orders to process`,
      );

      // Process each order
      for (const pendingOrder of pendingOrders) {
        const result = await this.processSingleOrder(pendingOrder, requestId);
        results.push(result);
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter(
        (r) => !r.success && r.error !== 'skipped',
      ).length;
      const skipped = results.filter((r) => r.error === 'skipped').length;

      this.logger.log(
        `[${requestId}] Queue processing complete: ${successful} successful, ${failed} failed, ${skipped} skipped`,
      );

      return {
        total: pendingOrders.length,
        successful,
        failed,
        skipped,
        results,
        processedAt: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${requestId}] Queue processing failed: ${errorMessage}`,
      );

      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        processedAt: new Date(),
      };
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Get the current status of the queue
   *
   * @param restaurantId - Optional restaurant ID to filter by
   * @returns Queue status including counts and timestamps
   */
  async getQueueStatus(
    restaurantId?: string,
  ): Promise<QueueStatusResult> {
    const whereClause: Prisma.PendingOrderWhereInput = restaurantId
      ? { restaurantId }
      : {};

    const [pending, processing, failed, oldest, newest] = await Promise.all([
      this.prisma.pendingOrder.count({
        where: { ...whereClause, status: 'PENDING' },
      }),
      this.prisma.pendingOrder.count({
        where: { ...whereClause, status: 'PROCESSING' },
      }),
      this.prisma.pendingOrder.count({
        where: {
          ...whereClause,
          status: { in: ['FAILED', 'EXPIRED'] },
        },
      }),
      this.prisma.pendingOrder.findFirst({
        where: { ...whereClause, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.pendingOrder.findFirst({
        where: { ...whereClause, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      pending,
      processing,
      failed,
      total: pending + processing + failed,
      oldestPendingAt: oldest?.createdAt ?? null,
      newestPendingAt: newest?.createdAt ?? null,
    };
  }

  /**
   * Get pending orders for a restaurant
   *
   * @param restaurantId - Restaurant identifier
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated list of pending orders
   */
  async getPendingOrders(
    restaurantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    orders: Array<{
      id: string;
      clientOrderId: string | null;
      status: string;
      attempts: number;
      lastError: string | null;
      createdAt: Date;
      nextRetryAt: Date | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.pendingOrder.findMany({
        where: {
          restaurantId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        select: {
          id: true,
          clientOrderId: true,
          status: true,
          attempts: true,
          lastError: true,
          createdAt: true,
          nextRetryAt: true,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.pendingOrder.count({
        where: {
          restaurantId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a pending order from the queue
   *
   * @param pendingOrderId - ID of the pending order to delete
   * @returns True if deleted, false if not found
   */
  async deletePendingOrder(pendingOrderId: string): Promise<boolean> {
    try {
      await this.prisma.pendingOrder.delete({
        where: { id: pendingOrderId },
      });
      this.logger.log(`Deleted pending order: ${pendingOrderId}`);
      return true;
    } catch {
      this.logger.warn(`Pending order not found: ${pendingOrderId}`);
      return false;
    }
  }

  /**
   * Retry a failed order
   *
   * @param pendingOrderId - ID of the pending order to retry
   * @returns Updated pending order
   */
  async retryOrder(pendingOrderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const pendingOrder = await this.prisma.pendingOrder.findUnique({
        where: { id: pendingOrderId },
      });

      if (!pendingOrder) {
        return { success: false, message: 'Order not found' };
      }

      if (!['FAILED', 'EXPIRED'].includes(pendingOrder.status)) {
        return {
          success: false,
          message: `Cannot retry order with status: ${pendingOrder.status}`,
        };
      }

      // Reset for retry
      const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[0]);

      await this.prisma.pendingOrder.update({
        where: { id: pendingOrderId },
        data: {
          status: 'PENDING',
          attempts: 0,
          lastError: null,
          nextRetryAt,
        },
      });

      this.logger.log(`Retrying pending order: ${pendingOrderId}`);

      return { success: true, message: 'Order queued for retry' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Process a single pending order
   *
   * @param pendingOrder - The pending order to process
   * @param parentRequestId - Parent request ID for logging
   * @returns Result of processing
   */
  private async processSingleOrder(
    pendingOrder: {
      id: string;
      orderData: unknown;
      idempotencyKey: string | null;
      attempts: number;
      maxAttempts: number;
      restaurantId: string;
    },
    parentRequestId: string,
  ): Promise<ProcessResult> {
    const requestId = `${parentRequestId}-${pendingOrder.id.substring(0, 8)}`;

    try {
      this.logger.log(
        `[${requestId}] Processing order (attempt ${pendingOrder.attempts + 1}/${pendingOrder.maxAttempts})`,
      );

      // Mark as processing
      await this.prisma.pendingOrder.update({
        where: { id: pendingOrder.id },
        data: {
          status: 'PROCESSING',
          attempts: pendingOrder.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });

      // ========================================
      // Simulate Order Creation
      // In real implementation, this would call OrdersService.createOrder
      // ========================================

      const orderData = pendingOrder.orderData as CreateOrderDto;

      // For now, we'll use a placeholder that simulates order creation
      // In production, inject OrdersService and call it directly
      const orderResult = await this.createOrderFromQueue(orderData);

      if (orderResult.success) {
        // Mark as completed
        await this.prisma.pendingOrder.update({
          where: { id: pendingOrder.id },
          data: {
            status: 'COMPLETED',
            completedOrderId: orderResult.orderId,
            nextRetryAt: null,
          },
        });

        this.logger.log(
          `[${requestId}] Order processed successfully: ${orderResult.orderNumber}`,
        );

        return {
          pendingOrderId: pendingOrder.id,
          success: true,
          orderId: orderResult.orderId,
          orderNumber: orderResult.orderNumber,
          attempts: pendingOrder.attempts + 1,
          processedAt: new Date(),
        };
      } else {
        // Handle failure
        return this.handleOrderFailure(
          pendingOrder,
          orderResult.error || 'Unknown error',
          requestId,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[${requestId}] Error processing order: ${errorMessage}`);

      return this.handleOrderFailure(pendingOrder, errorMessage, requestId);
    }
  }

  /**
   * Handle order processing failure with exponential backoff
   *
   * @param pendingOrder - The pending order
   * @param error - Error message
   * @param requestId - Request ID for logging
   * @returns Process result
   */
  private async handleOrderFailure(
    pendingOrder: {
      id: string;
      attempts: number;
      maxAttempts: number;
      errorHistory: unknown;
      orderData: unknown;
    },
    error: string,
    requestId: string,
  ): Promise<ProcessResult> {
    const newAttempts = pendingOrder.attempts + 1;
    const errorHistory = (pendingOrder.errorHistory as ErrorRecord[]) || [];

    // Add error to history
    errorHistory.push({
      timestamp: new Date(),
      error,
      attempt: newAttempts,
    });

    // Keep only last 10 errors
    const trimmedErrorHistory = errorHistory.slice(-10);

    // Check if max attempts reached
    if (newAttempts >= pendingOrder.maxAttempts) {
      await this.prisma.pendingOrder.update({
        where: { id: pendingOrder.id },
        data: {
          status: 'FAILED',
          lastError: error,
          errorHistory: trimmedErrorHistory as Prisma.JsonObject,
          nextRetryAt: null,
        },
      });

      this.logger.error(
        `[${requestId}] Order failed permanently after ${newAttempts} attempts: ${error}`,
      );

      return {
        pendingOrderId: pendingOrder.id,
        success: false,
        attempts: newAttempts,
        error,
        processedAt: new Date(),
      };
    }

    // Calculate next retry time with exponential backoff
    const delayIndex = Math.min(
      newAttempts - 1,
      RETRY_DELAYS_MS.length - 1,
    );
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[delayIndex]);

    await this.prisma.pendingOrder.update({
      where: { id: pendingOrder.id },
      data: {
        status: 'PENDING',
        lastError: error,
        errorHistory: trimmedErrorHistory as Prisma.JsonObject,
        nextRetryAt,
      },
    });

    this.logger.warn(
      `[${requestId}] Order failed, will retry at ${nextRetryAt.toISOString()}: ${error}`,
    );

    return {
      pendingOrderId: pendingOrder.id,
      success: false,
      attempts: newAttempts,
      error,
      processedAt: new Date(),
    };
  }

  /**
   * Create order from queued data
   *
   * This is a placeholder that should be replaced with actual OrdersService call
   * In production, inject OrdersService via dependency injection
   *
   * @param orderData - Order data from queue
   * @returns Order creation result
   */
  private async createOrderFromQueue(
    orderData: CreateOrderDto,
  ): Promise<{
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    error?: string;
  }> {
    try {
      // In production, call the actual OrdersService
      // For now, simulate successful order creation
      const orderId = this.generateOrderId();
      const orderNumber = `ORD-${Date.now()}-${orderId.substring(0, 4).toUpperCase()}`;

      // TODO: Replace with actual order creation
      // const orderService = this.ordersService;
      // const result = await orderService.createOrder(orderData);
      // return { success: true, orderId: result.id, orderNumber: result.orderNumber };

      return {
        success: true,
        orderId,
        orderNumber,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order creation failed',
      };
    }
  }

  /**
   * Start periodic queue processing
   *
   * Processes the queue every 30 seconds to catch any orders
   * that were missed or need retry
   */
  private startPeriodicProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      try {
        const status = await this.getQueueStatus();
        if (status.pending > 0) {
          this.logger.debug(
            `Periodic queue check: ${status.pending} pending orders`,
          );
          await this.processQueue(10); // Process up to 10 orders per cycle
        }
      } catch (error) {
        this.logger.error(
          `Periodic queue processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop periodic queue processing
   *
   * Call this on module destroy to prevent memory leaks
   */
  stopPeriodicProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.log('Stopped periodic queue processing');
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Generate a unique request ID for logging
   */
  private generateRequestId(): string {
    return `Q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Generate a unique order ID
   */
  private generateOrderId(): string {
    return `ord_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 12)}`;
  }

  /**
   * Clean up expired orders
   *
   * Orders older than MAX_ORDER_AGE_HOURS are marked as expired
   * This should be called periodically (e.g., daily cleanup job)
   */
  async cleanupExpiredOrders(): Promise<number> {
    const cutoff = new Date(
      Date.now() - MAX_ORDER_AGE_HOURS * 60 * 60 * 1000,
    );

    const result = await this.prisma.pendingOrder.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'EXPIRED',
        lastError: 'Order expired after 24 hours without processing',
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired orders`);
    return result.count;
  }

  /**
   * Get queue statistics for monitoring
   *
   * @param restaurantId - Optional restaurant ID to filter by
   * @returns Queue statistics
   */
  async getQueueStats(
    restaurantId?: string,
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    avgAttempts: number;
    successRate: number;
  }> {
    const whereClause: Prisma.PendingOrderWhereInput = restaurantId
      ? { restaurantId }
      : {};

    const [statusCounts, sourceCounts, total, completed] = await Promise.all([
      this.prisma.pendingOrder.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { id: true },
      }),
      this.prisma.pendingOrder.groupBy({
        by: ['source'],
        where: whereClause,
        _count: { id: true },
      }),
      this.prisma.pendingOrder.count({ where: whereClause }),
      this.prisma.pendingOrder.count({
        where: { ...whereClause, status: 'COMPLETED' },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      byStatus[item.status] = item._count.id;
    }

    const bySource: Record<string, number> = {};
    for (const item of sourceCounts) {
      bySource[item.source || 'unknown'] = item._count.id;
    }

    return {
      total,
      byStatus,
      bySource,
      avgAttempts: 0, // Would need aggregation query
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}

// ==========================================
// TypeScript type for Prisma
// ==========================================

type Prisma = {
  JsonObject: Record<string, unknown>;
  PendingOrderWhereInput: Record<string, unknown>;
};
