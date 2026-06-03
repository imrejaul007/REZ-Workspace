/**
 * GENIE Drive Connector - Google Drive & OneDrive Integration
 * Port: 4716
 *
 * Syncs cloud drives with personal memory for AI context.
 * Supports Google Drive and Microsoft OneDrive.
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
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_NAME = 'genie-drive-connector';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4716', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-drive';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4716/oauth/google/callback';
const logger = createLogger(SERVICE_NAME);

const app = express();

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());

// ============================================================================
// OAUTH CLIENTS
// ============================================================================

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

// ============================================================================
// DATABASE MODELS
// ============================================================================

const DriveConnectionSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  tenantId: String,
  provider: { type: String, enum: ['google', 'onedrive'], required: true },
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  connectedAt: { type: Date, default: Date.now },
  lastSyncedAt: Date,
  isActive: { type: Boolean, default: true },
});

const DriveFileSchema = new Schema({
  fileId: { type: String, required: true },
  provider: { type: String, required: true },
  name: String,
  mimeType: String,
  size: Number,
  createdTime: Date,
  modifiedTime: Date,
  viewedByMeTime: Date,
  webViewLink: String,
  webContentLink: String,
  thumbnailLink: String,
  parents: [String],
  shared: { type: Boolean, default: false },
  trashed: { type: Boolean, default: false },
  description: String,
  userId: String,
  tenantId: String,
  syncedAt: { type: Date, default: Date.now },
});

const DriveFolderSchema = new Schema({
  folderId: { type: String, required: true },
  provider: { type: String, required: true },
  name: String,
  parentId: String,
  userId: String,
  tenantId: String,
  syncedAt: { type: Date, default: Date.now },
});

const DriveSyncSchema = new Schema({
  userId: String,
  tenantId: String,
  provider: String,
  lastSyncTime: Date,
  filesProcessed: { type: Number, default: 0 },
  foldersProcessed: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'syncing', 'completed', 'failed'], default: 'pending' },
  error: String,
});

export const DriveConnection = model('DriveConnection', DriveConnectionSchema);
export const DriveFile = model('DriveFile', DriveFileSchema);
export const DriveFolder = model('DriveFolder', DriveFolderSchema);
export const DriveSync = model('DriveSync', DriveSyncSchema);

// ============================================================================
// DRIVE CLIENT
// ============================================================================

class GoogleDriveClient {
  private auth: typeof oauth2Client;

  constructor(accessToken: string, refreshToken?: string, tokenExpiry?: Date) {
    this.auth = oauth2Client;
    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: tokenExpiry?.getTime(),
    });

    this.auth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        this.auth.setCredentials({ refresh_token: tokens.refresh_token });
      }
    });
  }

  getDrive() {
    return google.drive({ version: 'v3', auth: this.auth });
  }

  async listFiles(query?: string, pageSize = 100): Promise<any[]> {
    const drive = this.getDrive();
    const response = await drive.files.list({
      q: query || "trashed=false",
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, viewedByMeTime, webViewLink, webContentLink, thumbnailLink, parents, shared, description)',
      pageSize,
    });
    return response.data.files || [];
  }

  async listFolders(): Promise<any[]> {
    return this.listFiles("mimeType='application/vnd.google-apps.folder' and trashed=false");
  }

  async getFileContent(fileId: string): Promise<string> {
    const drive = this.getDrive();
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'text' });
    return response.data as string;
  }

  async exportFile(fileId: string, mimeType: string): Promise<any> {
    const drive = this.getDrive();
    const response = await drive.files.export({
      fileId,
      mimeType,
    }, { responseType: 'arraybuffer' });
    return response.data;
  }

  async searchFiles(query: string): Promise<any[]> {
    const drive = this.getDrive();
    const response = await drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)',
    });
    return response.data.files || [];
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// Get OAuth URL for Google
app.get('/api/drive/google/auth-url', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.json({ success: true, data: { url } });
});

// Handle OAuth callback
app.get('/oauth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    res.send(`
      <html><body>
        <h2>Connected to Google Drive!</h2>
        <p>User: ${userInfo.data.name}</p>
        <p>Email: ${userInfo.data.email}</p>
        <p>Please copy your tokens from the URL and configure the service manually.</p>
      </body></html>
    `);
  } catch (error) {
    logger.error('oauth_callback_failed', { error });
    res.status(500).send('OAuth failed');
  }
});

// Connect Google Drive manually
app.post('/api/drive/google/connect', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const { accessToken, refreshToken, tokenExpiry } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN' } });
    }

    try {
      const client = new GoogleDriveClient(accessToken, refreshToken, tokenExpiry ? new Date(tokenExpiry) : undefined);
      await client.listFiles('name="*"', 1);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN' } });
    }

    await DriveConnection.findOneAndUpdate(
      { userId, provider: 'google' },
      {
        userId,
        tenantId,
        provider: 'google',
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : undefined,
        lastSyncedAt: new Date(),
        isActive: true,
      },
      { upsert: true }
    );

    logger.info('google_drive_connected', { userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Disconnect
app.delete('/api/drive/disconnect', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    await DriveConnection.findOneAndUpdate({ userId }, { isActive: false });
    logger.info('drive_disconnected', { userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get connection status
app.get('/api/drive/status', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const connection = await DriveConnection.findOne({ userId, isActive: true });
    res.json({
      success: true,
      data: {
        connected: !!connection,
        provider: connection?.provider,
        lastSyncedAt: connection?.lastSyncedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Sync all files
app.post('/api/drive/sync', async (req: TenantRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.tenantContext || {};
    const connection = await DriveConnection.findOne({ userId, isActive: true });

    if (!connection) {
      return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED' } });
    }

    const syncRecord = new DriveSync({
      userId,
      tenantId,
      provider: connection.provider,
      status: 'syncing',
    });
    await syncRecord.save();

    const client = new GoogleDriveClient(
      connection.accessToken!,
      connection.refreshToken,
      connection.tokenExpiry
    );

    // Sync folders first
    const folders = await client.listFolders();
    let foldersProcessed = 0;
    for (const folder of folders) {
      await DriveFolder.findOneAndUpdate(
        { folderId: folder.id, provider: 'google' },
        {
          folderId: folder.id,
          provider: 'google',
          name: folder.name,
          parentId: folder.parents?.[0],
          userId,
          tenantId,
          syncedAt: new Date(),
        },
        { upsert: true }
      );
      foldersProcessed++;
    }

    // Sync files
    const files = await client.listFiles();
    let filesProcessed = 0;
    for (const file of files) {
      await DriveFile.findOneAndUpdate(
        { fileId: file.id, provider: 'google' },
        {
          fileId: file.id,
          provider: 'google',
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          createdTime: new Date(file.createdTime),
          modifiedTime: new Date(file.modifiedTime),
          viewedByMeTime: file.viewedByMeTime ? new Date(file.viewedByMeTime) : undefined,
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          thumbnailLink: file.thumbnailLink,
          parents: file.parents,
          shared: file.shared,
          description: file.description,
          userId,
          tenantId,
          syncedAt: new Date(),
        },
        { upsert: true }
      );
      filesProcessed++;
    }

    syncRecord.lastSyncTime = new Date();
    syncRecord.filesProcessed = filesProcessed;
    syncRecord.foldersProcessed = foldersProcessed;
    syncRecord.status = 'completed';
    await syncRecord.save();

    connection.lastSyncedAt = new Date();
    await connection.save();

    logger.info('drive_sync_completed', { userId, filesProcessed, foldersProcessed });
    res.json({ success: true, data: { filesProcessed, foldersProcessed } });
  } catch (error) {
    logger.error('drive_sync_failed', { error });
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// List files
app.get('/api/drive/files', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { folderId, mimeType, search, limit = 100 } = req.query;

    let query: any = { userId, trashed: false };

    if (folderId) query.parents = folderId;
    if (mimeType) query.mimeType = mimeType;
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    const files = await DriveFile.find(query)
      .sort({ modifiedTime: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// List folders
app.get('/api/drive/folders', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { parentId } = req.query;

    let query: any = { userId };
    if (parentId) query.parentId = parentId;

    const folders = await DriveFolder.find(query).sort({ name: 1 });
    res.json({ success: true, data: folders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get file content
app.get('/api/drive/files/:fileId/content', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { fileId } = req.params;
    const connection = await DriveConnection.findOne({ userId, isActive: true });

    if (!connection) {
      return res.status(400).json({ success: false, error: { code: 'NOT_CONNECTED' } });
    }

    const client = new GoogleDriveClient(
      connection.accessToken!,
      connection.refreshToken,
      connection.tokenExpiry
    );

    const file = await DriveFile.findOne({ fileId, userId });
    if (!file) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    let content: string;
    if (file.mimeType?.includes('google-apps')) {
      const exportMimeType = file.mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'text/csv'
        : 'text/plain';
      const buffer = await client.exportFile(fileId, exportMimeType);
      content = Buffer.from(buffer).toString('utf-8');
    } else {
      content = await client.getFileContent(fileId);
    }

    res.json({ success: true, data: { file, content } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync history
app.get('/api/drive/sync/history', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const syncs = await DriveSync.find({ userId }).sort({ lastSyncTime: -1 }).limit(20);
    res.json({ success: true, data: syncs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Memory context - Get recent files for AI
app.get('/api/drive/memory/context', async (req: TenantRequest, res: Response) => {
  try {
    const { userId } = req.tenantContext || {};
    const { limit = 10 } = req.query;

    const files = await DriveFile.find({ userId, trashed: false })
      .sort({ modifiedTime: -1 })
      .limit(Number(limit))
      .select('name mimeType modifiedTime webViewLink');

    const context = files.map((f) => ({
      type: 'drive_file',
      name: f.name,
      mimeType: f.mimeType,
      modified: f.modifiedTime,
      url: f.webViewLink,
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
      console.log(`  ║   GENIE Drive Connector (v${SERVICE_VERSION})      ║`);
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