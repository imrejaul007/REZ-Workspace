import logger from './utils/logger';

/**
 * Service Subscribers - Subscribes REZ Memory Layer and Flow Runtime to Event Bus
 *
 * This module configures event subscriptions for:
 * - REZ Memory Layer (4201) - Memory and context service
 * - REZ Flow Runtime (4200) - Workflow orchestration engine
 */

import { SubscriptionConfig } from '../models/subscription.model';
import { REZEvent, rezEventBus } from '../rezEventBus';

/**
 * Service subscription configurations
 */
export interface ServiceSubscriptionConfig {
  serviceId: string;
  serviceName: string;
  endpoint: string;
  port: number;
  categories: string[];
  eventTypes: string[];
  description: string;
}

/**
 * Default subscription configurations for new services
 */
export const NEW_SERVICE_SUBSCRIPTIONS: ServiceSubscriptionConfig[] = [
  // REZ Memory Layer - Memory and context service
  {
    serviceId: 'rez-memory-layer',
    serviceName: 'REZ Memory Layer',
    endpoint: process.env.REZ_MEMORY_LAYER_URL || 'http://localhost',
    port: 4201,
    categories: ['commerce', 'loyalty', 'engagement', 'support', 'whatsapp'],
    eventTypes: [
      'commerce.order.completed',
      'commerce.cart.abandoned',
      'commerce.payment.*',
      'loyalty.coins.earned',
      'loyalty.tier.upgraded',
      'engagement.qr.scanned',
      'engagement.campaign.*',
      'support.ticket.created',
      'support.ticket.resolved',
      'whatsapp.message.received',
      'whatsapp.message.sent'
    ],
    description: 'Memory and context service - captures user interactions for personalization'
  },

  // REZ Flow Runtime - Workflow orchestration engine
  {
    serviceId: 'rez-flow-runtime',
    serviceName: 'REZ Flow Runtime',
    endpoint: process.env.REZ_FLOW_RUNTIME_URL || 'http://localhost',
    port: 4200,
    categories: ['commerce', 'loyalty', 'engagement', 'whatsapp'],
    eventTypes: [
      'commerce.*',
      'loyalty.*',
      'engagement.*',
      'whatsapp.*'
    ],
    description: 'Workflow orchestration engine - triggers automated workflows based on events'
  }
];

/**
 * Initialize subscription in MongoDB
 */
export async function initializeSubscription(config: ServiceSubscriptionConfig): Promise<void> {
  try {
    const existing = await SubscriptionConfig.findOne({ serviceId: config.serviceId });

    if (existing) {
      // Update existing subscription
      await SubscriptionConfig.updateOne(
        { serviceId: config.serviceId },
        {
          $set: {
            endpoint: config.endpoint,
            port: config.port,
            categories: config.categories,
            eventTypes: config.eventTypes,
            retryPolicy: {
              maxRetries: 3,
              backoffMultiplier: 2,
              initialDelayMs: 1000
            },
            dlqThreshold: 5,
            concurrency: 2,
            headers: {
              'X-Service-Name': config.serviceName,
              'X-Service-Version': '1.0.0'
            }
          }
        }
      );
      logger.info(`[ServiceSubscribers] Updated subscription for ${config.serviceName}`);
    } else {
      // Create new subscription
      await SubscriptionConfig.create({
        serviceId: config.serviceId,
        serviceName: config.serviceName,
        endpoint: config.endpoint,
        port: config.port,
        categories: config.categories,
        eventTypes: config.eventTypes,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000
        },
        dlqThreshold: 5,
        concurrency: 2,
        headers: {
          'X-Service-Name': config.serviceName,
          'X-Service-Version': '1.0.0'
        },
        active: true
      });
      logger.info(`[ServiceSubscribers] Created subscription for ${config.serviceName}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[ServiceSubscribers] Error initializing subscription for ${config.serviceName}: ${message}`);
    throw error;
  }
}

/**
 * Initialize all new service subscriptions
 */
export async function initializeNewServiceSubscriptions(): Promise<void> {
  logger.info('[ServiceSubscribers] Initializing new service subscriptions...');

  for (const config of NEW_SERVICE_SUBSCRIPTIONS) {
    await initializeSubscription(config);
  }

  logger.info(`[ServiceSubscribers] Initialized ${NEW_SERVICE_SUBSCRIPTIONS.length} service subscriptions`);
}

/**
 * Register event handlers for forwarding to subscribers
 * This is called after the event bus is created
 */
export function registerSubscriberHandlers(
  forwardToSubscriber: (event: REZEvent, subscription) => Promise<unknown>
): void {
  logger.info('[ServiceSubscribers] Registering subscriber event handlers...');

  // Forward commerce events
  rezEventBus.onCategory('commerce', async (event: REZEvent) => {
    const subscriptions = NEW_SERVICE_SUBSCRIPTIONS.filter(sub =>
      sub.categories.includes('commerce')
    );
    for (const sub of subscriptions) {
      await forwardToSubscriber(event, sub);
    }
  });

  // Forward loyalty events
  rezEventBus.onCategory('loyalty', async (event: REZEvent) => {
    const subscriptions = NEW_SERVICE_SUBSCRIPTIONS.filter(sub =>
      sub.categories.includes('loyalty')
    );
    for (const sub of subscriptions) {
      await forwardToSubscriber(event, sub);
    }
  });

  // Forward engagement events
  rezEventBus.onCategory('engagement', async (event: REZEvent) => {
    const subscriptions = NEW_SERVICE_SUBSCRIPTIONS.filter(sub =>
      sub.categories.includes('engagement')
    );
    for (const sub of subscriptions) {
      await forwardToSubscriber(event, sub);
    }
  });

  // Forward support events
  rezEventBus.onCategory('support', async (event: REZEvent) => {
    const subscriptions = NEW_SERVICE_SUBSCRIPTIONS.filter(sub =>
      sub.categories.includes('support')
    );
    for (const sub of subscriptions) {
      await forwardToSubscriber(event, sub);
    }
  });

  // Forward WhatsApp events
  rezEventBus.onCategory('whatsapp', async (event: REZEvent) => {
    const subscriptions = NEW_SERVICE_SUBSCRIPTIONS.filter(sub =>
      sub.categories.includes('whatsapp')
    );
    for (const sub of subscriptions) {
      await forwardToSubscriber(event, sub);
    }
  });

  logger.info('[ServiceSubscribers] Registered handlers for commerce, loyalty, engagement, support, whatsapp categories');
}

/**
 * Get subscription status for all new services
 */
export async function getSubscriptionStatus(): Promise<unknown[]> {
  const statuses = [];

  for (const config of NEW_SERVICE_SUBSCRIPTIONS) {
    const subscription = await SubscriptionConfig.findOne({ serviceId: config.serviceId });
    statuses.push({
      serviceId: config.serviceId,
      serviceName: config.serviceName,
      endpoint: `${config.endpoint}:${config.port}`,
      categories: config.categories,
      active: subscription?.active || false,
      eventsReceived: subscription?.eventsReceived || 0,
      errorsCount: subscription?.errorsCount || 0,
      lastEventAt: subscription?.lastEventAt || null
    });
  }

  return statuses;
}

/**
 * Activate a service subscription
 */
export async function activateSubscription(serviceId: string): Promise<void> {
  await SubscriptionConfig.updateOne(
    { serviceId },
    { $set: { active: true } }
  );
  logger.info(`[ServiceSubscribers] Activated subscription: ${serviceId}`);
}

/**
 * Deactivate a service subscription
 */
export async function deactivateSubscription(serviceId: string): Promise<void> {
  await SubscriptionConfig.updateOne(
    { serviceId },
    { $set: { active: false } }
  );
  logger.info(`[ServiceSubscribers] Deactivated subscription: ${serviceId}`);
}

export default {
  initializeNewServiceSubscriptions,
  registerSubscriberHandlers,
  getSubscriptionStatus,
  activateSubscription,
  deactivateSubscription,
  NEW_SERVICE_SUBSCRIPTIONS
};
