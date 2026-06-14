import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  VendorProductsService,
  CreateProductDto,
  UpdateProductDto,
} from './vendor-products.service';

@Controller('vendor')
@UseGuards(JwtAuthGuard)
export class VendorProductsController {
  constructor(private readonly vendorProductsService: VendorProductsService) {}

  @Get('stats')
  async getVendorStats(@Request() req) {
    return this.vendorProductsService.getVendorStats(req.user.id);
  }

  @Get('products')
  async listProducts(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.vendorProductsService.listProducts(req.user.id, page, limit);
  }

  @Post('products')
  async createProduct(
    @Request() req,
    @Body() dto: CreateProductDto,
  ) {
    return this.vendorProductsService.createProduct(req.user.id, dto);
  }

  @Get('products/:id')
  async getProduct(@Request() req, @Param('id') id: string) {
    return this.vendorProductsService.getProduct(req.user.id, id);
  }

  @Patch('products/:id')
  async updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.vendorProductsService.updateProduct(req.user.id, id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Request() req, @Param('id') id: string) {
    return this.vendorProductsService.deleteProduct(req.user.id, id);
  }
}
