/**
 * GENIE Obsidian Service - Main Entry Point
 * Port: 4712
 * Full Obsidian vault integration with local filesystem sync
 */
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { createLogger } from './utils/logger.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { ObsidianVault, ObsidianNote } from './models/index.js';

const SERVICE_NAME = 'genie-obsidian-service';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4712', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-obsidian';
const logger = createLogger(SERVICE_NAME);

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());

// Response helper
const resp = (res: Response, status: number, data?: any, error?: { code: string; message: string }) => {
  res.status(status).json({
    success: !error,
    ...(data && { data }),
    ...(error && { error }),
    meta: { timestamp: new Date().toISOString() }
  });
};

// Error handler
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

// ============================================================================
// VAULT MANAGEMENT
// ============================================================================

/**
 * Create/Register a new Obsidian vault
 */
app.post('/api/obsidian/vaults', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  const { name, path: vaultPath, settings } = req.body;

  if (!name || !vaultPath) {
    return resp(res, 400, undefined, { code: 'VALIDATION_ERROR', message: 'name and path are required' });
  }

  // Verify the path exists and is accessible
  try {
    const stats = await fs.stat(vaultPath);
    if (!stats.isDirectory()) {
      return resp(res, 400, undefined, { code: 'INVALID_PATH', message: 'Path is not a directory' });
    }
  } catch {
    return resp(res, 400, undefined, { code: 'PATH_NOT_FOUND', message: 'Vault path does not exist' });
  }

  const vault = await ObsidianVault.create({
    tenant_id,
    name,
    path: vaultPath,
    linked_user_id: user_id,
    linked_at: new Date(),
    settings: settings || {
      sync_daily_notes: true,
      sync_todos: true,
      sync_calendar: false,
      sync_tags: [],
      exclude_folders: ['.obsidian', '.trash', '.git', 'node_modules'],
      sync_direction: 'to_genie',
    },
  });

  logger.info('vault_created', { tenant_id, user_id, vaultId: vault._id, name });
  resp(res, 201, vault);
}));

/**
 * List user's vaults
 */
app.get('/api/obsidian/vaults', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  const vaults = await ObsidianVault.find({ tenant_id, linked_user_id: user_id });
  resp(res, 200, vaults);
}));

/**
 * Get vault details
 */
app.get('/api/obsidian/vaults/:vaultId', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const vault = await ObsidianVault.findOne({ _id: req.params.vaultId, tenant_id });
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });
  resp(res, 200, vault);
}));

/**
 * Update vault settings
 */
app.patch('/api/obsidian/vaults/:vaultId', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const { settings, status } = req.body;

  const update: Record<string, unknown> = {};
  if (settings) update.settings = settings;
  if (status) update.status = status;

  const vault = await ObsidianVault.findOneAndUpdate(
    { _id: req.params.vaultId, tenant_id },
    update,
    { new: true }
  );
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });
  resp(res, 200, vault);
}));

/**
 * Delete vault (disconnect only, doesn't delete files)
 */
app.delete('/api/obsidian/vaults/:vaultId', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};

  const vault = await ObsidianVault.findOneAndUpdate(
    { _id: req.params.vaultId, tenant_id },
    { status: 'inactive' },
    { new: true }
  );
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });

  // Optionally delete associated notes
  await ObsidianNote.deleteMany({ vault_id: vault._id, tenant_id });

  logger.info('vault_disconnected', { tenant_id, vaultId: vault._id });
  resp(res, 200, { message: 'Vault disconnected successfully' });
}));

// ============================================================================
// FILE SYNC
// ============================================================================

/**
 * Sync all notes from vault to database
 */
app.post('/api/obsidian/vaults/:vaultId/sync', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  const { full_sync = false } = req.body;

  const vault = await ObsidianVault.findOne({ _id: req.params.vaultId, tenant_id });
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });

  // Update vault status
  vault.status = 'syncing';
  await vault.save();

  try {
    const result = await syncVaultToDatabase(vault, tenant_id, user_id!, full_sync);

    vault.last_sync = new Date();
    vault.status = 'active';
    await vault.save();

    logger.info('vault_sync_completed', { tenant_id, user_id, vaultId: vault._id, result });
    resp(res, 200, result);
  } catch (error: any) {
    vault.status = 'active';
    await vault.save();
    logger.error('vault_sync_failed', { tenant_id, vaultId: vault._id, error: error.message });
    resp(res, 500, undefined, { code: 'SYNC_FAILED', message: error.message });
  }
}));

/**
 * Sync a single note by path
 */
app.post('/api/obsidian/vaults/:vaultId/sync/note', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  const { file_path } = req.body;

  const vault = await ObsidianVault.findOne({ _id: req.params.vaultId, tenant_id });
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });

  const fullPath = path.join(vault.path, file_path);
  const note = await parseNoteFile(fullPath, vault._id.toString(), tenant_id, user_id!);

  if (note) {
    await ObsidianNote.findOneAndUpdate(
      { vault_id: vault._id, path: file_path, tenant_id },
      note,
      { upsert: true, new: true }
    );
    resp(res, 200, note);
  } else {
    resp(res, 404, undefined, { code: 'FILE_NOT_FOUND', message: 'Note file not found' });
  }
}));

// ============================================================================
// NOTES QUERY
// ============================================================================

/**
 * Search notes
 */
app.get('/api/obsidian/notes', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const { vault_id, tags, search, limit = 50 } = req.query;

  const query: Record<string, unknown> = { tenant_id };
  if (vault_id) query.vault_id = vault_id;
  if (tags) query.tags = { $in: (tags as string).split(',') };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const notes = await ObsidianNote.find(query).sort({ modified: -1 }).limit(Number(limit));
  resp(res, 200, notes);
}));

/**
 * Get note by ID
 */
app.get('/api/obsidian/notes/:noteId', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const note = await ObsidianNote.findOne({ _id: req.params.noteId, tenant_id });
  if (!note) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Note not found' });
  resp(res, 200, note);
}));

/**
 * Get notes by tag
 */
app.get('/api/obsidian/tags/:tag/notes', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const { tag } = req.params;
  const notes = await ObsidianNote.find({ tenant_id, tags: tag }).sort({ modified: -1 });
  resp(res, 200, notes);
}));

/**
 * Get backlinks for a note
 */
app.get('/api/obsidian/notes/:noteId/backlinks', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const note = await ObsidianNote.findOne({ _id: req.params.noteId, tenant_id });
  if (!note) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Note not found' });

  const backlinks = await ObsidianNote.find({
    tenant_id,
    links: { $in: [note.title, note.path] },
  });
  resp(res, 200, backlinks);
}));

/**
 * Get all tags in vault
 */
app.get('/api/obsidian/tags', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const { vault_id } = req.query;

  const match: Record<string, unknown> = { tenant_id };
  if (vault_id) match.vault_id = vault_id;

  const tags = await ObsidianNote.aggregate([
    { $match: match },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 100 },
  ]);

  resp(res, 200, tags.map(t => ({ tag: t._id, count: t.count })));
}));

/**
 * Get vault statistics
 */
app.get('/api/obsidian/vaults/:vaultId/stats', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  const vault = await ObsidianVault.findOne({ _id: req.params.vaultId, tenant_id });
  if (!vault) return resp(res, 404, undefined, { code: 'NOT_FOUND', message: 'Vault not found' });

  const [noteStats, tagStats] = await Promise.all([
    ObsidianNote.aggregate([
      { $match: { vault_id: vault._id, tenant_id } },
      {
        $group: {
          _id: null,
          total_notes: { $sum: 1 },
          total_words: { $sum: '$word_count' },
          avg_words: { $avg: '$word_count' },
        }
      }
    ]),
    ObsidianNote.countDocuments({ vault_id: vault._id, tenant_id }),
  ]);

  resp(res, 200, {
    vault: { name: vault.name, last_sync: vault.last_sync, status: vault.status },
    notes: noteStats[0] || { total_notes: 0, total_words: 0, avg_words: 0 },
    tags: tagStats,
  });
}));

// ============================================================================
// MEMORY CONTEXT (For AI Integration)
// ============================================================================

/**
 * Get memory context for AI
 */
app.get('/api/obsidian/memory/context', asyncHandler(async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  const { limit = 10 } = req.query;

  const recentNotes = await ObsidianNote.find({ tenant_id })
    .sort({ modified: -1 })
    .limit(Number(limit))
    .select('title content tags links modified');

  const topTags = await ObsidianNote.aggregate([
    { $match: { tenant_id } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  resp(res, 200, {
    recent_notes: recentNotes,
    top_interests: topTags.map(t => t._id),
    memory_type: 'obsidian',
    summary: `Obsidian vault with ${recentNotes.length} recent notes synced`,
  });
}));

// ============================================================================
// HEALTH CHECKS
// ============================================================================

app.get('/health', (_req: Request, res: Response) =>
  res.json({ status: 'healthy', service: SERVICE_NAME, version: SERVICE_VERSION }));

app.get('/health/live', (_req: Request, res: Response) =>
  res.json({ status: 'ok' }));

app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  res.json({
    status: mongoState === 1 ? 'ready' : 'not_ready',
    checks: { mongodb: mongoState === 1 ? 'connected' : 'disconnected' }
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sync entire vault to database
 */
async function syncVaultToDatabase(
  vault: any,
  tenantId: string,
  userId: string,
  fullSync: boolean
): Promise<{ notes_added: number; notes_updated: number; errors: string[] }> {
  const result = { notes_added: 0, notes_updated: 0, errors: [] as string[] };
  const excludePatterns = vault.settings.exclude_folders || ['.obsidian', '.trash', '.git'];

  async function processDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip excluded folders
          if (excludePatterns.includes(entry.name)) continue;
          await processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const relativePath = path.relative(vault.path, fullPath);
            const note = await parseNoteFile(fullPath, vault._id.toString(), tenantId, userId);

            if (note) {
              const existing = await ObsidianNote.findOne({ vault_id: vault._id, path: relativePath, tenant_id });

              if (existing) {
                if (fullSync || existing.modified < note.modified) {
                  await ObsidianNote.updateOne({ _id: existing._id }, note);
                  result.notes_updated++;
                }
              } else {
                await ObsidianNote.create({ ...note, tenant_id: tenantId });
                result.notes_added++;
              }
            }
          } catch (err: any) {
            result.errors.push(`Failed to process ${fullPath}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      result.errors.push(`Failed to read directory ${dirPath}: ${err.message}`);
    }
  }

  await processDirectory(vault.path);
  return result;
}

/**
 * Parse a Markdown note file
 */
async function parseNoteFile(
  filePath: string,
  vaultId: string,
  tenantId: string,
  userId: string
): Promise<any | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    // Parse frontmatter
    let frontmatter: Record<string, unknown> = {};
    let cleanContent = content;
    try {
      const parsed = matter(content);
      frontmatter = parsed.data;
      cleanContent = parsed.content;
    } catch { /* No frontmatter */ }

    // Extract title from filename or first heading
    const filename = path.basename(filePath, '.md');
    const firstHeading = cleanContent.match(/^#\s+(.+)$/m);
    const title = firstHeading ? firstHeading[1] : filename;

    // Extract tags from content
    const tags = cleanContent.match(/#[a-zA-Z0-9_-]+/g)?.map(t => t.slice(1)) || [];
    if (frontmatter.tags) {
      const frontmatterTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
      tags.push(...frontmatterTags.map(String));
    }

    // Extract wiki links
    const links = cleanContent.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)?.map(l => l.slice(2, -2)) || [];

    // Count words
    const wordCount = cleanContent.split(/\s+/).filter(w => w.length > 0).length;

    return {
      vault_id: vaultId,
      path: path.relative(vaultId, filePath),
      title,
      content: cleanContent,
      frontmatter,
      tags: [...new Set(tags)],
      links,
      backlinks: [],
      word_count: wordCount,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// START SERVER
// ============================================================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected');

    app.listen(PORT, () => console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   GENIE Obsidian Service (${SERVICE_VERSION})              ║
  ║   Port: ${PORT}                                     ║
  ║                                                  ║
  ║   "Your vault, your memory, your Genie."         ║
  ╚══════════════════════════════════════════════════╝
`));
  } catch (error) {
    logger.error('start_failed', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  mongoose.connection.close();
  process.exit(0);
});

start();
export default app;