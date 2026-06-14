/**
 * DOOH Server - Digital Out of Home Advertising Network
 * HTTP API for screen management, ad delivery, and playlist generation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { logger } from './utils/logger.js';
import { DOOHNetwork, createPlaylistGenerator, createDeliveryEngine, createScreenManager } from './index.js';

// Configuration
const PORT = parseInt(process.env.PORT || '4151', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dooh';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// Initialize DOOH Network
const doohNetwork = new DOOHNetwork();
const screenManager = createScreenManager();
const playlistGenerator = createPlaylistGenerator();
const deliveryEngine = createDeliveryEngine();

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'DOOH-Network',
    version: '1.0.0',
    stats: doohNetwork.getStats()
  });
});

// ============================================================================
// SCREEN MANAGEMENT
// ============================================================================

app.post('/api/screens', async (req, res) => {
  try {
    const screen = screenManager.create(req.body);
    res.status(201).json({ success: true, data: screen });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/screens', async (req, res) => {
  try {
    const screens = screenManager.list();
    res.json({ success: true, data: screens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/screens/:id', async (req, res) => {
  try {
    const screen = screenManager.get(req.params.id);
    if (!screen) {
      return res.status(404).json({ success: false, error: 'Screen not found' });
    }
    res.json({ success: true, data: screen });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/screens/:id', async (req, res) => {
  try {
    const screen = screenManager.update(req.params.id, req.body);
    res.json({ success: true, data: screen });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/screens/:id', async (req, res) => {
  try {
    screenManager.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AD DELIVERY
// ============================================================================

app.post('/api/deliver', async (req, res) => {
  try {
    const { screenId, campaigns } = req.body;
    const ads = doohNetwork.getAdsForScreen(screenId, campaigns);
    res.json({ success: true, data: ads });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/deliver/batch', async (req, res) => {
  try {
    const { screenIds, campaigns } = req.body;
    const results = screenIds.map((screenId: string) => ({
      screenId,
      ads: doohNetwork.getAdsForScreen(screenId, campaigns)
    }));
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PLAYLIST GENERATION
// ============================================================================

app.post('/api/playlists/generate', async (req, res) => {
  try {
    const { screenId, campaigns, options } = req.body;
    const playlist = doohNetwork.generatePlaylist(screenId, campaigns);
    res.json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/playlists/:screenId', async (req, res) => {
  try {
    const { screenId } = req.params;
    const { date } = req.query;
    const playlist = playlistGenerator.getPlaylist(screenId, date as string);
    res.json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

app.get('/api/stats', async (req, res) => {
  try {
    const stats = doohNetwork.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/stats/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const revenue = deliveryEngine.calculateRevenue(startDate as string, endDate as string);
    res.json({ success: true, data: revenue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('DOOH Server Error:', err);
  res.status(500).json({ success: false, error: 'Internal error' });
});

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);
  } catch (error) {
    logger.warn('MongoDB connection failed, running without persistence:', error);
  }

  app.listen(PORT, () => {
    logger.info(`[${new Date().toISOString()}] DOOH Network running on port ${PORT}`);
  });
}

start();

export default app;
