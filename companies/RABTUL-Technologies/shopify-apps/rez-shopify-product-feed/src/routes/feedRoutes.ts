import { Router } from 'express';
import { z } from 'zod';
import { feedService } from '../services/feedService.js';
import { ProductFeedSchema, ChannelSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/feeds', (req, res) => {
  try {
    const feed = ProductFeedSchema.parse(req.body);
    const created = feedService.createFeed(feed);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create feed', { error });
      res.status(500).json({ success: false, error: 'Failed to create feed' });
    }
  }
});

router.get('/feeds/:id', (req, res) => {
  const feed = feedService.getFeed(req.params.id);
  feed ? res.json({ success: true, data: feed }) : res.status(404).json({ success: false, error: 'Feed not found' });
});

router.get('/shops/:shopId/feeds', (req, res) => {
  const feeds = feedService.getShopFeeds(req.params.shopId);
  res.json({ success: true, data: feeds });
});

router.patch('/feeds/:id', (req, res) => {
  const feed = feedService.updateFeed(req.params.id, req.body);
  feed ? res.json({ success: true, data: feed }) : res.status(404).json({ success: false, error: 'Feed not found' });
});

router.post('/feeds/:id/generate', (req, res) => {
  const { products } = req.body;
  const items = feedService.generateFeed(req.params.id, products);
  res.json({ success: true, data: items });
});

router.get('/feeds/:id/export', (req, res) => {
  const { format, products } = req.query;
  const items = feedService.generateFeed(req.params.id, JSON.parse(products as string || '[]'));
  const output = feedService.exportFeed(req.params.id, (format as any) || 'xml', items);
  res.type(format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/plain').send(output);
});

router.post('/channels', (req, res) => {
  try {
    const channel = ChannelSchema.parse(req.body);
    const created = feedService.createChannel(channel);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
});

router.get('/channels/:id', (req, res) => {
  const channel = feedService.getChannel(req.params.id);
  channel ? res.json({ success: true, data: channel }) : res.status(404).json({ success: false, error: 'Channel not found' });
});

router.get('/shops/:shopId/channels', (req, res) => {
  const channels = feedService.getShopChannels(req.params.shopId);
  res.json({ success: true, data: channels });
});

router.post('/channels/:id/sync', (req, res) => {
  const success = feedService.syncChannel(req.params.id);
  res.json({ success });
});

export default router;
