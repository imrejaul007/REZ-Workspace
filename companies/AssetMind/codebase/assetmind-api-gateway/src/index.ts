/**
 * AssetMind API Gateway
 * Port: 5260
 *
 * Central routing and orchestration for all AssetMind services
 */

import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';

const PORT = process.env.PORT || 5260;

const app = express();
app.use(express.json());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Service routes - loaded from environment variables with localhost defaults for development
// In production, set these env vars to point to actual service URLs
const SERVICES: Record<string, string> = {
  // Asset Tier
  '/api/assets': process.env.SVC_ASSET_UNIVERSE || 'http://localhost:5001',
  '/api/twin': process.env.SVC_TWIN_ENGINE || 'http://localhost:5002',
  '/api/market-twin': process.env.SVC_MARKET_TWIN || 'http://localhost:5003',
  '/api/portfolio-twin': process.env.SVC_PORTFOLIO_TWIN || 'http://localhost:5004',
  '/api/investor-twin': process.env.SVC_INVESTOR_TWIN || 'http://localhost:5005',
  '/api/intelligence-twin': process.env.SVC_INTELLIGENCE_TWIN || 'http://localhost:5006',

  // Data Connectors
  '/api/market-data': process.env.SVC_MARKET_DATA || 'http://localhost:5010',
  '/api/financial-data': process.env.SVC_FINANCIAL_DATA || 'http://localhost:5011',
  '/api/news': process.env.SVC_NEWS || 'http://localhost:5012',
  '/api/social': process.env.SVC_SOCIAL || 'http://localhost:5013',
  '/api/macro': process.env.SVC_MACRO || 'http://localhost:5014',
  '/api/regulatory': process.env.SVC_REGULATORY || 'http://localhost:5015',
  '/api/crypto': process.env.SVC_CRYPTO || 'http://localhost:5018',
  '/api/forex': process.env.SVC_FOREX || 'http://localhost:5019',

  // Intelligence
  '/api/intelligence': process.env.SVC_INTELLIGENCE || 'http://localhost:5050',
  '/api/narrative': process.env.SVC_NARRATIVE || 'http://localhost:5051',
  '/api/sentiment': process.env.SVC_SENTIMENT || 'http://localhost:5052',
  '/api/risk': process.env.SVC_RISK || 'http://localhost:5053',
  '/api/events': process.env.SVC_EVENTS || 'http://localhost:5054',
  '/api/institutional': process.env.SVC_INSTITUTIONAL || 'http://localhost:5055',
  '/api/macro-engine': process.env.SVC_MACRO_ENGINE || 'http://localhost:5056',
  '/api/theme': process.env.SVC_THEME || 'http://localhost:5057',
  '/api/sector': process.env.SVC_SECTOR || 'http://localhost:5058',
  '/api/country': process.env.SVC_COUNTRY || 'http://localhost:5059',

  // Knowledge Graph
  '/api/knowledge-graph': process.env.SVC_KNOWLEDGE_GRAPH || 'http://localhost:5040',
  '/api/entity-resolution': process.env.SVC_ENTITY_RESOLUTION || 'http://localhost:5041',
  '/api/supply-chain': process.env.SVC_SUPPLY_CHAIN || 'http://localhost:5042',
  '/api/correlation': process.env.SVC_CORRELATION || 'http://localhost:5043',

  // Agents
  '/api/agents': process.env.SVC_AGENTS || 'http://localhost:5090',
  '/api/portfolio-optimizer': process.env.SVC_PORTFOLIO_OPTIMIZER || 'http://localhost:5091',
  '/api/risk-manager': process.env.SVC_RISK_MANAGER || 'http://localhost:5092',
  '/api/rebalancer': process.env.SVC_REBALANCER || 'http://localhost:5093',
  '/api/macro-strategist': process.env.SVC_MACRO_STRATEGIST || 'http://localhost:5094',
  '/api/earnings-analyzer': process.env.SVC_EARNINGS_ANALYZER || 'http://localhost:5095',
  '/api/technical-analyst': process.env.SVC_TECHNICAL_ANALYST || 'http://localhost:5096',
  '/api/sector-rotation': process.env.SVC_SECTOR_ROTATION || 'http://localhost:5097',
  '/api/sentiment-analyzer': process.env.SVC_SENTIMENT_ANALYZER || 'http://localhost:5098',
  '/api/news-intelligence': process.env.SVC_NEWS_INTELLIGENCE || 'http://localhost:5099',
  '/api/thesis-tracker': process.env.SVC_THESIS_TRACKER || 'http://localhost:5100',
  '/api/narrative-tracker': process.env.SVC_NARRATIVE_TRACKER || 'http://localhost:5101',
  '/api/capital-allocator': process.env.SVC_CAPITAL_ALLOCATOR || 'http://localhost:5102',

  // Capital Flow
  '/api/capital-flow': process.env.SVC_CAPITAL_FLOW || 'http://localhost:5183',

  // Briefing
  '/api/briefing': process.env.SVC_BRIEFING || 'http://localhost:5200',

  // Discovery & Research
  '/api/discovery': process.env.SVC_DISCOVERY || 'http://localhost:5120',
  '/api/research': process.env.SVC_RESEARCH || 'http://localhost:5130',

  // Simulation
  '/api/simulation': process.env.SVC_SIMULATION || 'http://localhost:5140',
  '/api/stress-test': process.env.SVC_STRESS_TEST || 'http://localhost:5141',

  // Trader
  '/api/trader': process.env.SVC_TRADER || 'http://localhost:5150',
  '/api/execution': process.env.SVC_EXECUTION || 'http://localhost:5160',

  // Enterprise
  '/api/enterprise': process.env.SVC_ENTERPRISE || 'http://localhost:5250',
  '/api/marketplace': process.env.SVC_MARKETPLACE || 'http://localhost:5270',
};

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'assetmind-api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes manifest
app.get('/api/routes', (_req: Request, res: Response) => {
  const routes = Object.entries(SERVICES).map(([path, target]) => ({ path, target }));
  res.json({ success: true, data: routes, count: routes.length });
});

// Service health check
app.get('/api/health', async (_req: Request, res: Response) => {
  const health: Record<string, string> = {};

  for (const [path, target] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(`${target}/health`);
      health[path] = response.ok ? 'healthy' : 'degraded';
    } catch {
      health[path] = 'unreachable';
    }
  }

  const healthyCount = Object.values(health).filter(s => s === 'healthy').length;
  res.json({
    success: true,
    data: {
      services: health,
      summary: {
        healthy: healthyCount,
        total: Object.keys(health).length
      }
    }
  });
});

// Proxy middleware
Object.entries(SERVICES).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    onProxyReq: (proxyReq) => {
      logger.info('Proxy', { path, target });
    },
    onError: (err, _req, res) => {
      logger.error('Proxy error', { path, error: err.message });
      (res as Response).status(502).json({ success: false, error: 'Service unavailable' });
    },
  }));
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start
app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════╗
║         AssetMind API Gateway v1.0              ║
╠═══════════════════════════════════════════════════════╣
║  Port:       ${PORT}                              ║
║  Services:   ${Object.keys(SERVICES).length}                              ║
║  Health:     GET /api/health                     ║
║  Routes:     GET /api/routes                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;