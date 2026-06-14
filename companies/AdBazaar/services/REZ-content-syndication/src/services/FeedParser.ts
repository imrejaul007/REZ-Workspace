import Parser from 'rss-parser';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ContentItem, Feed } from '../models/types';
import { FeedStorage } from '../models/Storage';
import logger from '../utils/logger';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'REZ-Content-Syndication/1.0'
  },
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

export class FeedParserService {
  private storage: FeedStorage;

  constructor(storage: FeedStorage) {
    this.storage = storage;
  }

  /**
   * Parse an RSS/Atom feed URL and extract content items
   */
  async parseFeed(feed: Feed): Promise<ContentItem[]> {
    try {
      logger.info(`Fetching feed: ${feed.url}`);

      // Fetch and parse the feed
      const parsed = await parser.parseURL(feed.url);

      const items: ContentItem[] = [];
      const maxItems = parseInt(process.env.MAX_FEED_ITEMS || '50');

      for (const item of parsed.items.slice(0, maxItems)) {
        // Generate a unique ID for this item
        const itemId = this.generateItemId(feed.id, item.link || item.guid || item.title || '');

        // Check if we already have this item
        const existing = this.storage.getContentItem(itemId);
        if (existing) continue;

        // Extract content
        const content = this.extractContent(item, feed);

        const contentItem: ContentItem = {
          id: itemId,
          feedId: feed.id,
          title: item.title || 'Untitled',
          link: item.link || '',
          excerpt: this.extractExcerpt(item),
          content: content,
          pubDate: item.pubDate || item.isoDate,
          author: item.creator || item.author || parsed.creator,
          categories: item.categories || [],
          mediaThumbnail: (item as any).mediaThumbnail?.['$']?.url ||
                         (item as any).mediaContent?.['$']?.url,
          isPosted: false,
          createdAt: new Date().toISOString()
        };

        items.push(contentItem);
      }

      // Save new items
      items.forEach(item => this.storage.addContentItem(item));

      // Update feed last fetched time
      this.storage.updateFeed(feed.id, {
        lastFetchedAt: new Date().toISOString(),
        lastError: undefined
      });

      logger.info(`Parsed ${items.length} new items from ${feed.url}`);
      return items;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      // Update feed with error
      this.storage.updateFeed(feed.id, {
        lastError: errorMessage
      });

      logger.error(`Failed to parse feed ${feed.url}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Fetch a single feed
   */
  async fetchFeed(feed: Feed): Promise<ContentItem[]> {
    return this.parseFeed(feed);
  }

  /**
   * Fetch all enabled feeds
   */
  async fetchAllFeeds(): Promise<Map<string, ContentItem[]>> {
    const results = new Map<string, ContentItem[]>();
    const feeds = this.storage.getAllFeeds().filter(f => f.enabled);

    for (const feed of feeds) {
      try {
        const items = await this.fetchFeed(feed);
        results.set(feed.id, items);
      } catch (error) {
        logger.error(`Failed to fetch feed ${feed.id}:`, error);
        results.set(feed.id, []);
      }
    }

    this.storage.updateLastSync();
    return results;
  }

  /**
   * Extract plain text content from RSS item
   */
  private extractContent(item: Parser.Item & Record<string, any>, feed: Feed): string {
    // Try various content fields
    const contentEncoded = item.contentEncoded || item['content:encoded'];
    const content = item.content || item['content:snippet'];

    const rawContent = contentEncoded || content || item.summary || '';

    // Strip HTML tags
    return rawContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
  }

  /**
   * Extract excerpt from item
   */
  private extractExcerpt(item: Parser.Item & Record<string, any>): string {
    const content = item.contentSnippet || item.summary || item.content || '';

    // Strip HTML and truncate
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  /**
   * Generate stable ID for content item
   */
  private generateItemId(feedId: string, identifier: string): string {
    const combined = `${feedId}:${identifier}`;
    // Use simple hash for ID
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `item_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  }

  /**
   * Validate feed URL is accessible
   */
  async validateFeedUrl(url: string): Promise<{ valid: boolean; title?: string; error?: string }> {
    try {
      const parsed = await parser.parseURL(url);
      return {
        valid: true,
        title: parsed.title || parsed.link
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid or unreachable feed URL'
      };
    }
  }
}
