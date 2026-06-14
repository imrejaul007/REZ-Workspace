import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CreditService } from '../services/credit.service';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  async findAll(@Query() query: any) {
    const { userId, page = '1', limit = '10' } = query;
    return this.creditService.getCreditHistory(userId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('balance/:userId')
  async getBalance(@Param('userId') userId: string) {
    const balance = await this.creditService.getCreditBalance(userId);
    return { balance };
  }

  @Post('add')
  async addCredit(@Body() body: { userId: string; amount: number; description: string }) {
    return this.creditService.addCredit(body.userId, body.amount, body.description);
  }

  @Post('deduct')
  async deductCredit(@Body() body: { userId: string; amount: number; description: string; orderId?: string }) {
    return this.creditService.deductCredit(body.userId, body.amount, body.description, body.orderId);
  }
}
