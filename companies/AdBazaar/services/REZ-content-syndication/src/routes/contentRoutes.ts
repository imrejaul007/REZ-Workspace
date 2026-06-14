import { Router, Request, Response } from 'express';
import { FeedStorage } from '../models/Storage';

export function createContentRoutes(storage: FeedStorage): Router {
  const router = Router();

  // Get all content items
  router.get('/', (req: Request, res: Response) => {
    const feedId = req.query.feedId as string | undefined;
    const postedOnly = req.query.posted === 'true';
    const unpostedOnly = req.query.unposted === 'true';

    let items = storage.getContentItems(feedId);

    if (postedOnly) {
      items = items.filter(i => i.isPosted);
    } else if (unpostedOnly) {
      items = items.filter(i => !i.isPosted && !i.error);
    }

    // Sort by date descending
    items.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  });

  // Get single content item
  router.get('/:id', (req: Request, res: Response) => {
    const item = storage.getContentItem(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Content item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  });

  // Preview transformed content
  router.post('/:id/preview', (req: Request, res: Response) => {
    const item = storage.getContentItem(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Content item not found'
      });
    }

    const feed = storage.getFeed(item.feedId);
    if (!feed) {
      return res.status(404).json({
        success: false,
        error: 'Associated feed not found'
      });
    }

    // Transform content using template
    let content = feed.template;
    content = content
      .replace(/\{\{title\}\}/g, item.title)
      .replace(/\{\{excerpt\}\}/g, item.excerpt || '')
      .replace(/\{\{content\}\}/g, item.content || item.excerpt || '')
      .replace(/\{\{link\}\}/g, item.link)
      .replace(/\{\{author\}\}/g, item.author || '')
      .replace(/\{\{categories\}\}/g, item.categories.join(', '))
      .replace(/\{\{pubDate\}\}/g, item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '');

    if (feed.tags.length > 0) {
      const hashtags = feed.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
      content += `\n\n${hashtags}`;
    }

    const isTruncated = content.length > feed.charLimit;
    if (isTruncated) {
      content = content.substring(0, feed.charLimit - 3) + '...';
    }

    res.json({
      success: true,
      data: {
        content,
        charCount: content.length,
        charLimit: feed.charLimit,
        isTruncated,
        platform: feed.platform
      }
    });
  });

  // Get content statistics
  router.get('/stats/overview', (req: Request, res: Response) => {
    const allItems = storage.getContentItems();
    const feeds = storage.getAllFeeds();

    const stats = {
      totalItems: allItems.length,
      totalPosted: allItems.filter(i => i.isPosted).length,
      totalPending: allItems.filter(i => !i.isPosted && !i.error).length,
      totalFailed: allItems.filter(i => i.error).length,
      totalFeeds: feeds.length,
      enabledFeeds: feeds.filter(f => f.enabled).length,
      lastSync: storage['data']?.lastSync || null,
      byFeed: feeds.map(feed => ({
        feedId: feed.id,
        feedName: feed.name,
        platform: feed.platform,
        items: storage.getContentItems(feed.id).length,
        posted: storage.getContentItems(feed.id).filter(i => i.isPosted).length
      }))
    };

    res.json({
      success: true,
      data: stats
    });
  });

  return router;
}
