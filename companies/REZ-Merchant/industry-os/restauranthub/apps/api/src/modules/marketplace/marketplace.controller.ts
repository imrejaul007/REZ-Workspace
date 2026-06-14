import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketplaceService } from './marketplace.service';
import type { SubmitRfqDto, RegisterVendorDto } from './marketplace.dto';

/**
 * All /marketplace/* endpoints.
 * Auth-protected routes require a valid JWT (existing RestoPapa auth).
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /** GET /marketplace/categories */
  @Get('categories')
  async getCategories(@Request() req) {
    const merchantId = req.user?.rezMerchantId ?? req.user?.id ?? 'public';
    return this.marketplaceService.getCategories(merchantId);
  }

  /**
   * GET /marketplace/suppliers
   * Query params: city, category, page, limit
   */
  @Get('suppliers')
  async getSuppliers(
    @Request() req,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const merchantId = req.user?.rezMerchantId ?? req.user?.id ?? 'public';
    return this.marketplaceService.getSuppliers(
      { city, category, page, limit },
      merchantId,
    );
  }

  /** GET /marketplace/suppliers/:id */
  @Get('suppliers/:id')
  async getSupplierById(@Param('id') id: string, @Request() req) {
    const merchantId = req.user?.rezMerchantId ?? req.user?.id ?? 'public';
    return this.marketplaceService.getSupplierById(id, merchantId);
  }

  /**
   * GET /marketplace/demand-signals
   * Query params: city, category
   */
  @Get('demand-signals')
  async getDemandSignals(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.marketplaceService.getDemandSignals(city, category);
  }

  /**
   * POST /marketplace/rfq
   * Auth required — identifies the submitting merchant.
   */
  @Post('rfq')
  @UseGuards(AuthGuard('jwt'))
  async submitRfq(@Body() body: SubmitRfqDto, @Request() req) {
    const merchantId = req.user?.rezMerchantId ?? req.user?.id;
    const restopapaUserId = req.user?.id;
    return this.marketplaceService.submitRfq(body, merchantId, restopapaUserId);
  }

  /**
   * GET /marketplace/order-history
   * Auth required — returns the calling merchant's REZ purchase orders.
   */
  @Get('order-history')
  @UseGuards(AuthGuard('jwt'))
  async getOrderHistory(@Request() req) {
    const merchantId = req.user?.rezMerchantId ?? req.user?.id;
    return this.marketplaceService.getOrderHistory(merchantId);
  }

  /**
   * POST /marketplace/vendors/register
   * Public endpoint — supplier self-registration.
   */
  @Post('vendors/register')
  async registerVendor(@Body() body: RegisterVendorDto) {
    return this.marketplaceService.registerVendor(body);
  }

  /**
   * GET /marketplace/vendor-applications
   * Admin-only endpoint — list all vendor applications.
   */
  @Get('vendor-applications')
  @UseGuards(AuthGuard('jwt'))
  async getVendorApplications(
    @Request() req,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.marketplaceService.getVendorApplications({ status, page, limit });
  }
}
