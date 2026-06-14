import { v4 as uuidv4 } from 'uuid';

export function generateUUID(): string {
  return uuidv4();
}

export function generatePublisherId(): string {
  return `pub_${uuidv4()}`;
}

export function generatePlacementId(): string {
  return `plc_${uuidv4()}`;
}

export function generateEventId(): string {
  return `evt_${uuidv4()}`;
}

export function generateAPIKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateEarnings(impressions: number, cpm: number, payoutRate: number): number {
  return (impressions / 1000) * cpm * payoutRate;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
