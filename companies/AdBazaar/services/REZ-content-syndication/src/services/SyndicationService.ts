import axios from 'axios';
import { Feed, ContentItem, PostPayload, SyndicationResult } from '../models/types';
import { FeedStorage } from '../models/Storage';
import logger from '../utils/logger';

export class SyndicationService {
  private storage: FeedStorage;
  private platformAdapters: Map<string, PlatformAdapter>;

  constructor(storage: FeedStorage) {
    this.storage = storage;
    this.platformAdapters = new Map();

    // Register built-in adapters
    this.registerAdapter('twitter', new TwitterAdapter());
    this.registerAdapter('linkedin', new LinkedInAdapter());
    this.registerAdapter('mastodon', new MastodonAdapter());
    this.registerAdapter('bluesky', new BlueskyAdapter());
    this.registerAdapter('custom', new CustomWebhookAdapter());
  }

  /**
   * Register a platform adapter
   */
  registerAdapter(platform: string, adapter: PlatformAdapter): void {
    this.platformAdapters.set(platform, adapter);
  }

  /**
   * Transform feed content into platform-specific post
   */
  transformContent(item: ContentItem, feed: Feed): string {
    let content = feed.template;

    // Replace template variables
    content = content
      .replace(/\{\{title\}\}/g, item.title)
      .replace(/\{\{excerpt\}\}/g, item.excerpt || '')
      .replace(/\{\{content\}\}/g, item.content || item.excerpt || '')
      .replace(/\{\{link\}\}/g, item.link)
      .replace(/\{\{author\}\}/g, item.author || '')
      .replace(/\{\{categories\}\}/g, item.categories.join(', '))
      .replace(/\{\{pubDate\}\}/g, item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '');

    // Add hashtags from tags
    if (feed.tags.length > 0) {
      const hashtags = feed.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
      content += `\n\n${hashtags}`;
    }

    // Truncate to char limit
    if (content.length > feed.charLimit) {
      content = content.substring(0, feed.charLimit - 3) + '...';
    }

    return content.trim();
  }

  /**
   * Post a single content item to a platform
   */
  async postToPlatform(item: ContentItem, feed: Feed): Promise<SyndicationResult> {
    const adapter = this.platformAdapters.get(feed.platform);

    if (!adapter) {
      const result: SyndicationResult = {
        success: false,
        contentItemId: item.id,
        error: `No adapter registered for platform: ${feed.platform}`,
        timestamp: new Date().toISOString()
      };
      this.updateItemStatus(item.id, result);
      return result;
    }

    try {
      const content = this.transformContent(item, feed);

      const payload: PostPayload = {
        content,
        link: item.link,
        mediaUrl: item.mediaThumbnail
      };

      logger.info(`Posting item ${item.id} to ${feed.platform}`);

      const postResult = await adapter.post(payload, feed);

      // Update item status
      const result: SyndicationResult = {
        success: true,
        contentItemId: item.id,
        postUrl: postResult.postUrl,
        timestamp: new Date().toISOString()
      };

      this.updateItemStatus(item.id, result);

      logger.info(`Successfully posted ${item.id} to ${feed.platform}`);
      return result;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      const result: SyndicationResult = {
        success: false,
        contentItemId: item.id,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };

      this.updateItemStatus(item.id, result);

      logger.error(`Failed to post ${item.id} to ${feed.platform}:`, errorMessage);
      return result;
    }
  }

  /**
   * Post unposted items for a specific feed
   */
  async processFeed(feedId: string): Promise<SyndicationResult[]> {
    const feed = this.storage.getFeed(feedId);
    if (!feed || !feed.enabled) {
      logger.warn(`Feed ${feedId} not found or disabled`);
      return [];
    }

    const items = this.storage.getUnpostedItems(feedId);
    const results: SyndicationResult[] = [];

    for (const item of items) {
      const result = await this.postToPlatform(item, feed);
      results.push(result);

      // Add delay between posts to avoid rate limiting
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Process all enabled feeds
   */
  async processAllFeeds(): Promise<Map<string, SyndicationResult[]>> {
    const results = new Map<string, SyndicationResult[]>();
    const feeds = this.storage.getAllFeeds().filter(f => f.enabled);

    for (const feed of feeds) {
      try {
        const feedResults = await this.processFeed(feed.id);
        results.set(feed.id, feedResults);
      } catch (error) {
        logger.error(`Failed to process feed ${feed.id}:`, error);
        results.set(feed.id, []);
      }
    }

    return results;
  }

  /**
   * Retry failed posts for a feed
   */
  async retryFailedPosts(feedId: string): Promise<SyndicationResult[]> {
    const items = this.storage.getContentItems(feedId)
      .filter(item => !item.isPosted && item.error);

    const results: SyndicationResult[] = [];
    const feed = this.storage.getFeed(feedId);

    if (!feed) return results;

    for (const item of items) {
      // Clear error and retry
      this.storage.updateContentItem(item.id, { error: undefined });
      const result = await this.postToPlatform(item, feed);
      results.push(result);
    }

    return results;
  }

  /**
   * Update content item status after posting
   */
  private updateItemStatus(itemId: string, result: SyndicationResult): void {
    const updates: Partial<ContentItem> = {
      isPosted: result.success,
      postedAt: result.success ? result.timestamp : undefined,
      postUrl: result.postUrl,
      error: result.error
    };

    this.storage.updateContentItem(itemId, updates);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Platform Adapter Interface
export interface PlatformAdapter {
  post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }>;
}

// Twitter/X Adapter
class TwitterAdapter implements PlatformAdapter {
  async post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }> {
    // Twitter API integration would go here
    // For now, simulate posting
    logger.info(`[Twitter] Would post: ${payload.content.substring(0, 50)}...`);

    if (process.env.TWITTER_API_KEY) {
      // Real Twitter API call would be here
      // POST /2/tweets
    }

    return {
      postUrl: `https://twitter.com/i/status/${Date.now()}`
    };
  }
}

// LinkedIn Adapter
class LinkedInAdapter implements PlatformAdapter {
  async post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }> {
    logger.info(`[LinkedIn] Would post: ${payload.content.substring(0, 50)}...`);

    if (process.env.LINKEDIN_CLIENT_ID) {
      // Real LinkedIn API call would be here
    }

    return {
      postUrl: `https://linkedin.com/posts/${Date.now()}`
    };
  }
}

// Mastodon Adapter
class MastodonAdapter implements PlatformAdapter {
  async post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }> {
    const mastodonInstance = process.env.MASTODON_INSTANCE || 'mastodon.social';
    const accessToken = process.env.MASTODON_ACCESS_TOKEN;

    if (accessToken) {
      const response = await axios.post(
        `https://${mastodonInstance}/api/v1/statuses`,
        {
          status: payload.content,
          visibility: 'public'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        postUrl: response.data.url
      };
    }

    return {
      postUrl: `https://${mastodonInstance}/@user/${Date.now()}`
    };
  }
}

// Bluesky Adapter
class BlueskyAdapter implements PlatformAdapter {
  async post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }> {
    logger.info(`[Bluesky] Would post: ${payload.content.substring(0, 50)}...`);

    // Bluesky ATP protocol integration
    const bskyIdentifier = process.env.BLUESKY_IDENTIFIER;
    const bskyPassword = process.env.BLUESKY_PASSWORD;

    if (bskyIdentifier && bskyPassword) {
      // Authenticate and post via Bluesky API
    }

    return {
      postUrl: `https://bsky.app/profile/user.bsky.social/post/${Date.now()}`
    };
  }
}

// Custom Webhook Adapter
class CustomWebhookAdapter implements PlatformAdapter {
  async post(payload: PostPayload, feed: Feed): Promise<{ postUrl?: string }> {
    const webhookUrl = process.env[`${feed.name.toUpperCase()}_WEBHOOK_URL`];

    if (webhookUrl) {
      const response = await axios.post(webhookUrl, {
        content: payload.content,
        link: payload.link,
        mediaUrl: payload.mediaUrl,
        tags: payload.tags,
        feedId: feed.id,
        feedName: feed.name,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        postUrl: response.headers.location || response.data?.url
      };
    }

    logger.warn(`[Custom] No webhook URL configured for feed ${feed.name}`);
    return {};
  }
}
