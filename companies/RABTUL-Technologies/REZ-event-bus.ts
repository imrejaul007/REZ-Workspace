/**
 * Event Bus - Kafka/Pulsar Event Streaming
 * Real-time event distribution
 */

import { randomBytes } from 'crypto';
import { redis } from './config/redis';

const EVENT_BUS_PREFIX = 'eventbus:';
const CONSUMER_PREFIX = 'consumer:';
const TOPIC_PREFIX = 'topic:';

interface Event {
  id: string;
  topic: string;
  type: string;
  data: unknown;
  timestamp: Date;
  source: string;
}

/**
 * Publish event to topic
 */
export async function publish(topic: string, event: Omit<Event, 'id' | 'timestamp'>): Promise<string> {
  const id = `evt_${Date.now()}_${randomBytes(6).toString('hex')}`;
  const fullEvent: Event = {
    ...event,
    id,
    timestamp: new Date(),
  };

  // Store event
  await redis.lpush(`${TOPIC_PREFIX}${topic}`, JSON.stringify(fullEvent));
  await redis.expire(`${TOPIC_PREFIX}${topic}`, 86400);

  // Notify consumers
  const consumers = await redis.smembers(`${CONSUMER_PREFIX}${topic}`);
  for (const consumer of consumers) {
    await redis.lpush(`${EVENT_BUS_PREFIX}pending:${consumer}`, id);
  }

  return id;
}

/**
 * Subscribe consumer to topic
 */
export async function subscribe(consumerId: string, topic: string): Promise<void> {
  await redis.sadd(`${CONSUMER_PREFIX}${topic}`, consumerId);
  // Track active topics in a Redis Set (instead of using KEYS command)
  await redis.sadd(`${TOPIC_PREFIX}active`, topic);
}

/**
 * Consume events for consumer
 */
export async function consume(consumerId: string, count = 10): Promise<Event[]> {
  const events: Event[] = [];

  for (let i = 0; i < count; i++) {
    const eventId = await redis.rpoplpush(
      `${EVENT_BUS_PREFIX}pending:${consumerId}`,
      `${EVENT_BUS_PREFIX}processing:${consumerId}`,
    );

    if (!eventId) break;

    // Find event in all active topics (using Set instead of KEYS)
    const activeTopics = await redis.smembers(`${TOPIC_PREFIX}active`);
    for (const topic of activeTopics) {
      const topicKey = `${TOPIC_PREFIX}${topic}`;
      const eventData = await redis.lrange(topicKey, 0, -1);

      for (const e of eventData) {
        const parsed = JSON.parse(e);
        if (parsed.id === eventId) {
          events.push(parsed);
          break;
        }
      }
    }
  }

  return events;
}
