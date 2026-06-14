import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FeedStorage } from '../models/Storage';
import { CreateFeedInputSchema, UpdateFeedInputSchema, Feed } from '../models/types';
import { FeedParserService } from '../services/FeedParser';
import { SyndicationService } from '../services/SyndicationService';
import { SchedulerService } from '../services/SchedulerService';

export function createFeedRoutes(
  storage: FeedStorage,
  parser: FeedParserService,
  syndication: SyndicationService,
  scheduler: SchedulerService
): Router {
  const router = Router();

  // List all feeds
  router.get('/', (req: Request, res: Response) => {
    const feeds = storage.getAllFeeds();
    res.json({
      success: true,
      data: feeds,
      count: feeds.length
    });
  });

  // Get single feed
  router.get('/:id', (req: Request, res: Response) => {
    const feed = storage.getFeed(req.params.id);
    if (!feed) {
      return res.status(404).json({
        success: false,
        error: 'Feed not found'
      });
    }

    const stats = storage.getFeedStats(req.params.id);

    res.json({
      success: true,
      data: { ...feed, stats }
    });
  });

  // Create new feed
  router.post('/', async (req: Request, res: Response) => {
    try {
      const input = CreateFeedInputSchema.parse(req.body);

      // Validate feed URL is accessible
      const validation = await parser.validateFeedUrl(input.url);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid feed URL: ${validation.error}`
        });
      }

      const now = new Date().toISOString();
      const feed: Feed = {
        id: uuidv4(),
        url: input.url,
        name: input.name,
        platform: input.platform,
        enabled: true,
        schedule: input.schedule || '*/15 * * * *',
        charLimit: input.charLimit || 280,
        template: input.template || '{{title}}\n\n{{excerpt}}\n\n{{link}}',
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now
      };

      storage.createFeed(feed);

      // Schedule the feed
      scheduler.updateFeedSchedule(feed.id, feed.schedule);

      // Fetch initial content
      parser.fetchFeed(feed).catch(err => {
        logger.error(`Initial fetch failed for ${feed.id}:`, err);
      });

      res.status(201).json({
        success: true,
        data: feed,
        message: `Feed created. Found title: ${validation.title}`
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update feed
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const updates = UpdateFeedInputSchema.parse(req.body);
      const existingFeed = storage.getFeed(req.params.id);

      if (!existingFeed) {
        return res.status(404).json({
          success: false,
          error: 'Feed not found'
        });
      }

      const updatedFeed = storage.updateFeed(req.params.id, updates);

      // Update schedule if changed
      if (updates.schedule && updates.schedule !== existingFeed.schedule) {
        scheduler.updateFeedSchedule(req.params.id, updates.schedule);
      }

      res.json({
        success: true,
        data: updatedFeed
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete feed
  router.delete('/:id', (req: Request, res: Response) => {
    const deleted = storage.deleteFeed(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Feed not found'
      });
    }

    // Remove schedule
    scheduler.removeFeedSchedule(req.params.id);

    res.json({
      success: true,
      message: 'Feed deleted'
    });
  });

  // Fetch feed now
  router.post('/:id/fetch', async (req: Request, res: Response) => {
    const feed = storage.getFeed(req.params.id);

    if (!feed) {
      return res.status(404).json({
        success: false,
        error: 'Feed not found'
      });
    }

    try {
      const items = await parser.fetchFeed(feed);
      res.json({
        success: true,
        data: {
          feedId: feed.id,
          newItems: items.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Post all unposted items
  router.post('/:id/post', async (req: Request, res: Response) => {
    try {
      const results = await syndication.processFeed(req.params.id);
      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          total: results.length,
          posted: successCount,
          failed: results.length - successCount
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get feed content items
  router.get('/:id/items', (req: Request, res: Response) => {
    const items = storage.getContentItems(req.params.id);

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  });

  // Retry failed posts
  router.post('/:id/retry', async (req: Request, res: Response) => {
    try {
      const results = await syndication.retryFailedPosts(req.params.id);
      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Validate feed URL
  router.post('/validate', async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    try {
      const result = await parser.validateFeedUrl(url);
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.json({
        success: true,
        data: { valid: false, error: error.message }
      });
    }
  });

  return router;
}
