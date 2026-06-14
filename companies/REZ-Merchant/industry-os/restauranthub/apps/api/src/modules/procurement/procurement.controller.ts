import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProcurementService } from './procurement.service';

/**
 * Create RFQ DTO
 */
class CreateRFQDto {
  restaurantId: string;
  items: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    requiredQuantity: number;
    unit: string;
  }>;
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Procurement Controller
 *
 * REST endpoints for procurement:
 * - Create RFQ
 * - Check RFQ status
 * - Get reorder recommendations
 */
@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  /**
   * Create RFQ (Request for Quote)
   */
  @Post('rfq')
  @HttpCode(HttpStatus.CREATED)
  async createRFQ(@Body() dto: CreateRFQDto) {
    const result = await this.procurementService.createRFQ({
      restaurantId: dto.restaurantId,
      items: dto.items,
      urgency: dto.urgency,
      notes: dto.notes,
    });

    return {
      success: result.success,
      rfqId: result.rfqId,
      message: result.message,
      estimatedCost: result.estimatedCost,
      suppliersNotified: result.suppliersNotified,
    };
  }

  /**
   * Get RFQ status
   */
  @Get('rfq/:rfqId')
  async getRFQStatus(@Param('rfqId') rfqId: string) {
    const status = await this.procurementService.getRFQStatus(rfqId);
    return {
      success: true,
      ...status,
    };
  }

  /**
   * Get reorder recommendations
   */
  @Get('reorder/:restaurantId')
  async getReorderRecommendations(
    @Param('restaurantId') restaurantId: string,
    @Query('days') days?: string
  ) {
    const recommendations = await this.procurementService.getReorderRecommendations(
      restaurantId,
      days ? parseInt(days, 10) : 7
    );

    return {
      success: true,
      recommendations,
      count: recommendations.length,
    };
  }

  /**
   * Get preferred suppliers
   */
  @Get('suppliers/:restaurantId')
  async getPreferredSuppliers(
    @Param('restaurantId') restaurantId: string,
    @Query('category') category?: string
  ) {
    const suppliers = await this.procurementService.getPreferredSuppliers(restaurantId, category);

    return {
      success: true,
      suppliers,
      count: suppliers.length,
    };
  }

  /**
   * Create purchase order
   */
  @Post('purchase-orders')
  @HttpCode(HttpStatus.CREATED)
  async createPurchaseOrder(
    @Body()
    dto: {
      rfqId: string;
      quoteId: string;
      deliveryAddress: string;
    }
  ) {
    const result = await this.procurementService.createPurchaseOrder(
      dto.rfqId,
      dto.quoteId,
      dto.deliveryAddress
    );

    return {
      success: result.success,
      poId: result.poId,
      message: result.message,
    };
  }
}
