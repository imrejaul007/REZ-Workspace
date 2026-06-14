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
import { CrmService, CustomerSegment } from './crm.service';

/**
 * Campaign DTO
 */
class CampaignDto {
  restaurantId: string;
  segment?: CustomerSegment;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  excludeChurned?: boolean;
  message: string;
}

/**
 * Sync Profile DTO
 */
class SyncProfileDto {
  userId: string;
  restaurantId: string;
  orderData: {
    totalAmount: number;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: string;
    fulfillmentType: string;
  };
}

/**
 * Add Tag DTO
 */
class AddTagDto {
  userId: string;
  restaurantId: string;
  tag: string;
}

/**
 * CRM Controller
 *
 * REST endpoints for CRM:
 * - Customer profiles
 * - Segmentation
 * - Campaign targeting
 */
@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ==========================================
  // CUSTOMER PROFILES
  // ==========================================

  /**
   * Get customer profile
   */
  @Get('profile/:userId/:restaurantId')
  async getProfile(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string
  ) {
    const profile = await this.crmService.getOrCreateProfile(userId, restaurantId);
    return {
      success: true,
      profile,
    };
  }

  /**
   * Sync profile from order
   */
  @Post('profile/sync')
  @HttpCode(HttpStatus.OK)
  async syncProfile(@Body() dto: SyncProfileDto) {
    const profile = await this.crmService.updateProfileFromOrder(
      dto.userId,
      dto.restaurantId,
      dto.orderData
    );
    return {
      success: true,
      profile,
    };
  }

  // ==========================================
  // SEGMENTS
  // ==========================================

  /**
   * Get segment statistics
   */
  @Get('segments/:restaurantId')
  async getSegmentStats(@Param('restaurantId') restaurantId: string) {
    const stats = await this.crmService.getSegmentStats(restaurantId);
    return {
      success: true,
      stats,
    };
  }

  /**
   * Get customers by segment
   */
  @Get('segments/:restaurantId/:segment')
  async getCustomersBySegment(
    @Param('restaurantId') restaurantId: string,
    @Param('segment') segment: CustomerSegment
  ) {
    const customers = await this.crmService.getCustomersBySegment(restaurantId, segment);
    return {
      success: true,
      customers,
      count: customers.length,
    };
  }

  // ==========================================
  // CAMPAIGNS
  // ==========================================

  /**
   * Get campaign targets
   */
  @Get('campaigns/targets')
  async getCampaignTargets(
    @Query('restaurantId') restaurantId: string,
    @Query('segment') segment?: CustomerSegment,
    @Query('minLifetimeValue') minLifetimeValue?: string,
    @Query('maxLifetimeValue') maxLifetimeValue?: string,
    @Query('excludeChurned') excludeChurned?: string
  ) {
    const targets = await this.crmService.getCampaignTargets(restaurantId, {
      segment,
      minLifetimeValue: minLifetimeValue ? parseFloat(minLifetimeValue) : undefined,
      maxLifetimeValue: maxLifetimeValue ? parseFloat(maxLifetimeValue) : undefined,
      excludeChurned: excludeChurned === 'true',
    });

    return {
      success: true,
      targets,
      count: targets.length,
    };
  }

  // ==========================================
  // SIMILAR CUSTOMERS
  // ==========================================

  /**
   * Get similar customers
   */
  @Get('similar/:userId/:restaurantId')
  async getSimilarCustomers(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Query('limit') limit?: string
  ) {
    const similar = await this.crmService.getSimilarCustomers(
      userId,
      restaurantId,
      limit ? parseInt(limit, 10) : 10
    );

    return {
      success: true,
      similar,
      count: similar.length,
    };
  }

  // ==========================================
  // TAGS
  // ==========================================

  /**
   * Add tag to customer
   */
  @Post('tags/add')
  @HttpCode(HttpStatus.OK)
  async addTag(@Body() dto: AddTagDto) {
    await this.crmService.addTag(dto.userId, dto.restaurantId, dto.tag);
    return {
      success: true,
      message: 'Tag added',
    };
  }
}
