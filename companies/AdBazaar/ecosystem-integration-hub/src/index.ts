/**
 * AdBazaar Ecosystem Integration Hub
 * Unified gateway for all REZ ecosystem integrations
 *
 * Port: 4955
 * Purpose: Central orchestration for all ecosystem connections
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 4955;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/ecosystem-hub.log' })
  ]
});

// Service URLs
const SERVICES = {
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4870',
  REZ_RIDE: process.env.REZ_RIDE || 'http://localhost:4530',
  AIRZY: process.env.AIRZY || 'http://localhost:4951',
  STAYOWN: process.env.STAYOWN || 'http://localhost:4952',
  BUZZLOCAL: process.env.BUZZLOCAL || 'http://localhost:4953',
  CORPPERKS: process.env.CORPPERKS || 'http://localhost:4954',
  INTENT_SIGNALS: process.env.INTENT_SIGNALS || 'http://localhost:4800',
  AD_SERVICE: process.env.AD_SERVICE || 'http://localhost:4007',
  AUTH: process.env.AUTH_SERVICE || 'http://localhost:4002',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const serviceStatus: Record<string, string> = {};

  // Check all services
  const checks = Object.entries(SERVICES).map(async ([name, url]) => {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      serviceStatus[name] = 'connected';
    } catch (e) {
      serviceStatus[name] = 'disconnected';
    }
  });

  await Promise.all(checks);

  const allConnected = Object.values(serviceStatus).every(s => s === 'connected');

  res.json({
    status: allConnected ? 'healthy' : 'degraded',
    service: 'ecosystem-integration-hub',
    port: PORT,
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INTENT SIGNAL ROUTING
// ============================================

/**
 * Route intent signals to the central aggregator
 * POST /api/intent/signals
 */
app.post('/api/intent/signals', async (req: Request, res: Response) => {
  try {
    const { source, userId, intent, timestamp } = req.body;

    // Enrich intent with ecosystem data
    const enrichedIntent = await enrichIntent(intent, source);

    // Route to intent signal aggregator
    const response = await axios.post(`${SERVICES.INTENT_SIGNALS}/api/signals`, {
      source,
      userId,
      intent: enrichedIntent,
      timestamp: timestamp || new Date()
    }, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('Intent routing error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get aggregated intent signals
 * GET /api/intent/audiences
 */
app.get('/api/intent/audiences', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${SERVICES.INTENT_SIGNALS}/api/audiences`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CROSS-SERVICE QUERIES
// ============================================

/**
 * Get unified user profile across ecosystem
 * GET /api/user/:userId/profile
 */
app.get('/api/user/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Gather data from all services
    const [rideData, travelData, hotelData, socialData, b2bData] = await Promise.allSettled([
      axios.get(`${SERVICES.REZ_RIDE}/api/profile/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: null })),
      axios.get(`${SERVICES.AIRZY}/api/user/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: null })),
      axios.get(`${SERVICES.STAYOWN}/api/user/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: null })),
      axios.get(`${SERVICES.BUZZLOCAL}/api/user/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: null })),
      axios.get(`${SERVICES.CORPPERKS}/api/user/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: null }))
    ]);

    // Combine all data
    const profile = {
      userId,
      mobility: rideData.status === 'fulfilled' ? rideData.value.data : null,
      travel: travelData.status === 'fulfilled' ? travelData.value.data : null,
      hospitality: hotelData.status === 'fulfilled' ? hotelData.value.data : null,
      social: socialData.status === 'fulfilled' ? socialData.value.data : null,
      b2b: b2bData.status === 'fulfilled' ? b2bData.value.data : null
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Profile aggregation error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get unified audience segments
 * GET /api/audiences/unified
 */
app.get('/api/audiences/unified', async (req: Request, res: Response) => {
  try {
    const { type, location, interests } = req.query;

    const audiences: any[] = [];

    // Gather from all sources
    const sources = [
      { name: 'mobility', url: SERVICES.REZ_RIDE },
      { name: 'travel', url: SERVICES.AIRZY },
      { name: 'hospitality', url: SERVICES.STAYOWN },
      { name: 'social', url: SERVICES.BUZZLOCAL },
      { name: 'b2b', url: SERVICES.CORPPERKS }
    ];

    const results = await Promise.allSettled(
      sources.map(async (source) => {
        try {
          const response = await axios.get(`${source.url}/api/audiences`, {
            headers: { 'X-Internal-Token': INTERNAL_TOKEN },
            timeout: 5000
          });
          return { source: source.name, data: response.data };
        } catch (e) {
          return { source: source.name, data: null };
        }
      })
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data) {
        audiences.push({
          source: result.value.source,
          segments: result.value.data.audiences || []
        });
      }
    });

    res.json({ success: true, data: audiences });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD PLACEMENT ROUTING
// ============================================

/**
 * Get available ad placements across ecosystem
 * GET /api/placements
 */
app.get('/api/placements', async (req: Request, res: Response) => {
  try {
    const { category, location } = req.query;

    const placements: any[] = [];

    // Gather placements from all inventory sources
    const [doohPlacements, ridePlacements, travelPlacements, hotelPlacements, socialPlacements] = await Promise.allSettled([
      // DOOH placements
      axios.get(`${SERVICES.AD_SERVICE}/api/placements/dooh`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { placements: [] } })),
      // Mobility placements
      axios.get(`${SERVICES.REZ_RIDE}/api/ad-placements/active`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { placements: [] } })),
      // Travel placements
      axios.get(`${SERVICES.AIRZY}/api/ad-placements/airports`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { placements: [] } })),
      // Hotel placements
      axios.get(`${SERVICES.STAYOWN}/api/ad-placements/rooms`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { placements: [] } })),
      // Society placements
      axios.get(`${SERVICES.BUZZLOCAL}/api/ad-placements/societies`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { placements: [] } }))
    ]);

    const addPlacements = (name: string, data: any) => {
      if (data?.placements) {
        placements.push(...data.placements.map((p: any) => ({ ...p, category: name })));
      }
    };

    addPlacements('dooh', doohPlacements.status === 'fulfilled' ? doohPlacements.value.data : null);
    addPlacements('mobility', ridePlacements.status === 'fulfilled' ? ridePlacements.value.data : null);
    addPlacements('travel', travelPlacements.status === 'fulfilled' ? travelPlacements.value.data : null);
    addPlacements('hospitality', hotelPlacements.status === 'fulfilled' ? hotelPlacements.value.data : null);
    addPlacements('community', socialPlacements.status === 'fulfilled' ? socialPlacements.value.data : null);

    // Filter by location if provided
    const filtered = location
      ? placements.filter((p: any) => p.location?.includes(location))
      : placements;

    res.json({
      success: true,
      count: filtered.length,
      placements: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Serve ad to ecosystem placement
 * POST /api/ad/serve
 */
app.post('/api/ad/serve', async (req: Request, res: Response) => {
  try {
    const { placementType, placementId, userId, context, campaignId } = req.body;

    // Route to appropriate service based on placement type
    let serviceUrl: string;
    switch (placementType) {
      case 'dooh':
        serviceUrl = SERVICES.AD_SERVICE;
        break;
      case 'mobility':
        serviceUrl = SERVICES.REZ_RIDE;
        break;
      case 'travel':
        serviceUrl = SERVICES.AIRZY;
        break;
      case 'hospitality':
        serviceUrl = SERVICES.STAYOWN;
        break;
      case 'community':
        serviceUrl = SERVICES.BUZZLOCAL;
        break;
      case 'b2b':
        serviceUrl = SERVICES.CORPPERKS;
        break;
      default:
        serviceUrl = SERVICES.AD_SERVICE;
    }

    const response = await axios.post(`${serviceUrl}/api/ad/serve`, {
      placementId,
      userId,
      context,
      campaignId
    }, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('Ad serving error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AI SERVICES ROUTING
// ============================================

/**
 * Route AI requests to HOJAI Gateway
 * POST /api/ai/:action
 */
app.post('/api/ai/:action', async (req: Request, res: Response) => {
  try {
    const { action } = req.params;

    const response = await axios.post(`${SERVICES.HOJAI_GATEWAY}/api/ai/${action}`, req.body, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('AI routing error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// ANALYTICS AGGREGATION
// ============================================

/**
 * Get unified analytics across ecosystem
 * GET /api/analytics/unified
 */
app.get('/api/analytics/unified', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, campaignId } = req.query;

    const [rideAnalytics, travelAnalytics, hotelAnalytics, socialAnalytics, adAnalytics] = await Promise.allSettled([
      axios.get(`${SERVICES.REZ_RIDE}/api/analytics/performance`, {
        params: { startDate, endDate },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { stats: [] } })),
      axios.get(`${SERVICES.AIRZY}/api/analytics/performance`, {
        params: { startDate, endDate },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { stats: [] } })),
      axios.get(`${SERVICES.STAYOWN}/api/analytics/performance`, {
        params: { startDate, endDate },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { stats: [] } })),
      axios.get(`${SERVICES.BUZZLOCAL}/api/analytics/performance`, {
        params: { startDate, endDate },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { stats: [] } })),
      axios.get(`${SERVICES.AD_SERVICE}/api/analytics/performance`, {
        params: { startDate, endDate, campaignId },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN }
      }).catch(() => ({ data: { stats: [] } }))
    ]);

    // Aggregate all analytics
    const unifiedAnalytics = {
      mobility: rideAnalytics.status === 'fulfilled' ? rideAnalytics.value.data : null,
      travel: travelAnalytics.status === 'fulfilled' ? travelAnalytics.value.data : null,
      hospitality: hotelAnalytics.status === 'fulfilled' ? hotelAnalytics.value.data : null,
      community: socialAnalytics.status === 'fulfilled' ? socialAnalytics.value.data : null,
      advertising: adAnalytics.status === 'fulfilled' ? adAnalytics.value.data : null,
      summary: calculateSummary([
        rideAnalytics, travelAnalytics, hotelAnalytics, socialAnalytics, adAnalytics
      ])
    };

    res.json({ success: true, data: unifiedAnalytics });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function enrichIntent(intent: any, source: string): Promise<any> {
  // Add cross-references to other ecosystem data
  const enriched = { ...intent };

  // Add timestamp if not present
  enriched.timestamp = enriched.timestamp || new Date();

  // Add source attribution
  enriched.sourceEcosystem = source;

  // Add enrichment flags
  enriched.crossEcosystem = true;

  return enriched;
}

function calculateSummary(results: any[]): any {
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value.data?.stats) {
      const stats = result.value.data.stats;
      stats.forEach((s: any) => {
        totalImpressions += s.impressions || 0;
        totalClicks += s.clicks || 0;
        totalConversions += s.conversions || 0;
      });
    }
  });

  return {
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) + '%' : '0%',
    avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) + '%' : '0%'
  };
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Ecosystem Integration Hub started on port ${PORT}`);
  logger.info('📊 Connected services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    logger.info(`   ${name}: ${url}`);
  });
});

export default app;