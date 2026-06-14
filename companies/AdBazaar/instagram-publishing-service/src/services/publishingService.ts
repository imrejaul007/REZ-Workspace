import { PublishRequest, PublishedContent, InstagramAccount } from '../models/index.js';
import { instagramApiService } from './instagramApiService.js';
import logger from 'utils/logger.js';
import { NotFoundError, InstagramAPIError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

// Types
export interface PublishContentInput {
  accountId: string;
  contentType: 'feed_image' | 'feed_album' | 'feed_video' | 'reel' | 'story';
  mediaUrl?: string;
  mediaUrls?: string[];
  caption?: string;
  hashtags?: string[];
  location?: { id: string; name: string };
  userTags?: string[];
  productTags?: { productId: string; x: number; y: number }[];
  storyConfig?: {
    type: 'image' | 'video' | 'poll' | 'question' | 'link';
    pollQuestion?: string;
    pollOptions?: string[];
    question?: string;
    linkUrl?: string;
    stickerElements?: Record<string, unknown>[];
  };
  firstComment?: string;
}

export interface ScheduleContentInput extends PublishContentInput {
  scheduledTime: Date;
}

export interface PublishResult {
  success: boolean;
  publishRequestId: string;
  publishedContentId?: string;
  instagramMediaId?: string;
  instagramPermalink?: string;
  error?: string;
}

// Publishing Service
export class PublishingService {
  private schedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Publish content immediately
   */
  async publishContent(input: PublishContentInput): Promise<PublishResult> {
    try {
      // Get the account
      const account = await InstagramAccount.findByAccount(input.accountId);
      if (!account) {
        throw new NotFoundError('Instagram account');
      }

      // Create publish request
      const publishRequest = new PublishRequest({
        accountId: input.accountId,
        contentType: input.contentType,
        mediaUrl: input.mediaUrl,
        mediaUrls: input.mediaUrls,
        caption: this.buildCaption(input.caption, input.hashtags),
        hashtags: input.hashtags,
        location: input.location,
        userTags: input.userTags,
        productTags: input.productTags,
        storyConfig: input.storyConfig,
        firstComment: input.firstComment,
        status: 'publishing',
      });

      await publishRequest.save();

      // Build full caption with hashtags
      const fullCaption = this.buildCaption(input.caption, input.hashtags);

      // Create media container based on content type
      let containerId: string;
      switch (input.contentType) {
        case 'feed_image':
          if (!input.mediaUrl) throw new Error('Media URL is required for feed image');
          const imageContainer = await instagramApiService.createImageMedia(input.mediaUrl, fullCaption);
          containerId = imageContainer.id;
          break;

        case 'feed_album':
          if (!input.mediaUrls || input.mediaUrls.length === 0) {
            throw new Error('Media URLs are required for album');
          }
          const albumContainer = await instagramApiService.createAlbumMedia(input.mediaUrls, fullCaption);
          containerId = albumContainer.id;
          break;

        case 'feed_video':
        case 'reel':
          if (!input.mediaUrl) throw new Error('Media URL is required for video');
          const videoContainer = await instagramApiService.createVideoMedia(
            input.mediaUrl,
            fullCaption,
            input.contentType === 'reel' ? 'REELS' : 'FEED'
          );
          containerId = videoContainer.id;
          break;

        case 'story':
          if (!input.mediaUrl) throw new Error('Media URL is required for story');
          const storyContainer = await instagramApiService.createStoryMedia(input.mediaUrl);
          containerId = storyContainer.id;
          break;

        default:
          throw new Error(`Unsupported content type: ${input.contentType}`);
      }

      // Publish the content
      const publishResult = await instagramApiService.publishContent(containerId);

      // Get media details
      const mediaDetails = await instagramApiService.getMediaDetails(publishResult.id);

      // Create published content record
      const publishedContent = new PublishedContent({
        instagramMediaId: publishResult.id,
        instagramPermalink: mediaDetails.permalink || publishResult.permalink || '',
        accountId: input.accountId,
        contentType: input.contentType,
        caption: fullCaption,
        mediaUrl: input.mediaUrl,
        mediaUrls: input.mediaUrls,
        thumbnailUrl: mediaDetails.thumbnail_url,
        status: 'published',
        publishedAt: new Date(),
        mediaType: this.mapMediaType(input.contentType),
        username: mediaDetails.username,
        likeCount: mediaDetails.like_count,
        commentsCount: mediaDetails.comments_count,
        timestamp: mediaDetails.timestamp ? new Date(mediaDetails.timestamp) : undefined,
      });

      await publishedContent.save();

      // Update publish request
      publishRequest.markAsPublished(publishedContent._id.toString());
      await publishRequest.save();

      // Add first comment if provided
      if (input.firstComment) {
        try {
          await instagramApiService.addComment(publishResult.id, input.firstComment);
        } catch (commentError) {
          logger.warn('Could not add first comment', { error: commentError });
        }
      }

      // Update account last publish time
      account.recordPublish();
      await account.save();

      logger.info('Content published successfully', {
        publishRequestId: publishRequest._id,
        publishedContentId: publishedContent._id,
        instagramMediaId: publishResult.id,
        contentType: input.contentType,
      });

      return {
        success: true,
        publishRequestId: publishRequest._id.toString(),
        publishedContentId: publishedContent._id.toString(),
        instagramMediaId: publishResult.id,
        instagramPermalink: mediaDetails.permalink || '',
      };
    } catch (error) {
      logger.error('Failed to publish content', { error, input });

      // Update publish request with error
      const publishRequest = await PublishRequest.findOne({
        accountId: input.accountId,
        status: 'publishing',
      }).sort({ createdAt: -1 });

      if (publishRequest) {
        publishRequest.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
        await publishRequest.save();
      }

      return {
        success: false,
        publishRequestId: publishRequest?._id.toString() || '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule content for future publishing
   */
  async scheduleContent(input: ScheduleContentInput): Promise<{ scheduleId: string }> {
    // Validate scheduled time is in the future
    if (new Date(input.scheduledTime) <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const publishRequest = new PublishRequest({
      accountId: input.accountId,
      contentType: input.contentType,
      mediaUrl: input.mediaUrl,
      mediaUrls: input.mediaUrls,
      caption: this.buildCaption(input.caption, input.hashtags),
      hashtags: input.hashtags,
      location: input.location,
      userTags: input.userTags,
      productTags: input.productTags,
      storyConfig: input.storyConfig,
      scheduledTime: input.scheduledTime,
      firstComment: input.firstComment,
      status: 'scheduled',
    });

    await publishRequest.save();

    logger.info('Content scheduled', {
      scheduleId: publishRequest._id,
      scheduledTime: input.scheduledTime,
    });

    return {
      scheduleId: publishRequest._id.toString(),
    };
  }

  /**
   * Save content as draft
   */
  async saveDraft(input: PublishContentInput): Promise<{ draftId: string }> {
    const publishRequest = new PublishRequest({
      accountId: input.accountId,
      contentType: input.contentType,
      mediaUrl: input.mediaUrl,
      mediaUrls: input.mediaUrls,
      caption: input.caption,
      hashtags: input.hashtags,
      location: input.location,
      userTags: input.userTags,
      productTags: input.productTags,
      storyConfig: input.storyConfig,
      firstComment: input.firstComment,
      status: 'draft',
    });

    await publishRequest.save();

    logger.info('Draft saved', { draftId: publishRequest._id });

    return {
      draftId: publishRequest._id.toString(),
    };
  }

  /**
   * Get all drafts for an account
   */
  async getDrafts(accountId: string): Promise<unknown[]> {
    const drafts = await PublishRequest.findByAccount(accountId, 'draft');
    return drafts;
  }

  /**
   * Get content by ID
   */
  async getContent(contentId: string): Promise<unknown> {
    // Try to find in published content first
    let content = await PublishedContent.findById(contentId);
    if (content) {
      return content;
    }

    // Try to find in publish requests
    content = await PublishRequest.findById(contentId);
    if (content) {
      return content;
    }

    throw new NotFoundError('Content');
  }

  /**
   * Delete content
   */
  async deleteContent(contentId: string): Promise<{ success: boolean }> {
    // Try to delete from published content
    const publishedContent = await PublishedContent.findByIdAndDelete(contentId);
    if (publishedContent) {
      logger.info('Published content deleted', { contentId });
      return { success: true };
    }

    // Try to delete from publish requests
    const publishRequest = await PublishRequest.findByIdAndDelete(contentId);
    if (publishRequest) {
      logger.info('Publish request deleted', { contentId });
      return { success: true };
    }

    throw new NotFoundError('Content');
  }

  /**
   * Get all content for an account
   */
  async getAccountContent(
    accountId: string,
    options: { page?: number; limit?: number; contentType?: string } = {}
  ): Promise<{ content: unknown[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { accountId };
    if (options.contentType) {
      query.contentType = options.contentType;
    }

    const [content, total] = await Promise.all([
      PublishedContent.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      PublishedContent.countDocuments(query),
    ]);

    return {
      content,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update content metrics
   */
  async updateMetrics(contentId: string): Promise<void> {
    const content = await PublishedContent.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content');
    }

    try {
      const insights = await instagramApiService.getMediaInsights(content.instagramMediaId);

      content.metrics = {
        likes: insights.likes,
        comments: insights.comments,
        saves: insights.saves,
        reach: insights.reach,
        impressions: insights.impressions,
        profileVisits: insights.profile_visits,
        follows: insights.followers,
      };

      await content.save();
      logger.info('Content metrics updated', { contentId });
    } catch (error) {
      logger.error('Failed to update metrics', { contentId, error });
    }
  }

  /**
   * Start the scheduler for scheduled content
   */
  startScheduler(): void {
    if (this.schedulerInterval) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info('Starting scheduler', { intervalMs: config.scheduler.intervalMs });

    this.schedulerInterval = setInterval(async () => {
      await this.processScheduledContent();
    }, config.scheduler.intervalMs);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Process scheduled content
   */
  private async processScheduledContent(): Promise<void> {
    try {
      const scheduledContent = await PublishRequest.findScheduled();

      for (const request of scheduledContent) {
        logger.info('Processing scheduled content', { requestId: request._id });

        const result = await this.publishContent({
          accountId: request.accountId,
          contentType: request.contentType as 'feed_image' | 'feed_album' | 'feed_video' | 'reel' | 'story',
          mediaUrl: request.mediaUrl,
          mediaUrls: request.mediaUrls,
          caption: request.caption,
          hashtags: request.hashtags,
          location: request.location,
          userTags: request.userTags,
          productTags: request.productTags,
          storyConfig: request.storyConfig,
          firstComment: request.firstComment,
        });

        if (!result.success) {
          logger.error('Failed to publish scheduled content', {
            requestId: request._id,
            error: result.error,
          });
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled content', { error });
    }
  }

  /**
   * Build caption with hashtags
   */
  private buildCaption(caption?: string, hashtags?: string[]): string {
    const parts: string[] = [];
    if (caption) parts.push(caption);
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map((tag) => `#${tag}`).join(' ');
      parts.push(hashtagString);
    }
    return parts.join('\n\n');
  }

  /**
   * Map content type to Instagram media type
   */
  private mapMediaType(contentType: string): 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'STORY' {
    switch (contentType) {
      case 'feed_image':
        return 'IMAGE';
      case 'feed_album':
        return 'CAROUSEL_ALBUM';
      case 'feed_video':
      case 'reel':
        return 'VIDEO';
      case 'story':
        return 'STORY';
      default:
        return 'IMAGE';
    }
  }
}

// Export singleton instance
export const publishingService = new PublishingService();
export default publishingService;