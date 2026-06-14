/**
 * Prometheus Metrics for POS Loyalty Integration
 */

import { Counter, Histogram, Gauge } from 'prom-client';

// ============================================
// METRICS
// ============================================

// Request counter
export const httpRequestsTotal = new Counter({
  name: 'pos_loyalty_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Request duration
export const httpRequestDuration = new Histogram({
  name: 'pos_loyalty_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Coins awarded
export const coinsAwardedTotal = new Counter({
  name: 'pos_loyalty_coins_awarded_total',
  help: 'Total coins awarded',
  labelNames: ['merchant_id', 'tier', 'payment_method'],
});

// Transactions processed
export const transactionsTotal = new Counter({
  name: 'pos_loyalty_transactions_total',
  help: 'Total transactions processed',
  labelNames: ['pos_type', 'merchant_id'],
});

// Active merchants gauge
export const activeMerchantsGauge = new Gauge({
  name: 'pos_loyalty_active_merchants',
  help: 'Number of active merchants',
});

// Customer balance gauge
export const customerBalanceGauge = new Gauge({
  name: 'pos_loyalty_customer_balance',
  help: 'Customer coin balance',
  labelNames: ['tier'],
});

// QR scans
export const qrScansTotal = new Counter({
  name: 'pos_loyalty_qr_scans_total',
  help: 'Total QR scans',
  labelNames: ['scan_type', 'merchant_id'],
});

// Redemption
export const redemptionsTotal = new Counter({
  name: 'pos_loyalty_redemptions_total',
  help: 'Total redemptions',
  labelNames: ['merchant_id'],
});

// Errors
export const errorsTotal = new Counter({
  name: 'pos_loyalty_errors_total',
  help: 'Total errors',
  labelNames: ['type', 'operation'],
});

// ============================================
// HELPERS
// ============================================

export function recordSale(
  merchantId: string,
  tier: string,
  paymentMethod: string,
  coinsEarned: number
): void {
  coinsAwardedTotal.inc({ merchant_id: merchantId, tier, payment_method: paymentMethod }, coinsEarned);
}

export function recordTransaction(posType: string, merchantId: string): void {
  transactionsTotal.inc({ pos_type: posType, merchant_id: merchantId });
}

export function recordScan(scanType: string, merchantId: string): void {
  qrScansTotal.inc({ scan_type: scanType, merchant_id: merchantId });
}

export function recordError(type: string, operation: string): void {
  errorsTotal.inc({ type, operation });
}

// ============================================
// METRICS ENDPOINT
// ============================================

export async function getMetrics(): Promise<string> {
  const { register } = await import('prom-client');
  return register.metrics();
}

export function getContentType(): string {
  return 'text/plain; version=0.0.4; charset=utf-8';
}
