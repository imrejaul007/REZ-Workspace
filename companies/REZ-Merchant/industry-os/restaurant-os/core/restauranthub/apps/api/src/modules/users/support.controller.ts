import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

class CreateTicketDto {
  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  category?: string;
}

class ContactDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  @MinLength(1)
  subject!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async contact(@Body() dto: ContactDto) {
    this.logger.log(
      `Contact form submission — from: ${dto.email}, subject: "${dto.subject}", category: ${dto.category ?? 'none'}`,
    );
    this.logger.log(
      `Message from ${dto.name} (${dto.company ?? 'no company'}): ${dto.message}`,
    );
    return { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' };
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  async listTickets(@Request() req) {
    this.logger.log(`Ticket list requested by user ${req.user.sub}`);
    return this.prisma.supportTicket.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    this.logger.log(
      `Support ticket created by user ${req.user.sub} — subject: "${dto.subject}"`,
    );
    return this.prisma.supportTicket.create({
      data: {
        userId: req.user.sub,
        subject: dto.subject,
        description: dto.description,
        status: 'open',
        priority: 'medium',
      },
    });
  }

  @Get('articles')
  async getHelpArticles() {
    return [
      {
        id: 'article-001',
        title: 'How to post a job listing on RestoPapa',
        content:
          'To post a job, log in as a Restaurant owner and navigate to Jobs > New Job. Fill in the title, description, required skills, salary range, and location. Set the validity date and click Publish. Your listing will be visible to verified employees immediately.',
      },
      {
        id: 'article-002',
        title: 'How to place a bulk ingredient order from a vendor',
        content:
          'From your dashboard, go to Marketplace > Suppliers. Browse or search for a supplier by category or city. Click their profile and select Request Quote (RFQ). Specify the product, quantity, and delivery frequency. The vendor will respond with pricing within 24 hours.',
      },
      {
        id: 'article-003',
        title: 'How to manage your restaurant menu',
        content:
          'Go to Menu Management in your sidebar. You can create menu categories (e.g., Starters, Mains, Desserts) and add items under each. Each item supports a name, description, images, price, and dietary tags. Changes publish instantly to your POS and online ordering page.',
      },
      {
        id: 'article-004',
        title: 'How to verify your vendor or restaurant account',
        content:
          'Verification unlocks full platform access including payments and order fulfillment. Upload your GST certificate, FSSAI license (for restaurants), or business registration document in Settings > Verification. Our team reviews submissions within 1–2 business days.',
      },
      {
        id: 'article-005',
        title: 'How to track and manage incoming orders',
        content:
          'All incoming orders appear in Orders > Active. Each order shows items, total amount, and the buyer restaurant. You can update the order status through Confirmed, Preparing, Shipped, and Delivered stages. Buyers are notified at each step automatically.',
      },
    ];
  }
}
