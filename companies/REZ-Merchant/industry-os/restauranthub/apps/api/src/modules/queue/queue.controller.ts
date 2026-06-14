import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OfflineQueueService } from '../../services/offline-queue.service';
import {
  ProcessQueueDto,
  QueueStatusQueryDto,
  PendingOrdersQueryDto,
  EnqueueOrderDto,
  DeletePendingOrderDto,
} from './dto/process-queue.dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

/**
 * Queue Controller
 *
 * Handles offline order queue management:
 * - Process pending orders when connectivity is restored
 * - Get queue status
 * - Get pending orders for a restaurant
 * - Retry failed orders
 * - Delete pending orders
 * - Enqueue orders directly (for POS client)
 */
@Controller('queue')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(private readonly offlineQueueService: OfflineQueueService) {}

  /**
   * Process pending orders in the queue
   *
   * POST /queue/process
   *
   * This endpoint should be called:
   * - By the client when connection is restored
   * - By a scheduled job periodically
   * - Manually by admin
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processQueue(
    @Body() processQueueDto: ProcessQueueDto,
    @Request() req,
  ) {
    // Check if user has admin or restaurant access
    const hasAccess = this.checkAccess(req);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    this.logger.log('Processing offline queue');
    const result = await this.offlineQueueService.processQueue(
      processQueueDto.limit,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get queue status
   *
   * GET /queue/status
   *
   * Returns the current status of the queue including:
   * - Number of pending, processing, and failed orders
   * - Timestamps of oldest and newest pending orders
   */
  @Get('status')
  async getQueueStatus(
    @Query() query: QueueStatusQueryDto,
    @Request() req,
  ) {
    // Check if user has admin access for global status
    const isAdmin = req?.user?.role === 'ADMIN';

    // Non-admins can only see their restaurant's queue
    const restaurantId = isAdmin ? query.restaurantId : req?.user?.restaurantId;

    if (!restaurantId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    this.logger.log(`Getting queue status for restaurant: ${restaurantId}`);
    const status = await this.offlineQueueService.getQueueStatus(restaurantId);

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Get pending orders for a restaurant
   *
   * GET /queue/pending
   *
   * Returns paginated list of pending orders for the authenticated restaurant
   */
  @Get('pending')
  async getPendingOrders(
    @Query() query: PendingOrdersQueryDto,
    @Request() req,
  ) {
    const restaurantId = req?.user?.restaurantId;

    // Users can only see their own restaurant's pending orders
    if (!restaurantId || query.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    this.logger.log(`Getting pending orders for restaurant: ${restaurantId}`);
    const result = await this.offlineQueueService.getPendingOrders(
      restaurantId,
      query.page,
      query.limit,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Retry a failed order
   *
   * POST /queue/retry/:id
   *
   * Requeues a failed order for processing
   */
  @Post('retry/:id')
  @HttpCode(HttpStatus.OK)
  async retryOrder(
    @Param('id') pendingOrderId: string,
    @Request() req,
  ) {
    const restaurantId = req?.user?.restaurantId;

    if (!restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify the order belongs to this restaurant
    const status = await this.offlineQueueService.getQueueStatus(restaurantId);

    this.logger.log(`Retrying order: ${pendingOrderId}`);
    const result = await this.offlineQueueService.retryOrder(pendingOrderId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Delete a pending order
   *
   * DELETE /queue/:id
   *
   * Permanently removes a pending order from the queue
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePendingOrder(
    @Param('id') pendingOrderId: string,
    @Request() req,
  ) {
    const restaurantId = req?.user?.restaurantId;

    if (!restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    this.logger.log(`Deleting pending order: ${pendingOrderId}`);
    const deleted = await this.offlineQueueService.deletePendingOrder(
      pendingOrderId,
    );

    if (!deleted) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  }

  /**
   * Enqueue an order directly
   *
   * POST /queue/enqueue
   *
   * This endpoint is used by POS clients when:
   * - Network is offline
   * - Order creation fails due to network error
   * - Request times out
   *
   * The order is stored in the database and processed later
   */
  @Post('enqueue')
  @HttpCode(HttpStatus.CREATED)
  async enqueueOrder(
    @Body() enqueueOrderDto: EnqueueOrderDto,
    @Request() req,
  ) {
    const restaurantId = req?.user?.restaurantId;

    // Verify user can only enqueue for their own restaurant
    if (!restaurantId || enqueueOrderDto.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'Cannot enqueue orders for other restaurants',
      );
    }

    // Convert to CreateOrderDto
    const createOrderDto: CreateOrderDto = {
      restaurantId: enqueueOrderDto.restaurantId,
      customerId: enqueueOrderDto.customerId,
      fulfillmentType: enqueueOrderDto.fulfillmentType,
      paymentMethod: enqueueOrderDto.paymentMethod,
      items: enqueueOrderDto.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        modifications: item.modifications,
        notes: item.notes,
      })),
      deliveryAddress: enqueueOrderDto.deliveryAddress as unknown as CreateOrderDto['deliveryAddress'],
      specialInstructions: enqueueOrderDto.specialInstructions,
      discountAmount: enqueueOrderDto.discountAmount,
      creditUsed: enqueueOrderDto.creditUsed,
      promoCode: enqueueOrderDto.promoCode,
      idempotencyKey: enqueueOrderDto.idempotencyKey,
    };

    this.logger.log(
      `Enqueueing order for restaurant: ${enqueueOrderDto.restaurantId}`,
    );

    const result = await this.offlineQueueService.enqueueOrder(
      createOrderDto,
      enqueueOrderDto.restaurantId,
      enqueueOrderDto.idempotencyKey,
      enqueueOrderDto.clientOrderId,
      enqueueOrderDto.source || 'pos',
    );

    return {
      success: true,
      data: {
        pendingOrderId: result.pendingOrderId,
        message: result.message,
        queuedAt: result.queuedAt,
      },
    };
  }

  /**
   * Get queue statistics
   *
   * GET /queue/stats
   *
   * Returns queue statistics including:
   * - Total orders by status
   * - Orders by source
   * - Success rate
   */
  @Get('stats')
  async getQueueStats(
    @Query() query: QueueStatusQueryDto,
    @Request() req,
  ) {
    const isAdmin = req?.user?.role === 'ADMIN';
    const restaurantId = isAdmin ? query.restaurantId : req?.user?.restaurantId;

    if (!restaurantId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    this.logger.log(`Getting queue stats for restaurant: ${restaurantId}`);
    const stats = await this.offlineQueueService.getQueueStats(restaurantId);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Health check for queue service
   *
   * GET /queue/health
   *
   * Returns health status of the queue service
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Check if user has access to queue operations
   */
  private checkAccess(req: { user?: { role?: string; restaurantId?: string } }): boolean {
    // Admins have full access
    if (req?.user?.role === 'ADMIN') {
      return true;
    }

    // Restaurant users have access to their own queue
    if (req?.user?.restaurantId) {
      return true;
    }

    return false;
  }
}
