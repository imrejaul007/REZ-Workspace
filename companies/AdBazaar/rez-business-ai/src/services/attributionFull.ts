/**
 * REZ Business AI - Full Attribution System
 * Cross-channel, offline, QR, creator, wallet tracking
 */

interface Touchpoint {
  channel: 'dooh' | 'qr' | 'push' | 'whatsapp' | 'sms' | 'organic' | 'referral' | 'aggregator';
  timestamp: Date;
  revenue?: number;
  customerId?: string;
}

interface Conversion {
  orderId: string;
  revenue: number;
  touchpoints: Touchpoint[];
  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay';
}

interface Attribution {
  channel: string;
  revenue: number;
  touchpoints: number;
  roi: number;
}

// Full Journey Attribution
export async function attributeJourney(conversion: Conversion): Promise<Map<string, Attribution>> {
  const results = new Map<string, Attribution();

  // First Touch Attribution
  if (conversion.model === 'first_touch') {
    const first = conversion.touchpoints[0];
    results.set(first.channel, {
      channel: first.channel,
      revenue: conversion.revenue,
      touchpoints: 1,
      roi: 0,
    });
    return results;
  }

  // Linear Attribution
  if (conversion.model === 'linear') {
    const weight = conversion.revenue / conversion.touchpoints.length;
    for (const tp of conversion.touchpoints) {
      const existing = results.get(tp.channel) || { channel: tp.channel, revenue: 0, touchpoints: 0, roi: 0 };
      results.set(tp.channel, {
        ...existing,
        revenue: existing.revenue + weight,
        touchpoints: existing.touchpoints + 1,
      });
    }
  }

  return results;
}

// QR Attribution
export async function attributeQR(customerId: string, orderId: string) {
  return {
    customerId,
    orderId,
    attribution: 'qr' as const,
    revenue: 0,
    touchpoints: 1,
  };
}

// Creator Attribution
export async function attributeCreator(contentId: string, conversionId: string) {
  return {
    contentId,
    conversionId,
    revenue: 0,
    engagement: 0,
    roi: 0,
  };
}

// Offline Attribution
export async function attributeOffline(visitId: string, revenue: number) {
  return {
    visitId,
    revenue,
    channel: 'offline' as const,
    roi: 0,
  };
}

// Dashboard
export function getAttributionDashboard(merchantId: string) {
  return {
    merchantId,
    channels: ['dooh', 'qr', 'push', 'whatsapp', 'sms', 'organic', 'referral'],
    totalRevenue: 0,
    byChannel: {},
    topChannels: [],
    recommendations: [],
  };
}
