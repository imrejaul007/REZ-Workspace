/**
 * REZ Atlas Gateway - Central API Gateway
 * The Merchant Intelligence Network for the Physical World
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { z } from 'zod';

// Service URLs
const SERVICES = {
  discover: process.env.ATLAS_DISCOVER_URL || 'http://localhost:5151',
  maps: process.env.ATLAS_MAPS_URL || 'http://localhost:5152',
  twin: process.env.ATLAS_TWIN_URL || 'http://localhost:5153',
  score: process.env.ATLAS_SCORE_URL || 'http://localhost:5154',
  signals: process.env.ATLAS_SIGNALS_URL || 'http://localhost:5155',
  territory: process.env.ATLAS_TERRITORY_URL || 'http://localhost:5170',
  routes: process.env.ATLAS_ROUTES_URL || 'http://localhost:5171',
  copilot: process.env.ATLAS_COPILOT_URL || 'http://localhost:5172',
  graph: process.env.ATLAS_GRAPH_URL || 'http://localhost:5173',
};

const PORT = process.env.PORT || 5150;
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - startTime}ms) [${requestId}]`);
  });

  next();
});

// Health checks
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-atlas-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tagline: 'The Merchant Intelligence Network for the Physical World'
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    axios.get(`${SERVICES.discover}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.maps}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.twin}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.score}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.signals}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.territory}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.routes}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.copilot}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.graph}/health`, { timeout: 2000 }),
  ]);

  const serviceStatus = {
    discover: checks[0].status === 'fulfilled' ? 'up' : 'down',
    maps: checks[1].status === 'fulfilled' ? 'up' : 'down',
    twin: checks[2].status === 'fulfilled' ? 'up' : 'down',
    score: checks[3].status === 'fulfilled' ? 'up' : 'down',
    signals: checks[4].status === 'fulfilled' ? 'up' : 'down',
    territory: checks[5].status === 'fulfilled' ? 'up' : 'down',
    routes: checks[6].status === 'fulfilled' ? 'up' : 'down',
    copilot: checks[7].status === 'fulfilled' ? 'up' : 'down',
    graph: checks[8].status === 'fulfilled' ? 'up' : 'down',
  };

  const allUp = Object.values(serviceStatus).every(s => s === 'up');
  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ready' : 'degraded',
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// UNIFIED SEARCH - Searches across all services
// ============================================================================

app.get('/api/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, lat, lng, radius, category, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Search in multiple services in parallel
    const [discoverResults, twinResults] = await Promise.allSettled([
      axios.get(`${SERVICES.discover}/api/search`, {
        params: { q, lat, lng, radius, category, limit },
        timeout: 5000
      }),
      axios.get(`${SERVICES.twin}/api/merchants/search`, {
        params: { q, category, limit },
        timeout: 5000
      }),
    ]);

    const merchants = [];

    if (discoverResults.status === 'fulfilled') {
      merchants.push(...discoverResults.value.data.merchants || []);
    }

    if (twinResults.status === 'fulfilled') {
      merchants.push(...twinResults.value.data.merchants || []);
    }

    // Deduplicate by business name + location
    const unique = Array.from(
      new Map(merchants.map(m => [`${m.name}-${m.location?.address || ''}`, m])).values()
    );

    res.json({
      query: q,
      count: unique.length,
      merchants: unique.slice(0, Number(limit))
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MERCHANT ENDPOINTS - Aggregated from multiple services
// ============================================================================

// Get merchant by ID (checks all services)
app.get('/api/merchants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check Twin service first
    try {
      const twinResponse = await axios.get(`${SERVICES.twin}/api/merchants/${id}`, { timeout: 3000 });
      return res.json(twinResponse.data);
    } catch {
      // Twin not found, check other services
    }

    // Check Discover service
    try {
      const discoverResponse = await axios.get(`${SERVICES.discover}/api/merchants/${id}`, { timeout: 3000 });
      return res.json(discoverResponse.data);
    } catch {
      // Not found anywhere
    }

    res.status(404).json({ error: 'Merchant not found' });
  } catch (error) {
    next(error);
  }
});

// Search merchants
app.get('/api/merchants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius, category, minScore, status } = req.query;

    const results = await Promise.allSettled([
      axios.get(`${SERVICES.discover}/api/merchants`, { params: req.query, timeout: 5000 }),
      axios.get(`${SERVICES.twin}/api/merchants`, { params: req.query, timeout: 5000 }),
    ]);

    const merchants = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        merchants.push(...(result.value.data.merchants || []));
      }
    });

    // Filter by score if provided
    let filtered = merchants;
    if (minScore) {
      filtered = filtered.filter((m: any) => (m.score || 0) >= Number(minScore));
    }

    res.json({
      count: filtered.length,
      merchants: filtered
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DISCOVERY ENDPOINTS - Map-first merchant search
// ============================================================================

app.get('/api/discover/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.discover}/api/search`, {
      params: req.query,
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/discover/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 5000, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const response = await axios.get(`${SERVICES.discover}/api/nearby`, {
      params: { lat, lng, radius, category },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MAPS ENDPOINTS - Geospatial intelligence
// ============================================================================

app.get('/api/maps/heat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bounds, category, metric = 'density' } = req.query;
    const response = await axios.get(`${SERVICES.maps}/api/heat`, {
      params: { bounds, category, metric },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/maps/clusters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bounds, zoom, category } = req.query;
    const response = await axios.get(`${SERVICES.maps}/api/clusters`, {
      params: { bounds, zoom, category },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/maps/territory/:territoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.maps}/api/territory/${req.params.territoryId}`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TWIN ENDPOINTS - Merchant digital twins
// ============================================================================

app.get('/api/twin/:merchantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.twin}/api/merchants/${req.params.merchantId}`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/twin/:merchantId/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.twin}/api/merchants/${req.params.merchantId}/dashboard`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/twin/:merchantId/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.twin}/api/merchants/${req.params.merchantId}/performance`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SCORE ENDPOINTS - Lead scoring
// ============================================================================

app.get('/api/score/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, grade, ownerId, source, limit = 100 } = req.query;
    const response = await axios.get(`${SERVICES.score}/api/leads`, {
      params: { status, grade, ownerId, source, limit },
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/score/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${SERVICES.score}/api/leads`, req.body, { timeout: 5000 });
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/score/leads/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.score}/api/leads/${req.params.id}`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/score/leads/:id/score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${SERVICES.score}/api/leads/${req.params.id}/score`, req.body, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SIGNALS ENDPOINTS - Opportunity detection
// ============================================================================

app.get('/api/signals/opportunities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, type, severity, limit = 50 } = req.query;
    const response = await axios.get(`${SERVICES.signals}/api/opportunities`, {
      params: { merchantId, type, severity, limit },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/signals/competitors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, area } = req.query;
    const response = await axios.get(`${SERVICES.signals}/api/competitors`, {
      params: { merchantId, area },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TERRITORY ENDPOINTS - Territory management
// ============================================================================

app.get('/api/territories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.territory}/api/territories`, {
      params: req.query,
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/territories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.territory}/api/territories/${req.params.id}`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/territories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${SERVICES.territory}/api/territories`, req.body, { timeout: 5000 });
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

app.put('/api/territories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.put(`${SERVICES.territory}/api/territories/${req.params.id}`, req.body, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/territories/:id/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.territory}/api/territories/${req.params.id}/performance`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ROUTES ENDPOINTS - Route optimization
// ============================================================================

app.get('/api/routes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, territoryId, userId } = req.query;
    const response = await axios.get(`${SERVICES.routes}/api/routes`, {
      params: { date, territoryId, userId },
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/routes/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stops, mode = 'driving' } = req.body;
    const response = await axios.post(`${SERVICES.routes}/api/routes/optimize`, { stops, mode }, { timeout: 15000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/routes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${SERVICES.routes}/api/routes`, req.body, { timeout: 5000 });
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/routes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.routes}/api/routes/${req.params.id}`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COPILOT ENDPOINTS - AI Sales Assistant
// ============================================================================

app.post('/api/copilot/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId } = req.body;
    const response = await axios.post(`${SERVICES.copilot}/api/summarize`, { merchantId }, { timeout: 15000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/copilot/pitch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, product, channel = 'email' } = req.body;
    const response = await axios.post(`${SERVICES.copilot}/api/pitch`, { merchantId, product, channel }, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/copilot/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, competitors } = req.body;
    const response = await axios.post(`${SERVICES.copilot}/api/compare`, { merchantId, competitors }, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GRAPH ENDPOINTS - Merchant network graph
// ============================================================================

app.get('/api/graph/merchant/:merchantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { depth = 1 } = req.query;
    const response = await axios.get(`${SERVICES.graph}/api/merchant/${req.params.merchantId}`, {
      params: { depth },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/graph/relationships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, merchantId, limit = 100 } = req.query;
    const response = await axios.get(`${SERVICES.graph}/api/relationships`, {
      params: { type, merchantId, limit },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/graph/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${SERVICES.graph}/api/connect`, req.body, { timeout: 5000 });
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS - Aggregated analytics
// ============================================================================

app.get('/api/dashboard/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { territoryId, startDate, endDate } = req.query;

    const [merchants, territories, leads, opportunities] = await Promise.allSettled([
      axios.get(`${SERVICES.twin}/api/merchants/stats`, { timeout: 5000 }),
      axios.get(`${SERVICES.territory}/api/territories/stats`, { timeout: 5000 }),
      axios.get(`${SERVICES.score}/api/stats`, { timeout: 5000 }),
      axios.get(`${SERVICES.signals}/api/opportunities/stats`, { timeout: 5000 }),
    ]);

    res.json({
      merchants: merchants.status === 'fulfilled' ? merchants.value.data : { total: 0 },
      territories: territories.status === 'fulfilled' ? territories.value.data : { total: 0 },
      leads: leads.status === 'fulfilled' ? leads.value.data : { total: 0 },
      opportunities: opportunities.status === 'fulfilled' ? opportunities.value.data : { total: 0 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard/acquisition', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.twin}/api/dashboard/acquisition`, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard/territory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.territory}/api/dashboard`, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard/opportunities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${SERVICES.signals}/api/dashboard`, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);

  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'One or more backend services are unavailable'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🗺️  REZ ATLAS GATEWAY                                       ║
║   The Merchant Intelligence Network for the Physical World    ║
║                                                               ║
║   Port: ${PORT}                                                 ║
║   Health: http://localhost:${PORT}/health                        ║
║   Ready: http://localhost:${PORT}/ready                         ║
║                                                               ║
║   Services:                                                   ║
║   • Discover: ${SERVICES.discover}                            ║
║   • Maps: ${SERVICES.maps}                                    ║
║   • Twin: ${SERVICES.twin}                                    ║
║   • Score: ${SERVICES.score}                                  ║
║   • Signals: ${SERVICES.signals}                              ║
║   • Territory: ${SERVICES.territory}                          ║
║   • Routes: ${SERVICES.routes}                                ║
║   • Copilot: ${SERVICES.copilot}                              ║
║   • Graph: ${SERVICES.graph}                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;