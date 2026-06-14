/**
 * AdBazaar Event Stream
 * Real-time event streaming and processing layer
 *
 * Port: 4966
 * Purpose: Apache Kafka/Pulsar alternative for real-time event streaming
 *
 * Features:
 * - Pub/Sub messaging
 * - Event streaming
 * - Real-time processing
 * - Event replay
 * - Consumer groups
 * - Dead letter queues
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4966;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/event-stream.log' })
  ]
});

// Event Emitter for in-memory pub/sub
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(1000);

// Configuration
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// In-memory event store (in production, use Redis Streams or Kafka)
interface Event {
  eventId: string;
  topic: string;
  partition: number;
  key: string | null;
  value: any;
  headers: Record<string, string>;
  timestamp: Date;
  offset: number;
}

interface Consumer {
  consumerId: string;
  groupId: string;
  topics: string[];
  lastOffset: number;
  subscribed: boolean;
}

const events: Map<string, Event[]> = new Map();
const consumers: Map<string, Consumer> = new Map();
const consumerGroups: Map<string, Set<string>> = new Map();
let currentOffset = 0;

// MongoDB for persistence (in production)
const eventLogSchema = new mongoose.Schema({
  eventId: String,
  topic: String,
  partition: Number,
  key: String,
  value: mongoose.Schema.Types.Mixed,
  headers: mongoose.Schema.Types.Mixed,
  timestamp: Date,
  offset: Number
});

const EventLog = mongoose.model('EventLog', eventLogSchema);

const topicSchema = new mongoose.Schema({
  topicId: String,
  name: String,
  partitions: Number,
  retention: Number, // hours
  createdAt: Date
});

const Topic = mongoose.model('Topic', topicSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const stats = getStreamStats();

  res.json({
    status: 'healthy',
    service: 'adbazaar-event-stream',
    port: PORT,
    ...stats,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TOPIC MANAGEMENT
// ============================================

/**
 * Create topic
 * POST /api/topics
 */
app.post('/api/topics', async (req: Request, res: Response) => {
  try {
    const { name, partitions = 3, retention = 168 } = req.body;

    const topicId = `topic_${crypto.randomBytes(6).toString('hex')}`;

    // Initialize partitions
    for (let i = 0; i < partitions; i++) {
      events.set(`${name}-${i}`, []);
    }

    // Persist to MongoDB
    const topic = new Topic({
      topicId,
      name,
      partitions,
      retention,
      createdAt: new Date()
    });

    await topic.save();

    logger.info('Topic created', { topicId, name, partitions });

    res.json({
      success: true,
      topic: {
        id: topicId,
        name,
        partitions,
        retention
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * List topics
 * GET /api/topics
 */
app.get('/api/topics', async (req: Request, res: Response) => {
  try {
    const topics = await Topic.find();

    res.json({
      success: true,
      topics: topics.map(t => ({
        id: t.topicId,
        name: t.name,
        partitions: t.partitions,
        retention: t.retention
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// PUBLISH EVENTS
// ============================================

/**
 * Publish event
 * POST /api/publish
 */
app.post('/api/publish', async (req: Request, res: Response) => {
  try {
    const { topic, key, value, headers = {} } = req.body;

    currentOffset++;
    const eventId = `evt_${currentOffset}`;

    // Determine partition based on key hash
    const topicInfo = await Topic.findOne({ name: topic });
    const partition = topicInfo ? key
      ? Math.abs(hashKey(key)) % topicInfo.partitions
      : Math.floor(Math.random() * topicInfo.partitions)
      : 0;

    const event: Event = {
      eventId,
      topic,
      partition,
      key,
      value,
      headers,
      timestamp: new Date(),
      offset: currentOffset
    };

    // Store in memory
    const partitionKey = `${topic}-${partition}`;
    if (!events.has(partitionKey)) {
      events.set(partitionKey, []);
    }
    events.get(partitionKey)!.push(event);

    // Persist to MongoDB
    const eventLog = new EventLog(event);
    await eventLog.save();

    // Emit for real-time subscribers
    eventEmitter.emit(`topic:${topic}`, event);

    // Acknowledge
    res.json({
      success: true,
      eventId,
      offset: currentOffset,
      partition
    });
  } catch (error) {
    logger.error('Publish error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Batch publish
 * POST /api/publish/batch
 */
app.post('/api/publish/batch', async (req: Request, res: Response) => {
  try {
    const { topic, events: eventBatch } = req.body;

    const results = [];

    for (const item of eventBatch) {
      currentOffset++;
      const eventId = `evt_${currentOffset}`;

      const topicInfo = await Topic.findOne({ name: topic });
      const partition = topicInfo ? Math.floor(Math.random() * topicInfo.partitions) : 0;

      const event: Event = {
        eventId,
        topic,
        partition,
        key: item.key,
        value: item.value,
        headers: item.headers || {},
        timestamp: new Date(),
        offset: currentOffset
      };

      const partitionKey = `${topic}-${partition}`;
      if (!events.has(partitionKey)) {
        events.set(partitionKey, []);
      }
      events.get(partitionKey)!.push(event);

      await new EventLog(event).save();
      results.push({ eventId, offset: currentOffset, partition });
    }

    // Emit batch event
    eventEmitter.emit(`topic:${topic}`, { batch: true, events: results });

    res.json({
      success: true,
      published: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CONSUME EVENTS
// ============================================

/**
 * Create consumer
 * POST /api/consumers
 */
app.post('/api/consumers', async (req: Request, res: Response) => {
  try {
    const { groupId, topics } = req.body;

    const consumerId = `consumer_${crypto.randomBytes(8).toString('hex')}`;

    // Add to consumer group
    if (!consumerGroups.has(groupId)) {
      consumerGroups.set(groupId, new Set());
    }
    consumerGroups.get(groupId)!.add(consumerId);

    const consumer: Consumer = {
      consumerId,
      groupId,
      topics,
      lastOffset: 0,
      subscribed: true
    };

    consumers.set(consumerId, consumer);

    // Subscribe to topics
    for (const topic of topics) {
      eventEmitter.on(`topic:${topic}`, (event: Event) => {
        // In production, this would go to a queue for the consumer
        logger.debug('Event emitted to consumer', { consumerId, eventId: event.eventId });
      });
    }

    res.json({
      success: true,
      consumer: {
        id: consumerId,
        groupId,
        topics
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Poll for events
 * POST /api/consume
 */
app.post('/api/consume', async (req: Request, res: Response) => {
  try {
    const { consumerId, topic, maxEvents = 100, timeout = 5000 } = req.body;

    const consumer = consumers.get(consumerId);
    if (!consumer) {
      res.status(404).json({ success: false, error: 'Consumer not found' });
      return;
    }

    const partitionKey = `${topic}-0`; // Simplified, should handle all partitions
    const partitionEvents = events.get(partitionKey) || [];

    // Get events after last offset
    const newEvents = partitionEvents
      .filter(e => e.offset > consumer.lastOffset)
      .slice(0, maxEvents);

    // Update consumer position
    if (newEvents.length > 0) {
      consumer.lastOffset = newEvents[newEvents.length - 1].offset;
      consumers.set(consumerId, consumer);
    }

    res.json({
      success: true,
      events: newEvents.map(e => ({
        eventId: e.eventId,
        key: e.key,
        value: e.value,
        headers: e.headers,
        timestamp: e.timestamp,
        offset: e.offset
      })),
      count: newEvents.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Commit consumer offset
 * POST /api/consumers/:consumerId/commit
 */
app.post('/api/consumers/:consumerId/commit', async (req: Request, res: Response) => {
  try {
    const { offsets } = req.body; // { topic: { partition: offset } }

    const consumer = consumers.get(req.params.consumerId);
    if (!consumer) {
      res.status(404).json({ success: false, error: 'Consumer not found' });
      return;
    }

    // Update consumer position for each topic/partition
    for (const [topic, partitions] of Object.entries(offsets)) {
      for (const [partition, offset] of Object.entries(partitions as any)) {
        if (offset > consumer.lastOffset) {
          consumer.lastOffset = offset as number;
        }
      }
    }

    consumers.set(consumer.id, consumer);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Delete consumer
 * DELETE /api/consumers/:consumerId
 */
app.delete('/api/consumers/:consumerId', async (req: Request, res: Response) => {
  try {
    const consumer = consumers.get(req.params.consumerId);

    if (consumer) {
      // Remove from group
      const group = consumerGroups.get(consumer.groupId);
      if (group) {
        group.delete(consumer.consumerId);
      }

      consumers.delete(req.params.consumerId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// STREAMS
// ============================================

/**
 * Create stream
 * POST /api/streams
 */
app.post('/api/streams', async (req: Request, res: Response) => {
  try {
    const { name, query } = req.body;

    // In production, this would create a persistent stream query
    // Similar to Kafka Streams or KSQL

    const streamId = `stream_${crypto.randomBytes(6).toString('hex')}`;

    res.json({
      success: true,
      stream: {
        id: streamId,
        name,
        query,
        status: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Query stream
 * POST /api/streams/:streamId/query
 */
app.post('/api/streams/:streamId/query', async (req: Request, res: Response) => {
  try {
    const { params } = req.body;

    // Execute stream query
    // This is a simplified version

    res.json({
      success: true,
      results: [],
      streamId: req.params.streamId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// STATS & MONITORING
// ============================================

/**
 * Get stream stats
 * GET /api/stats
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  const stats = getStreamStats();

  res.json({
    success: true,
    stats
  });
});

/**
 * Get topic lag
 * GET /api/topics/:name/lag
 */
app.get('/api/topics/:name/lag', async (req: Request, res: Response) => {
  try {
    const topic = req.params.name;
    const topicInfo = await Topic.findOne({ name: topic });

    if (!topicInfo) {
      res.status(404).json({ success: false, error: 'Topic not found' });
      return;
    }

    const lag: Record<number, number> = {};

    for (let i = 0; i < topicInfo.partitions; i++) {
      const partitionKey = `${topic}-${i}`;
      const partitionEvents = events.get(partitionKey) || [];
      lag[i] = partitionEvents.length;
    }

    res.json({
      success: true,
      topic,
      partitions: topicInfo.partitions,
      lag,
      totalEvents: Object.values(lag).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// DEAD LETTER QUEUE
// ============================================

/**
 * Get dead letter events
 * GET /api/dlq
 */
app.get('/api/dlq', async (req: Request, res: Response) => {
  try {
    const dlqEvents = await EventLog.find({
      topic: { $regex: /_dlq$/ }
    }).limit(100);

    res.json({
      success: true,
      events: dlqEvents,
      count: dlqEvents.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Retry dead letter event
 * POST /api/dlq/:eventId/retry
 */
app.post('/api/dlq/:eventId/retry', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;

    const dlqEvent = await EventLog.findOne({ eventId: req.params.eventId });

    if (!dlqEvent) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    // Republish to original topic
    const event: Event = {
      eventId: `evt_${++currentOffset}`,
      topic,
      partition: 0,
      key: dlqEvent.key as string,
      value: dlqEvent.value,
      headers: dlqEvent.headers as Record<string, string>,
      timestamp: new Date(),
      offset: currentOffset
    };

    const partitionKey = `${topic}-0`;
    if (!events.has(partitionKey)) {
      events.set(partitionKey, []);
    }
    events.get(partitionKey)!.push(event);

    await new EventLog(event).save();
    eventEmitter.emit(`topic:${topic}`, event);

    // Delete from DLQ
    await EventLog.deleteOne({ eventId: req.params.eventId });

    res.json({
      success: true,
      newEventId: event.eventId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// REPLAY
// ============================================

/**
 * Replay events
 * POST /api/replay
 */
app.post('/api/replay', async (req: Request, res: Response) => {
  try {
    const { topic, fromOffset, toOffset, targetTopic } = req.body;

    const replayId = `replay_${crypto.randomBytes(6).toString('hex')}`;

    // Find events to replay
    const replayEvents = await EventLog.find({
      topic,
      offset: { $gte: fromOffset, $lte: toOffset || currentOffset }
    });

    // Publish to target topic
    for (const evt of replayEvents) {
      currentOffset++;
      const newEvent = new EventLog({
        eventId: `evt_${currentOffset}`,
        topic: targetTopic,
        partition: evt.partition,
        key: evt.key,
        value: evt.value,
        headers: { ...evt.headers as Record<string, string>, replayedFrom: evt.topic },
        timestamp: new Date(),
        offset: currentOffset
      });

      await newEvent.save();
      eventEmitter.emit(`topic:${targetTopic}`, newEvent);
    }

    res.json({
      success: true,
      replayId,
      eventsReplayed: replayEvents.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function getStreamStats(): any {
  let totalEvents = 0;
  const topicStats: Record<string, { partitions: number; events: number }> = {};

  for (const [key, partitionEvents] of events.entries()) {
    const [topic, partition] = key.split('-');
    totalEvents += partitionEvents.length;

    if (!topicStats[topic]) {
      topicStats[topic] = { partitions: 0, events: 0 };
    }
    topicStats[topic].events += partitionEvents.length;
    topicStats[topic].partitions++;
  }

  return {
    totalEvents,
    totalTopics: Object.keys(topicStats).length,
    totalConsumers: consumers.size,
    totalConsumerGroups: consumerGroups.size,
    currentOffset,
    topics: topicStats
  };
}

// Cleanup old events (in production, use TTL indexes)
async function cleanupOldEvents(): Promise<void> {
  const retentionHours = 168; // 7 days
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

  for (const [key, partitionEvents] of events.entries()) {
    const filtered = partitionEvents.filter(e => e.timestamp > cutoff);
    events.set(key, filtered);
  }
}

// Run cleanup every hour
setInterval(cleanupOldEvents, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Event Stream started on port ${PORT}`);
  logger.info('⚡ Real-time event streaming and processing');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_event_stream')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;