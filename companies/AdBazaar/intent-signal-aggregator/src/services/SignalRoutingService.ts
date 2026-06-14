import { IntentSignal, SignalRoutingTarget } from '../types';
import { publishSignal } from '../config/redis';
import { logger } from '../config/logger';
import { metrics } from './metrics';

// Routing targets configuration
const ROUTING_TARGETS: Record<string, SignalRoutingTarget[]> = {
  DINING: [
    { service: 'intent-graph', endpoint: '/api/intent/graph', priority: 1 },
    { service: 'marketplace', endpoint: '/api/recommendations/dining', priority: 2 },
    { service: 'ads', endpoint: '/api/ads/targeting', priority: 3 },
  ],
  TRAVEL: [
    { service: 'intent-graph', endpoint: '/api/intent/graph', priority: 1 },
    { service: 'airzy', endpoint: '/api/intent/signal', priority: 2 },
    { service: 'ads', endpoint: '/api/ads/targeting', priority: 3 },
  ],
  RETAIL: [
    { service: 'intent-graph', endpoint: '/api/intent/graph', priority: 1 },
    { service: 'marketplace', endpoint: '/api/recommendations/retail', priority: 2 },
    { service: 'ads', endpoint: '/api/ads/targeting', priority: 3 },
  ],
  HEALTHCARE: [
    { service: 'intent-graph', endpoint: '/api/intent/graph', priority: 1 },
    { service: 'risacare', endpoint: '/api/intent/signal', priority: 2 },
  ],
  GENERAL: [
    { service: 'intent-graph', endpoint: '/api/intent/graph', priority: 1 },
    { service: 'ads', endpoint: '/api/ads/targeting', priority: 2 },
  ],
};

// Event type priority adjustment
const EVENT_TYPE_PRIORITY: Record<string, number> = {
  search: 0,
  view: 0,
  wishlist: 1,
  cart_add: 2,
  checkout_start: 3,
  fulfilled: 4,
};

export class SignalRoutingService {
  private httpClient: typeof fetch;

  constructor() {
    this.httpClient = fetch;
  }

  /**
   * Route a signal to appropriate services
   */
  async routeSignal(signal: IntentSignal): Promise<void> {
    const startTime = Date.now();
    const targets = this.getRoutingTargets(signal);

    logger.debug('Routing signal', {
      signalId: signal.signalId,
      category: signal.category,
      targets: targets.map((t) => t.service),
    });

    // Publish to Redis for real-time consumers
    await this.publishToRedis(signal);

    // Send to HTTP endpoints in parallel
    const routingPromises = targets.map((target) =>
      this.routeToTarget(signal, target).catch((error) => {
        logger.error('Failed to route to target', {
          signalId: signal.signalId,
          target: target.service,
          error: error.message,
        });
        metrics.routingErrors.labels(target.service).inc();
      })
    );

    await Promise.allSettled(routingPromises);

    metrics.routingDuration.observe((Date.now() - startTime) / 1000);
    metrics.signalsRouted.inc({ category: signal.category });
  }

  /**
   * Get routing targets for a signal
   */
  private getRoutingTargets(signal: IntentSignal): SignalRoutingTarget[] {
    const baseTargets = ROUTING_TARGETS[signal.category] || ROUTING_TARGETS.GENERAL;

    // Adjust priority based on event type
    const priorityAdjustment = EVENT_TYPE_PRIORITY[signal.eventType] || 0;

    return baseTargets.map((target) => ({
      ...target,
      priority: target.priority + priorityAdjustment,
      metadata: {
        eventType: signal.eventType,
        confidence: signal.confidence,
        enriched: signal.enriched,
      },
    }));
  }

  /**
   * Route signal to a specific target
   */
  private async routeToTarget(
    signal: IntentSignal,
    target: SignalRoutingTarget
  ): Promise<void> {
    const baseUrl = this.getServiceUrl(target.service);

    if (!baseUrl) {
      logger.warn('No URL configured for service', { service: target.service });
      return;
    }

    const url = `${baseUrl}${target.endpoint}`;

    try {
      const response = await this.httpClient(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'intent-signal-aggregator',
          'X-Signal-Id': signal.signalId,
        },
        body: JSON.stringify({
          signal,
          metadata: target.metadata,
          priority: target.priority,
        }),
        // Timeout after 5 seconds
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug('Signal routed successfully', {
        signalId: signal.signalId,
        target: target.service,
        status: response.status,
      });
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        logger.warn('Signal routing timed out', {
          signalId: signal.signalId,
          target: target.service,
        });
      }
      throw error;
    }
  }

  /**
   * Publish signal to Redis for real-time consumers
   */
  private async publishToRedis(signal: IntentSignal): Promise<void> {
    try {
      await publishSignal({
        type: 'signal',
        data: signal,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to publish signal to Redis', {
        error: (error as Error).message,
        signalId: signal.signalId,
      });
    }
  }

  /**
   * Get base URL for a service
   */
  private getServiceUrl(service: string): string | null {
    const serviceUrls: Record<string, string | undefined> = {
      'intent-graph': process.env.INTENT_GRAPH_URL || 'http://localhost:4700',
      'marketplace': process.env.MARKETPLACE_URL || 'http://localhost:4200',
      'ads': process.env.ADS_URL || 'http://localhost:4300',
      'airzy': process.env.AIRZY_URL || 'http://localhost:4500',
      'risacare': process.env.RISACARE_URL || 'http://localhost:4600',
    };

    return serviceUrls[service] || null;
  }

  /**
   * Batch route signals
   */
  async routeBatch(signals: IntentSignal[]): Promise<void> {
    const routingPromises = signals.map((signal) =>
      this.routeSignal(signal).catch((error) => {
        logger.error('Failed to route signal in batch', {
          signalId: signal.signalId,
          error: error.message,
        });
      })
    );

    await Promise.allSettled(routingPromises);
  }
}

export const signalRoutingService = new SignalRoutingService();