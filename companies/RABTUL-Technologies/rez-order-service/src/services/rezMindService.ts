/**
 * REZ Mind Service - Order Service Integration
 * Sends order events to REZ Mind Event Platform
 */

import { logger } from '../utils/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || process.env.INTENT_CAPTURE_URL?.replace('rez-intent-graph', 'rez-event-platform') || 'http://localhost:4008';

// Circuit Breaker Configuration
interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits: Record<string, CircuitBreaker> = {};
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000;

/**
 * Call downstream service with circuit breaker protection
 */
async function callWithCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  const circuit = circuits[service] || { failures: 0, lastFailure: 0, state: 'closed' };

  if (circuit.state === 'open') {
    if (Date.now() - circuit.lastFailure > RESET_TIMEOUT) {
      circuit.state = 'half-open';
      logger.info(`[CircuitBreaker] ${service} transitioning to half-open`);
    } else {
      logger.warn(`[CircuitBreaker] ${service} circuit is open, returning fallback`);
      return fallback;
    }
  }

  try {
    const result = await fn();
    if (circuit.state === 'half-open') {
      circuit.state = 'closed';
      circuit.failures = 0;
      logger.info(`[CircuitBreaker] ${service} circuit closed, service recovered`);
    }
    circuits[service] = circuit;
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.lastFailure = Date.now();
    if (circuit.failures >= FAILURE_THRESHOLD) {
      circuit.state = 'open';
      logger.error(`[CircuitBreaker] ${service} circuit opened after ${circuit.failures} failures`);
    }
    circuits[service] = circuit;
    return fallback;
  }
}

interface OrderEvent {
  merchant_id: string;
  order_id: string;
  customer_id: string;
  items: Array<{ item_id: string; quantity: number; price: number; name?: string }>;
  total_amount: number;
  payment_method?: string;
  status?: string;
}

/**
 * Send order event to REZ Mind (fire-and-forget)
 */
export async function sendOrderToRezMind(order: OrderEvent, eventType: string): Promise<void> {
  try {
    const endpoint = eventType === 'order.completed'
      ? '/webhook/merchant/order'
      : '/webhook/merchant/payment';

    await fetch(`${REZ_MIND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        event_type: eventType,
        source: 'rez-order-service',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Fire-and-forget, log but don't fail
    logger.error('[REZ Mind] Order event failed:', { error });
  }
}

/**
 * Send inventory low event to REZ Mind
 */
export async function sendInventoryLowToRezMind(data: {
  merchant_id: string;
  item_id: string;
  item_name?: string;
  current_stock: number;
  threshold: number;
  avg_daily_sales?: number;
}): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/merchant/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-order-service',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error('[REZ Mind] Inventory event failed:', { error });
  }
}
