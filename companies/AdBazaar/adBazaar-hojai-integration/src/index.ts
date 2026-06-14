import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { hojaiIntegration } from './services/HojaiIntegrationService.js';

const app = express();
const PORT = process.env.PORT || 4722;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'adbazaar-hojai-integration',
    version: '1.0.0',
    connectedTo: process.env.HOJAI_UNIFIED_URL || 'http://localhost:4850'
  });
});

// ============ USER SYNC ============

// Sync user to Hojai
app.post('/api/users/sync', async (req, res) => {
  try {
    const { user } = req.body;
    await hojaiIntegration.syncUser(user);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user segments
app.get('/api/users/:id/segments', async (req, res) => {
  try {
    const segments = await hojaiIntegration.getUserSegments(req.params.id);
    res.json({ success: true, segments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user engagement
app.get('/api/users/:id/engagement', async (req, res) => {
  try {
    const engagement = await hojaiIntegration.getUserEngagement(req.params.id);
    res.json({ success: true, ...engagement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ CAMPAIGN AUTOMATION ============

// Create Hojai campaign
app.post('/api/campaigns/hojai', async (req, res) => {
  try {
    const { campaign } = req.body;
    const campaignId = await hojaiIntegration.createCampaignCampaign(campaign);
    res.json({ success: true, campaignId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send ad notification
app.post('/api/campaigns/:id/notify', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const success = await hojaiIntegration.sendAdNotification(userId, req.body, message);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send ad with CTA
app.post('/api/campaigns/:id/send-cta', async (req, res) => {
  try {
    const { userId, campaign } = req.body;
    const success = await hojaiIntegration.sendAdWithCTA(userId, campaign);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ CONVERSION TRACKING ============

// Track conversion
app.post('/api/conversions/track', async (req, res) => {
  try {
    const { event } = req.body;
    await hojaiIntegration.trackConversion(event);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cart recovery
app.post('/api/cart/recovery', async (req, res) => {
  try {
    const { userId, items } = req.body;
    const success = await hojaiIntegration.sendCartRecovery(userId, items);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANALYTICS ============

// Get campaign analytics
app.get('/api/analytics/campaigns/:id', async (req, res) => {
  try {
    const analytics = await hojaiIntegration.getCampaignAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AUDIENCE ============

// Get matching users
app.post('/api/audiences/match', async (req, res) => {
  try {
    const { audience } = req.body;
    const userIds = await hojaiIntegration.getMatchingUsers(audience);
    res.json({ success: true, userIds, count: userIds.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create lookalike
app.post('/api/audiences/lookalike', async (req, res) => {
  try {
    const { sourceAudienceId, similarity } = req.body;
    const audience = await hojaiIntegration.createLookalikeAudience(sourceAudienceId, similarity);
    res.json({ success: true, audience });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ RETARGETING ============

// Retarget users
app.post('/api/retarget', async (req, res) => {
  try {
    const { campaignId, excludeUserIds, message } = req.body;
    const result = await hojaiIntegration.retargetUsers(campaignId, excludeUserIds, message);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║   AdBazaar → Hojai Integration Service (${PORT})
╠══════════════════════════════════════════════════════════════╣
║   Connected to: ${process.env.HOJAI_UNIFIED_URL || 'http://localhost:4850'}
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
