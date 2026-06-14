import cron from 'node-cron';
import { ScheduledPost } from '../models/ScheduledPost';
import { RedditPost } from '../models/RedditPost';
import { redditApi } from './redditApi';
import { redditApiCalls, scheduledPostsCount } from '../config/metrics';
import { logger } from '../config/logger';

class SchedulerService {
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Scheduler is already running');
      return;
    }

    // Run every minute to check for scheduled posts
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    logger.info('Scheduler started - checking for posts every minute');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Process all scheduled posts that are due
   */
  async processScheduledPosts(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Scheduler already processing, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const duePosts = await ScheduledPost.findDueForPublishing();

      if (duePosts.length === 0) {
        return;
      }

      logger.info(`Processing ${duePosts.length} scheduled posts`);

      // Update scheduled posts count metric
      const pendingCount = await ScheduledPost.countDocuments({ status: 'pending' });
      scheduledPostsCount.set(pendingCount);

      for (const scheduledPost of duePosts) {
        try {
          await this.publishPost(scheduledPost);
        } catch (error) {
          logger.error('Failed to publish scheduled post', {
            postId: scheduledPost._id,
            error,
          });

          if (scheduledPost.canRetry) {
            await scheduledPost.markFailed(
              error instanceof Error ? error.message : 'Unknown error'
            );
          } else {
            // Max retries reached
            scheduledPost.status = 'failed';
            scheduledPost.errorMessage = 'Max retries exceeded';
            await scheduledPost.save();
          }
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled posts', { error });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Publish a single scheduled post
   */
  private async publishPost(scheduledPost: any): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Publishing scheduled post', {
        postId: scheduledPost._id,
        subreddit: scheduledPost.subreddit,
        title: scheduledPost.title,
      });

      // Create the post on Reddit
      const redditResponse = await redditApi.createPost(
        scheduledPost.accountId.toString(),
        scheduledPost.subreddit,
        {
          title: scheduledPost.title,
          content: scheduledPost.content || undefined,
          url: scheduledPost.url || undefined,
          nsfw: scheduledPost.nsfw,
          spoiler: scheduledPost.spoiler,
          flair: scheduledPost.flair || undefined,
        }
      );

      // Create a RedditPost record
      const redditPost = new RedditPost({
        redditPostId: redditResponse.id,
        subreddit: scheduledPost.subreddit,
        title: scheduledPost.title,
        content: scheduledPost.content || '',
        url: scheduledPost.url || undefined,
        mediaUrls: scheduledPost.mediaUrls || [],
        postedAt: new Date(redditResponse.created_utc * 1000),
        metrics: {
          score: redditResponse.score,
          upvotes: redditResponse.ups,
          downvotes: redditResponse.downs,
          comments: redditResponse.num_comments,
          awards: redditResponse.total_awards_received,
        },
        flair: redditResponse.link_flair_text || scheduledPost.flair,
        archived: redditResponse.archived,
        nsfw: redditResponse.over_18,
        spoiler: redditResponse.spoiler,
        locked: redditResponse.locked,
        edited: Boolean(redditResponse.edited),
        accountId: scheduledPost.accountId,
      });

      await redditPost.save();

      // Update scheduled post
      await scheduledPost.markPublished(redditResponse.id, redditPost._id);

      const duration = Date.now() - startTime;
      logger.info('Scheduled post published successfully', {
        postId: scheduledPost._id,
        redditPostId: redditResponse.id,
        duration,
      });

      // Update metrics
      redditApiCalls.inc({ endpoint: 'submit', method: 'POST', status: 'success' });
    } catch (error) {
      const duration = Date.now() - startTime;
      redditApiCalls.inc({ endpoint: 'submit', method: 'POST', status: 'error' });

      logger.error('Failed to publish scheduled post', {
        postId: scheduledPost._id,
        error,
        duration,
      });

      throw error;
    }
  }

  /**
   * Schedule a new post
   */
  async schedulePost(data: {
    title: string;
    content?: string;
    url?: string;
    mediaUrls?: string[];
    subreddit: string;
    scheduledFor: Date;
    nsfw?: boolean;
    spoiler?: boolean;
    flair?: string;
    accountId: string;
  }): Promise<any> {
    const scheduledPost = new ScheduledPost({
      title: data.title,
      content: data.content,
      url: data.url,
      mediaUrls: data.mediaUrls || [],
      subreddit: data.subreddit.toLowerCase(),
      scheduledFor: data.scheduledFor,
      status: 'pending',
      nsfw: data.nsfw || false,
      spoiler: data.spoiler || false,
      flair: data.flair,
      accountId: data.accountId,
    });

    await scheduledPost.save();

    // Update metric
    const pendingCount = await ScheduledPost.countDocuments({ status: 'pending' });
    scheduledPostsCount.set(pendingCount);

    logger.info('Post scheduled', {
      postId: scheduledPost._id,
      subreddit: data.subreddit,
      scheduledFor: data.scheduledFor,
    });

    return scheduledPost;
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(postId: string, accountId: string): Promise<void> {
    const scheduledPost = await ScheduledPost.findOne({
      _id: postId,
      accountId,
      status: 'pending',
    });

    if (!scheduledPost) {
      throw new Error('Scheduled post not found or already processed');
    }

    await scheduledPost.cancel();

    // Update metric
    const pendingCount = await ScheduledPost.countDocuments({ status: 'pending' });
    scheduledPostsCount.set(pendingCount);

    logger.info('Scheduled post cancelled', { postId });
  }

  /**
   * Get scheduled posts for an account
   */
  async getScheduledPosts(
    accountId: string,
    options: { limit?: number; skip?: number; status?: string } = {}
  ): Promise<any[]> {
    const { limit = 25, skip = 0, status } = options;

    const query: any = { accountId };
    if (status) {
      query.status = status;
    }

    return ScheduledPost.find(query)
      .sort({ scheduledFor: 1 })
      .skip(skip)
      .limit(limit);
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;