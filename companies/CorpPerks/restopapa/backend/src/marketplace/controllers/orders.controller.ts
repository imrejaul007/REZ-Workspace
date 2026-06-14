import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { UpdateOrderStatusDto } from '../dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query() query: any) {
    const { userId, role = 'user', page = '1', limit = '20' } = query;
    return this.ordersService.getOrders(userId, role, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.ordersService.getOrderById(id, userId || '');
  }

  @Post()
  async create(@Body() createOrderDto: any) {
    return this.ordersService.createOrder('', createOrderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: { userId: string; reason?: string }) {
    return this.ordersService.cancelOrder(id, body.userId, body.reason || 'Cancelled by user');
  }
}
