/**
 * GENIE Browser History Service - Personal Web History Integration
 * Port: 4715
 *
 * Syncs browser history with personal memory for AI context.
 * Tracks visited URLs, search queries, and browsing patterns.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose, { Schema, model } from 'mongoose';
import rateLimit from 'express-rate-limit';
import { createLogger } from './utils/logger.js';
import { tenantMiddleware, TenantRequest } from './middleware/tenant.js';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_NAME = 'genie-browser-history-service';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4715', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-browser';
const logger = createLogger(SERVICE_NAME);

const app = express();

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());

// ============================================================================
// DATABASE MODELS
// ============================================================================

const BrowserSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  tenantId: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  device: String,
  browser: String,
  syncedAt: { type: Date, default: Date.now },
});

const BrowserHistorySchema = new Schema({
  visitId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  tenantId: String,
  sessionId: String,
  url: { type: String, required: true },
  title: String,
  domain: String,
  path: String,
  visitTime: Date,
  visitCount: { type: Number, default: 1 },
  timeSpent: Number, // seconds
  referrer: String,
  searchQuery: String,
  isBookmarked: { type: Boolean, default: false },
  favicon: String,
  metadata: mongoose.Schema.Types.Mixed,
  syncedAt: { type: Date, default: Date.now },
});

const BrowserBookmarkSchema = new Schema({
  bookmarkId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  tenantId: String,
  url: { type: String, required: true },
  title: String,
  domain: String,
  folder: String,
  tags: [String],
  createdAt: Date,
  syncedAt: { type: Date, default: Date.now },
});

const SearchQuerySchema = new Schema({
  queryId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  tenantId: String,
  query: String,
  searchEngine: String,
  resultsCount: Number,
  clickedUrl: String,
  timestamp: Date,
  syncedAt: { type: Date, default: Date.now },
});

export const BrowserSession = model('BrowserSession', BrowserSessionSchema);
export const BrowserHistory = model('BrowserHistory', BrowserHistorySchema);
export const BrowserBookmark = model('BrowserBookmark', BrowserBookmarkSchema);
export const SearchQuery = model('SearchQuery', SearchQuerySchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return '';
  }
}

function extractPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return '';
  }
}

function isSearchUrl(url: string): { isSearch: boolean; query?: string } {
  const searchEngines: Record<string, RegExp> = {
    google: /google\.com\/search\?q=(.+)/i,
    bing: /bing\.com\/search\?q=(.+)/i,
    duckduckgo: /duckduckgo\.com\/\?q=(.+)/i,
    yahoo: /search\.yahoo\.com\/search\?p=(.+)/i,
    baidu: /baidu\.com\/s\?wd=(.+)/i,
  };

  for (const [engine, pattern] of Object.entries(searchEngines)) {
    const match = url.match(pattern);
    if (match) {
      return { isSearch: true, query: decodeURIComponent(match[1]) };
    }
  }
  return { isSearch: false };
}

function categorizeUrl(url: string): string[] {
  const categories: string[] = [];
  const domain = extractDomain(url).toLowerCase();

  // Social media
  if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin')) {
    categories.push('social');
  }
  // Video
  if (domain.includes('youtube') || domain.includes('netflix') || domain.includes('twitch')) {
    categories.push('video');
  }
  // News
  if (domain.includes('news') || domain.includes('cnn') || domain.includes('bbc')) {
    categories.push('news');
  }
  // Shopping
  if (domain.includes('amazon') || domain.includes('ebay') || domain.includes('shop')) {
    categories.push('shopping');
  }
  // Work/Productivity
  if (domain.includes('slack') || domain.includes('notion') || domain.includes('github')) {
    categories.push('productivity');
  }

  return categories;
}

// ============================================================================
// ROUTES
// ============================================================================

// Add browser history entry
app.post('/api/browser/history', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const { visits } = req.body;

    if (!Array.isArray(visits)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_VISITS' } });
    }

    const inserted = [];
    for (const visit of visits) {
      const searchInfo = isSearchUrl(visit.url);
      const doc = new BrowserHistory({
        visitId: uuidv4(),
        userId,
        tenantId,
        sessionId: visit.sessionId,
        url: visit.url,
        title: visit.title,
        domain: extractDomain(visit.url),
        path: extractPath(visit.url),
        visitTime: new Date(visit.visitTime),
        timeSpent: visit.timeSpent,
        referrer: visit.referrer,
        searchQuery: searchInfo.query,
        favicon: visit.favicon,
        metadata: {
          categories: categorizeUrl(visit.url),
          isSearch: searchInfo.isSearch,
        },
      });
      await doc.save();
      inserted.push(doc);
    }

    logger.info('history_added', { userId, count: inserted.length });
    res.json({ success: true, data: { inserted: inserted.length } });
  } catch (error) {
    logger.error('history_add_failed', { error });
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add search query
app.post('/api/browser/searches', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const { searches } = req.body;

    if (!Array.isArray(searches)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SEARCHES' } });
    }

    const inserted = [];
    for (const search of searches) {
      const doc = new SearchQuery({
        queryId: uuidv4(),
        userId,
        tenantId,
        query: search.query,
        searchEngine: search.searchEngine,
        resultsCount: search.resultsCount,
        clickedUrl: search.clickedUrl,
        timestamp: new Date(search.timestamp),
      });
      await doc.save();
      inserted.push(doc);
    }

    res.json({ success: true, data: { inserted: inserted.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add bookmark
app.post('/api/browser/bookmarks', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const { bookmarks } = req.body;

    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_BOOKMARKS' } });
    }

    const inserted = [];
    for (const bookmark of bookmarks) {
      const doc = new BrowserBookmark({
        bookmarkId: uuidv4(),
        userId,
        tenantId,
        url: bookmark.url,
        title: bookmark.title,
        domain: extractDomain(bookmark.url),
        folder: bookmark.folder,
        tags: bookmark.tags,
        createdAt: new Date(bookmark.createdAt),
      });
      await doc.save();
      inserted.push(doc);
    }

    res.json({ success: true, data: { inserted: inserted.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get browsing history
app.get('/api/browser/history', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { startDate, endDate, domain, limit = 100 } = req.query;

    let query: any = { userId };

    if (startDate || endDate) {
      query.visitTime = {};
      if (startDate) query.visitTime.$gte = new Date(startDate as string);
      if (endDate) query.visitTime.$lte = new Date(endDate as string);
    }

    if (domain) query.domain = { $regex: domain as string, $options: 'i' };

    const history = await BrowserHistory.find(query)
      .sort({ visitTime: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get bookmarks
app.get('/api/browser/bookmarks', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { folder, tags, limit = 100 } = req.query;

    let query: any = { userId };
    if (folder) query.folder = folder;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const bookmarks = await BrowserBookmark.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get search history
app.get('/api/browser/searches', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { limit = 50 } = req.query;

    const searches = await SearchQuery.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: searches });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get browsing stats
app.get('/api/browser/stats', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Top domains
    const topDomains = await BrowserHistory.aggregate([
      { $match: { userId, visitTime: { $gte: startDate } } },
      { $group: { _id: '$domain', count: { $sum: 1 }, totalTime: { $sum: '$timeSpent' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Daily activity
    const dailyActivity = await BrowserHistory.aggregate([
      { $match: { userId, visitTime: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitTime' } },
          visits: { $sum: 1 },
          uniqueSites: { $addToSet: '$domain' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await BrowserHistory.aggregate([
      { $match: { userId, visitTime: { $gte: startDate } } },
      { $unwind: '$metadata.categories' },
      { $group: { _id: '$metadata.categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        topDomains,
        dailyActivity,
        categoryBreakdown,
        period: `${days} days`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get interests based on browsing
app.get('/api/browser/interests', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};

    // Extract interests from browsing patterns
    const interests = await BrowserHistory.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$domain',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' },
        searchQueries: { $addToSet: '$searchQuery' },
      }},
      { $match: { count: { $gte: 3 } } }, // At least 3 visits
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Extract topics from search queries
    const topicQueries = await SearchQuery.aggregate([
      { $match: { userId } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      success: true,
      data: {
        interests,
        topicQueries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Memory context - Get browsing context for AI
app.get('/api/browser/memory/context', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { limit = 20 } = req.query;

    const recentHistory = await BrowserHistory.find({ userId })
      .sort({ visitTime: -1 })
      .limit(Number(limit))
      .select('url title domain visitTime searchQuery');

    const context = recentHistory.map((h) => ({
      type: 'browsing',
      url: h.url,
      title: h.title,
      domain: h.domain,
      timestamp: h.visitTime,
      wasSearch: !!h.searchQuery,
    }));

    res.json({ success: true, data: context });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Health endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: SERVICE_NAME, version: SERVICE_VERSION });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  res.json({
    status: mongoState === 1 ? 'ready' : 'not_ready',
    checks: { mongodb: mongoState === 1 ? 'connected' : 'disconnected' }
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled_error', { error: err.message });
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected');

    app.listen(PORT, () => {
      console.log(`\n  ╔════════════════════════════════════════════╗`);
      console.log(`  ║   GENIE Browser History (v${SERVICE_VERSION})     ║`);
      console.log(`  ║   Port: ${PORT}                             ║`);
      console.log(`  ║   "You don't use Genie. You talk to Genie." ║`);
      console.log(`  ╚════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    logger.error('start_failed', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

start();

export default app;
