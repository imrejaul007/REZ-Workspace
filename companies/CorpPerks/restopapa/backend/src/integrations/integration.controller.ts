import logger from './utils/logger';

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IntegrationService, RestaurantData, RestaurantAnalytics } from './integration.service';
import { SyncEmployeesDto } from './dto/sync-employees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../security/rate-limit.guard';

@ApiTags('integration')
@Controller('api/v1/integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /**
   * Get restaurant data with addresses and employees
   */
  @Get('restaurant/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant data for ReZ Merchant integration' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant data retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getRestaurant(@Param('id') id: string): Promise<RestaurantData> {
    return this.integrationService.getRestaurantData(id);
  }

  /**
   * Sync employees from ReZ Merchant
   */
  @Post('employees/sync')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync employees from ReZ Merchant' })
  @ApiResponse({
    status: 200,
    description: 'Employees synced successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async syncEmployees(
    @Body() syncDto: SyncEmployeesDto,
  ): Promise<{
    created: number;
    updated: number;
    skipped: number;
    employees: Array<{
      id: string;
      fullName: string;
      email?: string;
      status: 'created' | 'updated' | 'skipped';
    }>;
  }> {
    return this.integrationService.syncEmployees(syncDto.restaurantId, syncDto);
  }

  /**
   * Get restaurant analytics for date range
   */
  @Get('analytics/:restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant analytics for ReZ Merchant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
  @ApiQuery({ name: 'start', description: 'Start date (ISO 8601)', example: '2024-01-01' })
  @ApiQuery({ name: 'end', description: 'End date (ISO 8601)', example: '2024-12-31' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getAnalytics(
    @Param('restaurantId') restaurantId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<RestaurantAnalytics> {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    return this.integrationService.getRestaurantAnalytics(restaurantId, startDate, endDate);
  }

  /**
   * Push restaurant data to ReZ Merchant
   */
  @Post('push/:restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push restaurant data to ReZ Merchant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
  @ApiResponse({
    status: 200,
    description: 'Data pushed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async pushToReZMerchant(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { endpoint: string },
  ): Promise<{
    success: boolean;
    message: string;
    data?: RestaurantData;
  }> {
    return this.integrationService.pushToReZMerchant(restaurantId, body.endpoint);
  }

  /**
   * Webhook endpoint for ReZ Merchant events
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook events from ReZ Merchant' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature (would use actual verification in production)
    const isValid = await this.integrationService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
      process.env.REZ_MERCHANT_WEBHOOK_SECRET || '',
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook based on event type
    const eventType = payload.eventType;

    switch (eventType) {
      case 'employee.updated':
        // Handle employee update from ReZ Merchant
        this.integrationService.syncEmployees(payload.restaurantId, {
          employees: [payload.data],
          restaurantId: payload.restaurantId,
        });
        break;

      case 'restaurant.updated':
        // Handle restaurant update from ReZ Merchant
        break;

      default:
        // Log unknown event type
        logger.info(`Unknown webhook event type: ${eventType}`);
    }

    return { received: true };
  }

  /**
   * Health check for integration service
   */
  @Get('health')
  @ApiOperation({ summary: 'Check integration service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
