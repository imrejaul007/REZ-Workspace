/**
 * GENIE Notion Service - Personal Knowledge Base Integration
 * Port: 4713
 *
 * Syncs Notion workspaces with personal memory for AI context.
 * Supports pages, databases, and comments.
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

const SERVICE_NAME = 'genie-notion-service';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4713', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-notion';
const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const logger = createLogger(SERVICE_NAME);

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());

// ============================================================================
// DATABASE MODELS
// ============================================================================

const NotionPageSchema = new Schema({
  notionPageId: { type: String, required: true, unique: true },
  workspaceId: String,
  title: String,
  content: String,
  plainText: String,
  url: String,
  coverUrl: String,
  icon: String,
  createdTime: Date,
  lastEditedTime: Date,
  archived: { type: Boolean, default: false },
  properties: mongoose.Schema.Types.Mixed,
  parentId: String,
  parentType: String,
  syncedAt: { type: Date, default: Date.now },
  userId: String,
  tenantId: String,
});

const NotionDatabaseSchema = new Schema({
  notionDatabaseId: { type: String, required: true, unique: true },
  workspaceId: String,
  title: String,
  description: String,
  url: String,
  icon: String,
  coverUrl: String,
  schema: mongoose.Schema.Types.Mixed,
  createdTime: Date,
  lastEditedTime: Date,
  archived: { type: Boolean, default: false },
  syncedAt: { type: Date, default: Date.now },
  userId: String,
  tenantId: String,
});

const NotionSyncSchema = new Schema({
  workspaceId: { type: String, required: true },
  lastSyncTime: Date,
  pagesSynced: { type: Number, default: 0 },
  databasesSynced: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'syncing', 'completed', 'failed'], default: 'pending' },
  error: String,
  userId: String,
  tenantId: String,
});

const NotionConnectionSchema = new Schema({
  userId: { type: String, required: true },
  tenantId: String,
  accessToken: { type: String, required: true },
  workspaceId: String,
  workspaceName: String,
  workspaceIcon: String,
  connectedAt: { type: Date, default: Date.now },
  lastSyncedAt: Date,
  isActive: { type: Boolean, default: true },
});

export const NotionPage = model('NotionPage', NotionPageSchema);
export const NotionDatabase = model('NotionDatabase', NotionDatabaseSchema);
export const NotionSync = model('NotionSync', NotionSyncSchema);
export const NotionConnection = model('NotionConnection', NotionConnectionSchema);

// ============================================================================
// NOTION API HELPER
// ============================================================================

interface NotionResponse<T> {
  data: T;
  hasMore: boolean;
  nextCursor: string | null;
}

class NotionClient {
  private apiKey: string;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<NotionResponse<T>> {
    if (!this.apiKey) {
      throw new Error('NOTION_API_KEY not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      data,
      hasMore: data.has_more || false,
      nextCursor: data.next_cursor || null,
    };
  }

  async search(query?: string, filter?: { property: string; value: string }) {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        filter,
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 100,
      }),
    });
  }

  async getPage(pageId: string) {
    const result = await this.request<any>(`/pages/${pageId}`);
    return result.data;
  }

  async getPageContent(pageId: string) {
    return this.request<any[]>(`/blocks/${pageId}/children`, {
      method: 'GET',
    });
  }

  async getDatabase(databaseId: string) {
    return this.request<any>(`/databases/${databaseId}`);
  }

  async queryDatabase(databaseId: string, query: any = {}) {
    return this.request<any[]>(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async getUser(userId: string) {
    return this.request<any>(`/users/${userId}`);
  }

  async getCurrentUser() {
    return this.request<any>('/users/me');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractPlainText(block: any): string {
  if (!block) return '';

  const text = block.rich_text || [];
  if (!Array.isArray(text)) return '';

  return text.map((t: any) => t.plain_text || '').join('');
}

function extractTitle(page: any): string {
  if (page.properties?.title?.title) {
    return page.properties.title.title.map((t: any) => t.plain_text).join('');
  }
  if (page.properties?.Name?.title) {
    return page.properties.Name.title.map((t: any) => t.plain_text).join('');
  }
  return page.title || 'Untitled';
}

// ============================================================================
// ROUTES
// ============================================================================

// Connect Notion workspace
app.post('/api/notion/connect', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Access token required' } });
    }

    // Verify token by getting current user
    const client = new NotionClient(accessToken);
    const notionUser = await client.getCurrentUser();

    const connection = await NotionConnection.findOneAndUpdate(
      { userId },
      {
        accessToken,
        workspaceId: notionUser.data.id,
        workspaceName: notionUser.data.name,
        workspaceIcon: notionUser.data.avatar_url,
        lastSyncedAt: new Date(),
        isActive: true,
      },
      { upsert: true, new: true }
    );

    logger.info('notion_connected', { userId, workspaceId: notionUser.data.id });
    res.json({ success: true, data: connection });
  } catch (error) {
    logger.error('notion_connect_failed', { error });
    res.status(400).json({ success: false, error: { code: 'CONNECTION_FAILED', message: (error as Error).message } });
  }
});

// Disconnect Notion workspace
app.delete('/api/notion/disconnect', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    await NotionConnection.findOneAndUpdate({ userId }, { isActive: false });
    logger.info('notion_disconnected', { userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get connection status
app.get('/api/notion/status', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const connection = await NotionConnection.findOne({ userId, isActive: true });
    res.json({
      success: true,
      data: {
        connected: !!connection,
        workspaceName: connection?.workspaceName,
        lastSyncedAt: connection?.lastSyncedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Sync all pages from Notion
app.post('/api/notion/sync', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const connection = await NotionConnection.findOne({ userId, isActive: true });

    if (!connection) {
      return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED', message: 'Notion not connected' } });
    }

    const client = new NotionClient(connection.accessToken);

    // Create sync record
    const syncRecord = new NotionSync({
      workspaceId: connection.workspaceId,
      status: 'syncing',
      userId,
      tenantId,
    });
    await syncRecord.save();

    let pagesSynced = 0;
    let databasesSynced = 0;
    let cursor: string | null = null;

    // Paginate through search results
    do {
      const searchParams: any = {
        query: '',
        page_size: 100,
      };
      if (cursor) searchParams.start_cursor = cursor;

      const results = await client.search('', undefined);

      for (const item of results.data.results || []) {
        if (item.object === 'page') {
          // Get full page content
          const content = await client.getPageContent(item.id);
          const plainText = (content.data || []).map((block: any) => extractPlainText(block)).join('\n');

          await NotionPage.findOneAndUpdate(
            { notionPageId: item.id, userId },
            {
              notionPageId: item.id,
              workspaceId: connection.workspaceId,
              title: extractTitle(item),
              content: JSON.stringify(item),
              plainText,
              url: item.url,
              icon: item.icon?.emoji || item.icon?.external?.url,
              createdTime: new Date(item.created_time),
              lastEditedTime: new Date(item.last_edited_time),
              archived: item.archived,
              properties: item.properties,
              parentId: item.parent?.page_id || item.parent?.database_id,
              parentType: item.parent?.type,
              syncedAt: new Date(),
              userId,
              tenantId,
            },
            { upsert: true }
          );
          pagesSynced++;
        } else if (item.object === 'database') {
          await NotionDatabase.findOneAndUpdate(
            { notionDatabaseId: item.id, userId },
            {
              notionDatabaseId: item.id,
              workspaceId: connection.workspaceId,
              title: item.title?.map((t: any) => t.plain_text).join('') || 'Untitled',
              description: item.description?.map((t: any) => t.plain_text).join(''),
              url: item.url,
              icon: item.icon?.emoji || item.icon?.external?.url,
              schema: item.properties,
              createdTime: new Date(item.created_time),
              lastEditedTime: new Date(item.last_edited_time),
              archived: item.archived,
              syncedAt: new Date(),
              userId,
              tenantId,
            },
            { upsert: true }
          );
          databasesSynced++;
        }
      }

      cursor = results.hasMore ? results.nextCursor : null;
    } while (cursor);

    // Update sync record
    syncRecord.lastSyncTime = new Date();
    syncRecord.pagesSynced = pagesSynced;
    syncRecord.databasesSynced = databasesSynced;
    syncRecord.status = 'completed';
    await syncRecord.save();

    // Update connection
    connection.lastSyncedAt = new Date();
    await connection.save();

    logger.info('notion_sync_completed', { userId, pagesSynced, databasesSynced });
    res.json({ success: true, data: { pagesSynced, databasesSynced, syncId: syncRecord._id } });
  } catch (error) {
    logger.error('notion_sync_failed', { error });
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Search Notion pages
app.get('/api/notion/search', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { q, type = 'all' } = req.query;

    let query: any = { userId, archived: false };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { plainText: { $regex: q, $options: 'i' } },
      ];
    }

    const pages = await NotionPage.find(query).sort({ lastEditedTime: -1 }).limit(50);
    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get page by ID
app.get('/api/notion/pages/:pageId', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { pageId } = req.params;

    const page = await NotionPage.findOne({ notionPageId: pageId, userId });
    if (!page) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get databases
app.get('/api/notion/databases', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const databases = await NotionDatabase.find({ userId, archived: false });
    res.json({ success: true, data: databases });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Query database
app.post('/api/notion/databases/:databaseId/query', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { databaseId } = req.params;
    const connection = await NotionConnection.findOne({ userId, isActive: true });

    if (!connection) {
      return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED' } });
    }

    const client = new NotionClient(connection.accessToken);
    const results = await client.queryDatabase(databaseId, req.body);

    res.json({ success: true, data: results.data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync history
app.get('/api/notion/sync/history', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const syncs = await NotionSync.find({ userId }).sort({ lastSyncTime: -1 }).limit(20);
    res.json({ success: true, data: syncs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Memory integration - Get pages for AI context
app.get('/api/notion/memory/context', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { limit = 10 } = req.query;

    const pages = await NotionPage.find({ userId, archived: false })
      .sort({ lastEditedTime: -1 })
      .limit(Number(limit))
      .select('title plainText url lastEditedTime');

    const context = pages.map(page => ({
      type: 'notion_page',
      title: page.title,
      content: page.plainText?.substring(0, 500),
      url: page.url,
      lastEdited: page.lastEditedTime,
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
      console.log(`  ║   GENIE Notion Service (v${SERVICE_VERSION})       ║`);
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
