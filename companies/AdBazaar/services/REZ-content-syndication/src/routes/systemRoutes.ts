import { Router, Request, Response } from 'express';
import { SchedulerService } from '../services/SchedulerService';
import { FeedParserService } from '../services/FeedParser';
import { SyndicationService } from '../services/SyndicationService';

export function createSystemRoutes(
  scheduler: SchedulerService,
  parser: FeedParserService,
  syndication: SyndicationService
): Router {
  const router = Router();

  // Trigger feed check
  router.post('/feeds/check', async (req: Request, res: Response) => {
    try {
      await scheduler.runFeedCheck();
      res.json({
        success: true,
        message: 'Feed check completed'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Trigger syndication
  router.post('/feeds/syndicate', async (req: Request, res: Response) => {
    try {
      await scheduler.runSyndication();
      res.json({
        success: true,
        message: 'Syndication completed'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get scheduler status
  router.get('/scheduler/status', (req: Request, res: Response) => {
    const jobs = scheduler.getActiveJobs();

    res.json({
      success: true,
      data: {
        isRunning: true,
        jobs,
        defaultCheckInterval: process.env.FEED_CHECK_INTERVAL || '*/15 * * * *'
      }
    });
  });

  // Update check interval
  router.post('/scheduler/interval', (req: Request, res: Response) => {
    const { interval } = req.body;

    if (!interval) {
      return res.status(400).json({
        success: false,
        error: 'Interval is required'
      });
    }

    try {
      scheduler.scheduleJob('default-feed-check', interval, async () => {
        await scheduler.runFeedCheck();
      });

      res.json({
        success: true,
        message: `Check interval updated to: ${interval}`
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // Test parser with URL
  router.post('/test/parser', async (req: Request, res: Response) => {
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
