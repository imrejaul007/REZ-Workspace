/**
 * Cross-Service Integration Service
 *
 * Handles HTTP calls to other services:
 * - Marketing: conversion events, campaign triggers
 * - Ads: attribution, conversion tracking
 * - Notification: already handled via queue
 */

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('service-integration');

// Service URLs with fallbacks
const MARKETING_URL = process.env.MARKETING_SERVICE_URL || 'https://rez-marketing.onrender.com';
const ADS_URL = process.env.ADS_SERVICE_URL || 'https://rez-ads.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// Fail-closed: prevent calls if token is not configured
if (!INTERNAL_TOKEN) {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required for internal service authentication');
}

/**
 * Send conversion event to marketing service
 * Triggers: welcome campaigns, upsell sequences, loyalty programs
 */
export async function notifyMarketingConversion(order: {
  userId: string;
  orderId: string;
  orderNumber: string;
  total: number;
  items: Array<{ name?: string; quantity: number; price: number }>;
  merchantId?: string;
}): Promise<void> {
  try {
    await fetch(`${MARKETING_URL}/api/events/conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        eventType: 'order.completed',
        userId: order.userId,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        total: order.total,
        items: order.items.map(i => ({
          name: i.name || 'Unknown',
          quantity: i.quantity,
          price: i.price,
        })),
        merchantId: order.merchantId,
        timestamp: new Date().toISOString(),
      }),
    });
    logger.info('[Marketing] Conversion event sent', { orderId: order.orderId });
  } catch (err) {
    logger.warn('[Marketing] Failed to send conversion event', { error: (err as Error).message, orderId: order.orderId });
  }
}

/**
 * Send conversion event to ads service
 * Triggers: attribution, retargeting updates, conversion tracking
 */
export async function notifyAdsConversion(order: {
  userId: string;
  orderId: string;
  total: number;
  merchantId?: string;
}): Promise<void> {
  try {
    await fetch(`${ADS_URL}/api/events/conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        eventType: 'conversion',
        userId: order.userId,
        orderId: order.orderId,
        value: order.total,
        merchantId: order.merchantId,
        timestamp: new Date().toISOString(),
      }),
    });
    logger.info('[Ads] Conversion event sent', { orderId: order.orderId });
  } catch (err) {
    logger.warn('[Ads] Failed to send conversion event', { error: (err as Error).message, orderId: order.orderId });
  }
}

/**
 * Send cart abandonment event to marketing
 * For users who added to cart but didn't checkout
 */
export async function notifyCartAbandonment(userId: string, cartId: string, items: Array<{ name: string; price: number }>): Promise<void> {
  try {
    await fetch(`${MARKETING_URL}/api/events/abandonment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        eventType: 'cart.abandoned',
        userId,
        cartId,
        items,
        timestamp: new Date().toISOString(),
      }),
    });
    logger.info('[Marketing] Cart abandonment event sent', { cartId });
  } catch (err) {
    logger.warn('[Marketing] Failed to send abandonment event', { error: (err as Error).message, cartId });
  }
}
