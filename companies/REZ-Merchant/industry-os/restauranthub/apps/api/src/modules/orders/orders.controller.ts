import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    // Ensure user can only create orders for their own restaurant
    if (createOrderDto.restaurantId !== restaurantId) {
      throw new ForbiddenException('Cannot create orders for other restaurants');
    }
    this.logger.log(`Creating order for restaurant ${createOrderDto.restaurantId}`);
    const result = await this.ordersService.createOrder(createOrderDto);
    return result;
  }

  @Get()
  async getOrders(
    @Query() query: OrderQueryDto,
    @Request() req,
  ) {
    // restaurantId is now populated by JwtStrategy from the restaurant relation
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    this.logger.log(`Fetching orders for restaurant ${restaurantId}`);
    return this.ordersService.getOrders(restaurantId, query);
  }

  @Get(':id')
  async getOrderById(@Param('id') orderId: string, @Request() req) {
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    this.logger.log(`Fetching order ${orderId}`);
    return this.ordersService.getOrderById(orderId, restaurantId);
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    this.logger.log(`Updating order ${orderId} status to ${updateDto.status}`);
    return this.ordersService.updateOrderStatus(orderId, updateDto, restaurantId);
  }
}
