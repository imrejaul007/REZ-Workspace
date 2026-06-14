import cron from 'node-cron';
import { FeedParserService } from './FeedParser';
import { SyndicationService } from './SyndicationService';
import { FeedStorage } from '../models/Storage';
import logger from '../utils/logger';

export class SchedulerService {
  private storage: FeedStorage;
  private parser: FeedParserService;
  private syndication: SyndicationService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor(storage: FeedStorage, parser: FeedParserService, syndication: SyndicationService) {
    this.storage = storage;
    this.parser = parser;
    this.syndication = syndication;
  }

  /**
   * Start the scheduler with default configuration
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;

    // Default feed check interval from env or every 15 minutes
    const defaultSchedule = process.env.FEED_CHECK_INTERVAL || '*/15 * * * *';

    // Schedule default feed checking
    this.scheduleJob('default-feed-check', defaultSchedule, async () => {
      logger.info('Running scheduled feed check');
      await this.runFeedCheck();
    });

    // Schedule default syndication
    this.scheduleJob('default-syndication', '*/30 * * * *', async () => {
      logger.info('Running scheduled syndication');
      await this.runSyndication();
    });

    // Schedule cleanup (daily at 3 AM)
    this.scheduleJob('cleanup', '0 3 * * *', async () => {
      logger.info('Running scheduled cleanup');
      this.storage.cleanupOldItems(100);
    });

    logger.info('Scheduler started with default jobs');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Schedule a job
   */
  scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    if (this.jobs.has(name)) {
      this.jobs.get(name)?.stop();
    }

    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron expression: ${schedule}`);
      return;
    }

    const job = cron.schedule(schedule, async () => {
      try {
        await task();
      } catch (error) {
        logger.error(`Scheduled job ${name} failed:`, error);
      }
    });

    this.jobs.set(name, job);
    logger.info(`Scheduled job: ${name} with schedule: ${schedule}`);
  }

  /**
   * Update schedule for a specific feed
   */
  updateFeedSchedule(feedId: string, schedule: string): void {
    const jobName = `feed-${feedId}`;

    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    const feed = this.storage.getFeed(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    this.scheduleJob(jobName, schedule, async () => {
      await this.parser.fetchFeed(feed);
      await this.syndication.processFeed(feedId);
    });
  }

  /**
   * Remove schedule for a specific feed
   */
  removeFeedSchedule(feedId: string): void {
    const jobName = `feed-${feedId}`;
    const job = this.jobs.get(jobName);

    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      logger.info(`Removed schedule for feed: ${feedId}`);
    }
  }

  /**
   * Run feed check manually
   */
  async runFeedCheck(): Promise<void> {
    logger.info('Starting feed check...');
    const results = await this.parser.fetchAllFeeds();

    let totalItems = 0;
    results.forEach((items) => {
      totalItems += items.length;
    });

    logger.info(`Feed check complete. Found ${totalItems} new items`);
  }

  /**
   * Run syndication manually
   */
  async runSyndication(): Promise<void> {
    logger.info('Starting syndication...');
    const results = await this.syndication.processAllFeeds();

    let totalPosted = 0;
    let totalFailed = 0;

    results.forEach((feedResults) => {
      feedResults.forEach((result) => {
        if (result.success) totalPosted++;
        else totalFailed++;
      });
    });

    logger.info(`Syndication complete. Posted: ${totalPosted}, Failed: ${totalFailed}`);
  }

  /**
   * Get list of active scheduled jobs
   */
  getActiveJobs(): { name: string; schedule: string }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      schedule: (job as any).cronExpression || 'unknown'
    }));
  }

  /**
   * Check if a feed has an active schedule
   */
  hasFeedSchedule(feedId: string): boolean {
    return this.jobs.has(`feed-${feedId}`);
  }
}
