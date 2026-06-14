import { Controller, Post, Get, Delete, Body, Param, Headers, UnauthorizedException, HttpCode } from '@nestjs/common';
import { WebhookService, WebhookEvent } from './webhook.service';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Handle incoming webhook events
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() body: WebhookEvent,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-id') webhookId: string,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature
    if (!this.verifySignature(body, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    await this.webhookService.processEvent({
      ...body,
      timestamp: new Date(),
      source: webhookId || 'api',
    });

    return { received: true };
  }

  /**
   * Get all registered webhooks
   */
  @Get()
  async getWebhooks(): Promise<any[]> {
    return this.webhookService.getWebhooks();
  }

  /**
   * Register a new webhook endpoint
   */
  @Post('register')
  async registerWebhook(
    @Body() body: { endpoint: string; events: string[] },
  ): Promise<{ id: string }> {
    const secret = crypto.randomBytes(32).toString('hex');
    const id = await this.webhookService.registerWebhook(body.endpoint, body.events, secret);
    return { id };
  }

  /**
   * Unregister a webhook endpoint
   */
  @Delete(':id')
  async unregisterWebhook(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.webhookService.unregisterWebhook(id);
    return { success: true };
  }

  /**
   * Verify webhook signature using HMAC
   */
  private verifySignature(body: any, signature: string): boolean {
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Check buffer lengths match before timing-safe comparison
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Use timing-safe comparison
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  }
}
