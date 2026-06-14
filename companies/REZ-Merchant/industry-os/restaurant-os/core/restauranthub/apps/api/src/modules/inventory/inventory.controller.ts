import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * POST /inventory/deduct
   * Deduct inventory when an order is placed
   */
  @Post('deduct')
  async deductInventory(@Body() body: {
    restaurantId: string;
    items: Array<{ productId: string; quantity: number }>;
    orderId: string;
    orderNumber: string;
  }) {
    if (!body.restaurantId || !body.items || !body.orderId) {
      throw new BadRequestException('restaurantId, items, and orderId are required');
    }

    return this.inventoryService.deductInventory(body);
  }

  /**
   * GET /inventory/batches?restaurantId=xxx
   * Returns all InventoryBatch records for the restaurant.
   * The restaurantId can come from the query param or from the JWT payload.
   */
  @Get('batches')
  async getBatches(@Request() req, @Query('restaurantId') qRestaurantId?: string) {
    const restaurantId =
      qRestaurantId ?? req.user?.restaurantId ?? req.user?.rezMerchantId;

    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    return this.inventoryService.getBatchesForRestaurant(restaurantId);
  }

  /**
   * GET /inventory/movements?restaurantId=xxx&limit=50
   * Returns recent StockMovement records for the restaurant.
   */
  @Get('movements')
  async getMovements(
    @Request() req,
    @Query('restaurantId') qRestaurantId?: string,
    @Query('limit') limitStr?: string,
  ) {
    const restaurantId =
      qRestaurantId ?? req.user?.restaurantId ?? req.user?.rezMerchantId;

    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.inventoryService.getStockMovementsForRestaurant(restaurantId, limit);
  }
}
