/**
 * NextaBizz Webhook Service
 *
 * Sends inventory and order webhooks TO nextaBizz platform.
 * This enables ReStopapa to act as a data source for nextaBizz procurement.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface InventorySignalPayload {
  event: 'inventory.low_stock' | 'inventory.out_of_stock' | 'inventory.stock_updated';
  timestamp: string;
  merchantId: string;
  locationId?: string;
  data: {
    productId: string;
    productName: string;
    sku?: string;
    category?: string;
    previousStock?: number;
    currentStock: number;
    minStock?: number;
    threshold?: number;
    unit: string;
  };
}

export interface OrderPayload {
  event: 'order.status_changed' | 'order.created';
  timestamp: string;
  merchantId: string;
  locationId?: string;
  data: {
    orderId: string;
    orderNumber: string;
    previousStatus?: string;
    newStatus: string;
    updatedAt: string;
  };
}

@Injectable()
export class NextaBizzWebhookService {
  private readonly logger = new Logger(NextaBizzWebhookService.name);
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get('NEXTABIZZ_WEBHOOK_URL', '');
    this.webhookSecret = this.configService.get('NEXTABIZZ_WEBHOOK_SECRET', '');

    if (!this.webhookUrl) {
      this.logger.warn('NEXTABIZZ_WEBHOOK_URL not configured - webhooks will be logged only');
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, timestamp: string): string {
    const signaturePayload = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signaturePayload)
      .digest('hex');
  }

  /**
   * Send webhook to nextaBizz
   */
  private async sendWebhook<T extends InventorySignalPayload | OrderPayload>(
    payload: T,
    retries = 3,
  ): Promise<{ success: boolean; message: string }> {
    const timestamp = new Date().toISOString();
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, timestamp);

    // Always log the webhook
    this.logger.log(`[NextaBizz Webhook] ${payload.event} for merchant ${payload.merchantId}`);

    // If no webhook URL configured, just log
    if (!this.webhookUrl) {
      this.logger.debug(`[NextaBizz Webhook] Would send: ${payloadString}`);
      return { success: true, message: 'Logged only (webhook URL not configured)' };
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': timestamp,
            'X-Webhook-Source': 'restopapa',
          },
          body: payloadString,
        });

        if (response.ok) {
          this.logger.log(`[NextaBizz Webhook] Success for ${payload.event}`);
          return { success: true, message: 'Webhook delivered successfully' };
        }

        const errorBody = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errorBody}`);

        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          this.logger.error(`[NextaBizz Webhook] Client error: ${errorBody}`);
          break;
        }
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`[NextaBizz Webhook] Attempt ${attempt} failed: ${lastError.message}`);
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    this.logger.error(`[NextaBizz Webhook] Failed after ${retries} attempts: ${lastError?.message}`);
    return { success: false, message: lastError?.message || 'Unknown error' };
  }

  /**
   * Send inventory low stock signal
   */
  async sendLowStockAlert(
    merchantId: string,
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
    sku?: string,
    category?: string,
    unit = 'units',
  ): Promise<{ success: boolean; message: string }> {
    const payload: InventorySignalPayload = {
      event: 'inventory.low_stock',
      timestamp: new Date().toISOString(),
      merchantId,
      data: {
        productId,
        productName,
        sku,
        category,
        currentStock,
        minStock,
        unit,
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Send out of stock signal
   */
  async sendOutOfStockAlert(
    merchantId: string,
    productId: string,
    productName: string,
    sku?: string,
    category?: string,
    unit = 'units',
  ): Promise<{ success: boolean; message: string }> {
    const payload: InventorySignalPayload = {
      event: 'inventory.out_of_stock',
      timestamp: new Date().toISOString(),
      merchantId,
      data: {
        productId,
        productName,
        sku,
        category,
        currentStock: 0,
        unit,
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Send stock updated signal
   */
  async sendStockUpdated(
    merchantId: string,
    productId: string,
    productName: string,
    previousStock: number,
    currentStock: number,
    sku?: string,
    category?: string,
    unit = 'units',
  ): Promise<{ success: boolean; message: string }> {
    const payload: InventorySignalPayload = {
      event: 'inventory.stock_updated',
      timestamp: new Date().toISOString(),
      merchantId,
      data: {
        productId,
        productName,
        sku,
        category,
        previousStock,
        currentStock,
        unit,
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Send order status change
   */
  async sendOrderStatusChanged(
    merchantId: string,
    orderId: string,
    orderNumber: string,
    previousStatus: string | undefined,
    newStatus: string,
  ): Promise<{ success: boolean; message: string }> {
    const payload: OrderPayload = {
      event: 'order.status_changed',
      timestamp: new Date().toISOString(),
      merchantId,
      data: {
        orderId,
        orderNumber,
        previousStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.sendWebhook(payload);
  }
}
