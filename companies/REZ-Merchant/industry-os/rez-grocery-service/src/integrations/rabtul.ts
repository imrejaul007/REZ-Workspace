/**
 * RABTUL SDK Integration for REZ Grocery Service
 *
 * This module provides integration with the RABTUL SDK for:
 * - SMS notifications for expiry alerts
 * - WhatsApp notifications for low stock alerts to merchants
 * - JWT validation via auth service
 * - Intent tracking for grocery orders
 *
 * SDK Documentation: /RABTUL-Technologies/REZ-connector-sdk/
 */

import { REZ } from '@rez/sdk';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// RABTUL SDK Configuration
const RABTUL_CONFIG = {
  apiKey: process.env.RABTUL_SDK_API_KEY || 'dev-api-key',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  timeout: parseInt(process.env.RABTUL_SDK_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.RABTUL_SDK_RETRIES || '3', 10),
};

// Service URLs
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
  intent: process.env.INTENT_SERVICE_URL || 'http://localhost:4006',
};

// Initialize RABTUL SDK Client
const rezClient = new REZ(RABTUL_CONFIG);

const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// Notification Connector
// ============================================

export interface ExpiryAlertData {
  merchantId: string;
  merchantPhone: string;
  merchantName: string;
  productId: string;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  currentStock: number;
  severity: 'critical' | 'urgent' | 'warning' | 'info';
}

export interface LowStockAlertData {
  merchantId: string;
  merchantPhone: string;
  merchantName: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  category: string;
}

/**
 * Send SMS notification for product expiry alert
 */
export async function sendExpiryAlertSMS(
  data: ExpiryAlertData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let urgencyMessage: string;
    switch (data.severity) {
      case 'critical':
        urgencyMessage = 'URGENT: Expires today!';
        break;
      case 'urgent':
        urgencyMessage = `Expires in ${data.daysUntilExpiry} days`;
        break;
      case 'warning':
        urgencyMessage = `Expiring soon (${data.daysUntilExpiry} days)`;
        break;
      default:
        urgencyMessage = `${data.daysUntilExpiry} days until expiry`;
    }

    const message = `[REZ Grocery] ${urgencyMessage}\n` +
      `Product: ${data.productName}\n` +
      `Batch: ${data.productId}\n` +
      `Expiry: ${data.expiryDate.toLocaleDateString('en-IN')}\n` +
      `Stock: ${data.currentStock} units\n` +
      `Action: Review and mark down or dispose`;

    const result = await rezClient.notifications.send({
      user_id: data.merchantId,
      channel: 'sms',
      title: 'Product Expiry Alert',
      body: message,
      data: {
        productId: data.productId,
        type: 'expiry_alert',
        severity: data.severity,
      },
    });

    logger.info('Expiry alert SMS sent', {
      productId: data.productId,
      merchantId: data.merchantId,
      severity: data.severity,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send expiry alert SMS', {
      error,
      productId: data.productId,
      merchantId: data.merchantId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp notification for low stock alert to merchant
 */
export async function sendLowStockWhatsApp(
  data: LowStockAlertData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const stockStatus = data.currentStock === 0 ? 'OUT OF STOCK' :
      data.currentStock <= Math.ceil(data.reorderLevel * 0.5) ? 'CRITICALLY LOW' : 'LOW STOCK';

    const message = `🛒 *${stockStatus} Alert*\n\n` +
      `Product: ${data.productName}\n` +
      `Category: ${data.category}\n` +
      `Current Stock: ${data.currentStock}\n` +
      `Reorder Level: ${data.reorderLevel}\n\n` +
      `Please restock soon to avoid stockouts.`;

    const result = await rezClient.notifications.send({
      user_id: data.merchantId,
      channel: 'whatsapp',
      title: 'Low Stock Alert',
      body: message,
      data: {
        productId: data.productId,
        type: 'low_stock_alert',
        stockStatus,
      },
    });

    logger.info('Low stock WhatsApp alert sent', {
      productId: data.productId,
      merchantId: data.merchantId,
      currentStock: data.currentStock,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send low stock WhatsApp alert', {
      error,
      productId: data.productId,
      merchantId: data.merchantId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Auth Connector (JWT Validation)
// ============================================

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'manager' | 'cashier' | 'service';
  merchantId?: string;
  storeId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Enhanced JWT validation using RABTUL Auth Service
 */
export async function validateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // In development without JWT_SECRET, decode only
  if (!JWT_SECRET) {
    logger.warn('[Auth] JWT_SECRET not configured, using decode-only mode');
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded) {
        req.user = decoded;
        next();
        return;
      }
    } catch {
      // Fall through
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  // Verify with JWT_SECRET
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error('[Auth] Token verification failed:', err.message);
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as JWTPayload;
    next();
  });
}

// ============================================
// Intent Tracking
// ============================================

export interface GroceryOrderEventData {
  customerId: string;
  merchantId: string;
  orderId: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  totalAmount: number;
  currency: string;
  action: 'created' | 'updated' | 'completed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

/**
 * Track grocery order events for intent analysis
 */
export async function trackGroceryOrderEvent(
  data: GroceryOrderEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const eventPayload = {
      user_id: data.customerId,
      event_type: 'grocery_order',
      action: data.action,
      properties: {
        order_id: data.orderId,
        merchant_id: data.merchantId,
        products: data.products,
        total_amount: data.totalAmount,
        currency: data.currency,
        product_count: data.products.length,
        categories: [...new Set(data.products.map(p => p.category))],
        ...data.metadata,
      },
      timestamp: new Date().toISOString(),
    };

    const result = await fetch(`${SERVICE_URLS.intent}/api/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RABTUL_SDK_API_KEY || 'dev-key'}`,
      },
      body: JSON.stringify(eventPayload),
    });

    if (!result.ok) {
      logger.warn('Intent tracking failed', {
        status: result.status,
        orderId: data.orderId,
      });
      return { success: false, error: 'Intent service returned error' };
    }

    const responseData = await result.json();
    logger.info('Grocery order event tracked', {
      orderId: data.orderId,
      action: data.action,
      eventId: responseData.eventId,
    });

    return { success: true, eventId: responseData.eventId };
  } catch (error) {
    logger.error('Failed to track grocery order event', {
      error,
      orderId: data.orderId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Expiry Tracker Integration
// ============================================

/**
 * Enhanced expiry tracker with RABTUL notifications
 */
export async function processExpiryAlerts(
  products: Array<{
    productId: string;
    productName: string;
    merchantId: string;
    expiryDate: Date;
    stock: number;
    reorderLevel: number;
  }>
): Promise<{
  processed: number;
  notificationsSent: number;
  failed: number;
  results: Array<{ productId: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ productId: string; success: boolean; error?: string }> = [];
  let notificationsSent = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (product.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: 'critical' | 'urgent' | 'warning' | 'info';
      if (daysUntilExpiry <= 0) {
        severity = 'critical';
      } else if (daysUntilExpiry <= 3) {
        severity = 'urgent';
      } else if (daysUntilExpiry <= 7) {
        severity = 'warning';
      } else {
        severity = 'info';
      }

      // Only send for critical, urgent, and warning
      if (severity !== 'info') {
        const result = await sendExpiryAlertSMS({
          merchantId: product.merchantId,
          merchantPhone: '', // Will be fetched from merchant profile
          merchantName: '',
          productId: product.productId,
          productName: product.productName,
          expiryDate: product.expiryDate,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
          currentStock: product.stock,
          severity,
        });

        if (result.success) {
          notificationsSent++;
        } else {
          failed++;
        }
        results.push({ productId: product.productId, success: result.success, error: result.error });
      } else {
        results.push({ productId: product.productId, success: true });
      }
    } catch (error) {
      failed++;
      results.push({
        productId: product.productId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    processed: products.length,
    notificationsSent,
    failed,
    results,
  };
}

// ============================================
// Service Export
// ============================================

export const rabtul = {
  notifications: {
    sendExpiryAlertSMS,
    sendLowStockWhatsApp,
    client: rezClient.notifications,
  },
  auth: {
    validateJWT,
  },
  intent: {
    trackEvent: trackGroceryOrderEvent,
  },
  expiry: {
    processAlerts: processExpiryAlerts,
  },
  config: RABTUL_CONFIG,
  urls: SERVICE_URLS,
};

export default rabtul;