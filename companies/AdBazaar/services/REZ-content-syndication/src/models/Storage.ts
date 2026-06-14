import * as fs from 'fs';
import * as path from 'path';
import { Feed, ContentItem, FeedStats } from './types';

interface StorageData {
  feeds: Record<string, Feed>;
  contentItems: Record<string, ContentItem>;
  lastSync: string;
}

export class FeedStorage {
  private dataPath: string;
  private data: StorageData;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || process.env.STORAGE_PATH || './data/feeds.json';
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (error) {
      logger.error('Failed to load feed data:', error);
    }
    return { feeds: {}, contentItems: {}, lastSync: new Date().toISOString() };
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      logger.error('Failed to save feed data:', error);
    }
  }

  // Feed CRUD
  getAllFeeds(): Feed[] {
    return Object.values(this.data.feeds);
  }

  getFeed(id: string): Feed | undefined {
    return this.data.feeds[id];
  }

  createFeed(feed: Feed): Feed {
    this.data.feeds[feed.id] = feed;
    this.saveData();
    return feed;
  }

  updateFeed(id: string, updates: Partial<Feed>): Feed | undefined {
    if (!this.data.feeds[id]) return undefined;
    this.data.feeds[id] = { ...this.data.feeds[id], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    return this.data.feeds[id];
  }

  deleteFeed(id: string): boolean {
    if (!this.data.feeds[id]) return false;
    delete this.data.feeds[id];
    // Also delete associated content items
    Object.keys(this.data.contentItems).forEach(key => {
      if (this.data.contentItems[key].feedId === id) {
        delete this.data.contentItems[key];
      }
    });
    this.saveData();
    return true;
  }

  // Content Items
  getContentItems(feedId?: string): ContentItem[] {
    const items = Object.values(this.data.contentItems);
    if (feedId) {
      return items.filter(item => item.feedId === feedId);
    }
    return items;
  }

  getContentItem(id: string): ContentItem | undefined {
    return this.data.contentItems[id];
  }

  addContentItem(item: ContentItem): ContentItem {
    this.data.contentItems[item.id] = item;
    this.saveData();
    return item;
  }

  updateContentItem(id: string, updates: Partial<ContentItem>): ContentItem | undefined {
    if (!this.data.contentItems[id]) return undefined;
    this.data.contentItems[id] = { ...this.data.contentItems[id], ...updates };
    this.saveData();
    return this.data.contentItems[id];
  }

  // Get unposted items for a feed
  getUnpostedItems(feedId: string): ContentItem[] {
    return Object.values(this.data.contentItems)
      .filter(item => item.feedId === feedId && !item.isPosted && !item.error);
  }

  // Feed Stats
  getFeedStats(feedId: string): FeedStats {
    const items = this.getContentItems(feedId);
    const postedItems = items.filter(i => i.isPosted);
    const failedItems = items.filter(i => i.error);

    // Calculate average items per day
    const now = new Date();
    const createdDates = items.map(i => new Date(i.createdAt).getTime());
    const oldestDate = createdDates.length > 0 ? Math.min(...createdDates) : now.getTime();
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - oldestDate) / (1000 * 60 * 60 * 24)));

    return {
      feedId,
      totalItems: items.length,
      postedItems: postedItems.length,
      failedItems: failedItems.length,
      lastSyncAt: this.data.lastSync,
      averageItemsPerDay: Math.round((items.length / daysDiff) * 10) / 10
    };
  }

  // Get all unposted items across all feeds
  getAllUnpostedItems(): ContentItem[] {
    return Object.values(this.data.contentItems)
      .filter(item => !item.isPosted && !item.error);
  }

  // Cleanup old items (keep last N items per feed)
  cleanupOldItems(maxItemsPerFeed: number = 100): void {
    const feedIds = [...new Set(Object.values(this.data.contentItems).map(i => i.feedId))];

    feedIds.forEach(feedId => {
      const feedItems = this.getContentItems(feedId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (feedItems.length > maxItemsPerFeed) {
        feedItems.slice(maxItemsPerFeed).forEach(item => {
          delete this.data.contentItems[item.id];
        });
      }
    });

    this.saveData();
  }

  updateLastSync(): void {
    this.data.lastSync = new Date().toISOString();
    this.saveData();
  }
}
