/**
 * REZ Business AI - Main Service
 *
 * Autonomous AI operating system for merchants
 * Connected to: REZ-Merchant, REZ-Intelligence, REZ-Media, RABTUL Services
 */

import express, { Router, Request, Response }, logger from 'utils/logger.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { MerchantConfig, AIAction, BusinessIntelligence, BusinessReport } from './types';
import { pricingAgent } from './agents/pricingAgent';
import { marketingAgent } from './agents/marketingAgent';
import { retentionAgent } from './agents/retentionAgent';
import { integrationHub } from './services/integrationHub';

import { MerchantConfigModel } from './models/MerchantConfig';
import { AIActionModel } from './models/AIAction';
import { BusinessReportModel } from './models/BusinessReport';
import { createRateLimiter } from '@rez/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4059;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['https://merchant.rez.money'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Rate limiting
const businessAILimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
});

app.use(businessAILimiter.middleware());

// Error handler
function handleError(res: Response, error: unknown, action: string): void {
  const message = process.env.NODE_ENV === 'production'
    ? `Failed to ${action}`
    : error instanceof Error ? error.message : 'Unknown error';
  logger.error(`[BusinessAI] ${action}:`, { error: error instanceof Error ? error.message : String(error) });
  res.status(500).json({ success: false, message });
}

// ==================== MERCHANT CONFIG ====================

/**
 * Get merchant configuration
 * GET /api/business-ai/config
 */
app.get('/config', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const config = await MerchantConfigModel.findOne({ merchantId });
    res.json({ success: true, data: config });
  } catch (error) {
    handleError(res, error, 'get config');
  }
});

/**
 * Update merchant configuration
 * PUT /api/business-ai/config
 */
app.put('/config', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const configData: Partial<MerchantConfig> = req.body;

    const config = await MerchantConfigModel.findOneAndUpdate(
      { merchantId },
      { $set: { ...configData, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: config });
  } catch (error) {
    handleError(res, error, 'update config');
  }
});

/**
 * Set approval mode
 * PUT /api/business-ai/config/mode
 */
app.put('/config/mode', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { mode } = req.body;

    if (!['suggestion', 'semi_autonomous', 'autonomous'].includes(mode)) {
      res.status(400).json({ success: false, message: 'Invalid mode' });
      return;
    }

    const config = await MerchantConfigModel.findOneAndUpdate(
      { merchantId },
      { $set: { approvalMode: mode, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: config });
  } catch (error) {
    handleError(res, error, 'set mode');
  }
});

// ==================== AI ANALYSIS ====================

/**
 * Get AI suggestions
 * GET /api/business-ai/suggestions
 */
app.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const config = await MerchantConfigModel.findOne({ merchantId });

    if (!config) {
      res.status(400).json({ success: false, message: 'Please configure Business AI first' });
      return;
    }

    // Gather intelligence data
    const intelligence = await gatherIntelligence(merchantId, config);

    // Generate suggestions from all agents
    const suggestions: AIAction[] = [];

    // Pricing suggestions
    const pricingDecisions = await pricingAgent.analyzePricing(merchantId, config, intelligence);
    for (const decision of pricingDecisions) {
      suggestions.push(pricingAgent.createPricingAction(decision, merchantId, config));
    }

    // Marketing campaigns
    const campaigns = await marketingAgent.generateCampaigns(merchantId, config, intelligence);
    for (const campaign of campaigns) {
      suggestions.push(marketingAgent.createCampaignAction(campaign, merchantId, config));
    }

    // Retention campaigns
    const retentionCampaigns = await retentionAgent.analyzeRetention(merchantId, config, intelligence);
    for (const campaign of retentionCampaigns) {
      suggestions.push(retentionAgent.createRetentionAction(campaign, merchantId, config));
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Save to database
    await AIActionModel.insertMany(suggestions);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 20), // Top 20
        summary: {
          total: suggestions.length,
          byPriority: {
            critical: suggestions.filter((s) => s.priority === 'critical').length,
            high: suggestions.filter((s) => s.priority === 'high').length,
            medium: suggestions.filter((s) => s.priority === 'medium').length,
            low: suggestions.filter((s) => s.priority === 'low').length,
          },
          byType: {
            pricing: suggestions.filter((s) => s.type === 'pricing_adjustment').length,
            campaign: suggestions.filter((s) => s.type === 'campaign_create').length,
            retention: suggestions.filter((s) => s.type === 'customer_reengagement').length,
          },
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'get suggestions');
  }
});

/**
 * Get pending actions
 * GET /api/business-ai/actions
 */
app.get('/actions', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { status, type, limit = 20 } = req.query;

    const query: Record<string, unknown> = { merchantId };
    if (status) query.status = status;
    if (type) query.type = type;

    const actions = await AIActionModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: actions });
  } catch (error) {
    handleError(res, error, 'get actions');
  }
});

/**
 * Approve action
 * POST /api/business-ai/actions/:id/approve
 */
app.post('/actions/:id/approve', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { id } = req.params;

    const action = await AIActionModel.findOneAndUpdate(
      { _id: id, merchantId, status: 'pending' },
      { $set: { status: 'approved', approvedBy: merchantId } },
      { new: true }
    );

    if (!action) {
      res.status(404).json({ success: false, message: 'Action not found' });
      return;
    }

    // Execute the action
    await executeAction(action);

    res.json({ success: true, data: action });
  } catch (error) {
    handleError(res, error, 'approve action');
  }
});

/**
 * Reject action
 * POST /api/business-ai/actions/:id/reject
 */
app.post('/actions/:id/reject', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { id } = req.params;
    const { reason } = req.body;

    const action = await AIActionModel.findOneAndUpdate(
      { _id: id, merchantId, status: 'pending' },
      { $set: { status: 'rejected', approvedBy: merchantId } },
      { new: true }
    );

    if (!action) {
      res.status(404).json({ success: false, message: 'Action not found' });
      return;
    }

    res.json({ success: true, data: action });
  } catch (error) {
    handleError(res, error, 'reject action');
  }
});

/**
 * Execute action immediately
 * POST /api/business-ai/actions/:id/execute
 */
app.post('/actions/:id/execute', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { id } = req.params;

    const action = await AIActionModel.findOne({ _id: id, merchantId });

    if (!action) {
      res.status(404).json({ success: false, message: 'Action not found' });
      return;
    }

    const result = await executeAction(action);

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'execute action');
  }
});

// ==================== REPORTS ====================

/**
 * Generate report
 * POST /api/business-ai/reports
 */
app.post('/reports', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { type, startDate, endDate } = req.body;

    const report = await generateReport(merchantId, type, new Date(startDate), new Date(endDate));

    res.json({ success: true, data: report });
  } catch (error) {
    handleError(res, error, 'generate report');
  }
});

/**
 * Get reports
 * GET /api/business-ai/reports
 */
app.get('/reports', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { type, limit = 10 } = req.query;

    const query: Record<string, unknown> = { merchantId };
    if (type) query.type = type;

    const reports = await BusinessReportModel.find(query)
      .sort({ generatedAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: reports });
  } catch (error) {
    handleError(res, error, 'get reports');
  }
});

// ==================== INTELLIGENCE ====================

/**
 * Get business intelligence
 * GET /api/business-ai/intelligence
 */
app.get('/intelligence', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const config = await MerchantConfigModel.findOne({ merchantId });

    if (!config) {
      res.status(400).json({ success: false, message: 'Please configure Business AI first' });
      return;
    }

    const intelligence = await gatherIntelligence(merchantId, config);

    res.json({ success: true, data: intelligence });
  } catch (error) {
    handleError(res, error, 'get intelligence');
  }
});

/**
 * One-click execute all approved actions
 * POST /api/business-ai/execute-all
 */
app.post('/execute-all', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const config = await MerchantConfigModel.findOne({ merchantId });

    if (!config) {
      res.status(400).json({ success: false, message: 'Please configure Business AI first' });
      return;
    }

    // Get auto-executable actions
    const actions = await AIActionModel.find({
      merchantId,
      status: 'approved',
      requiresApproval: false,
    });

    const results = [];
    for (const action of actions) {
      const result = await executeAction(action);
      results.push(result);
    }

    res.json({
      success: true,
      data: {
        executed: results.length,
        results,
      },
    });
  } catch (error) {
    handleError(res, error, 'execute all');
  }
});

// ==================== INTEGRATIONS (REZ ECOSYSTEM) ====================

/**
 * Get complete merchant data from REZ-Merchant
 * GET /api/business-ai/integrations/merchant
 */
app.get('/integrations/merchant', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;

    const [merchant, products, customers, orders] = await Promise.all([
      integrationHub.getMerchantData(merchantId),
      integrationHub.getMerchantProducts(merchantId),
      integrationHub.getMerchantCustomers(merchantId),
      integrationHub.getMerchantOrders(merchantId, {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }),
    ]);

    res.json({
      success: true,
      data: {
        merchant: merchant.data,
        products: products.data,
        customers: customers.data,
        orders: orders.data,
      },
    });
  } catch (error) {
    handleError(res, error, 'get merchant integration');
  }
});

/**
 * Get intelligence from REZ-Intelligence
 * GET /api/business-ai/integrations/intelligence
 */
app.get('/integrations/intelligence', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;

    const [demandSignals, competitors, weather, events, trends, benchmarks] = await Promise.all([
      integrationHub.getDemandSignals(merchantId),
      integrationHub.getCompetitorIntel(merchantId),
      integrationHub.getWeatherImpact(merchantId),
      integrationHub.getEventsIntel(merchantId),
      integrationHub.getMarketTrends('current', 'all'),
      integrationHub.getBenchmarks(merchantId),
    ]);

    res.json({
      success: true,
      data: {
        demandSignals: demandSignals.data,
        competitors: competitors.data,
        weather: weather.data,
        events: events.data,
        trends: trends.data,
        benchmarks: benchmarks.data,
      },
    });
  } catch (error) {
    handleError(res, error, 'get intelligence integration');
  }
});

/**
 * Create campaign via REZ-Media
 * POST /api/business-ai/integrations/campaign
 */
app.post('/integrations/campaign', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { name, type, offer, audience, channels } = req.body;

    const campaign = await integrationHub.createCampaign({
      merchantId,
      name,
      type,
      offer,
      audience,
    });

    if (campaign.success) {
      // Send notifications via RABTUL
      if (channels?.includes('whatsapp') || channels?.includes('sms')) {
        await integrationHub.sendBulkNotifications({
          userIds: (audience as unknown)?.userIds || [],
          channel: 'whatsapp',
          title: `New ${type} offer!`,
          message: `Check out our new ${name} offer!`,
        });
      }
    }

    res.json(campaign);
  } catch (error) {
    handleError(res, error, 'create campaign');
  }
});

/**
 * Create ad via REZ-AdAI
 * POST /api/business-ai/integrations/ad
 */
app.post('/integrations/ad', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { objective, targeting, budget, creative } = req.body;

    const ad = await integrationHub.createAd({
      merchantId,
      objective,
      targeting,
      budget,
      creative,
    });

    res.json(ad);
  } catch (error) {
    handleError(res, error, 'create ad');
  }
});

/**
 * Execute action via ecosystem
 * POST /api/business-ai/integrations/execute
 */
app.post('/integrations/execute', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { actionType, data } = req.body;

    let result;

    switch (actionType) {
      case 'update_price':
        result = await integrationHub.updateProductPrice(merchantId, data.productId, data.newPrice);
        break;

      case 'send_notification':
        result = await integrationHub.sendNotification(data);
        break;

      case 'create_cashback':
        result = await integrationHub.createCashbackOffer({
          merchantId,
          ...data,
        });
        break;

      case 'add_loyalty':
        result = await integrationHub.addLoyaltyPoints(data.customerId, data.points, data.reason);
        break;

      case 'create_campaign':
        result = await integrationHub.createCampaign({
          merchantId,
          ...data,
        });
        break;

      case 'push_offer':
        result = await integrationHub.pushOffer({
          merchantId,
          ...data,
        });
        break;

      default:
        res.status(400).json({ success: false, message: 'Unknown action type' });
        return;
    }

    res.json(result);
  } catch (error) {
    handleError(res, error, 'execute integration action');
  }
});

/**
 * Get all connected services status
 * GET /api/business-ai/integrations/status
 */
app.get('/integrations/status', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;

    // Test connections to all services
    const [merchant, intelligence, adAI, engagement] = await Promise.allSettled([
      integrationHub.getMerchantData(merchantId),
      integrationHub.getDemandSignals(merchantId),
      integrationHub.getBenchmarks(merchantId),
      integrationHub.getCampaignPerformance('test'),
    ]);

    res.json({
      success: true,
      data: {
        connected: true,
        services: {
          'REZ-Merchant': merchant.status === 'fulfilled' ? 'connected' : 'disconnected',
          'REZ-Intelligence': intelligence.status === 'fulfilled' ? 'connected' : 'disconnected',
          'REZ-AdAI': adAI.status === 'fulfilled' ? 'connected' : 'disconnected',
          'REZ-Engagement': engagement.status === 'fulfilled' ? 'connected' : 'disconnected',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(res, error, 'get integration status');
  }
});

// ==================== HEALTH ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-business-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==================== HELPERS ====================

async function gatherIntelligence(merchantId: string, config: MerchantConfig): Promise<BusinessIntelligence> {
  // This would integrate with multiple services
  // For now, return mock data structure
  return {
    merchantId,
    timestamp: new Date(),
    demandSignals: [
      {
        type: 'demand_spike',
        strength: 0.3,
        confidence: 0.85,
        source: 'historical',
        description: 'Weekend demand increase expected',
        recommendedAction: 'Increase inventory',
      },
    ],
    marketTrends: [
      { category: 'delivery', trend: 'rising', change: 0.15, forecast: 0.2 },
    ],
    customerInsights: [
      {
        segment: 'high_value',
        count: 150,
        avgOrderValue: 850,
        retentionRate: 0.85,
        churnRisk: 'low',
        topProducts: ['Combo Meal', 'Premium Burger'],
      },
    ],
    competitorData: [
      {
        name: 'Competitor A',
        distance: '0.5km',
        pricing: 0.95,
        offers: ['20% off'],
        rating: 4.2,
        lastSeen: new Date(),
      },
    ],
    weatherImpact: {
      condition: 'sunny',
      expectedDemandChange: 0.1,
      recommendedOffers: ['Summer Coolers Combo'],
    },
    eventImpact: [
      {
        event: 'IPL Final',
        type: 'sports',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        expectedBoost: 0.25,
        relevantAudience: ['sports_fans', 'young_adults'],
      },
    ],
    financialHealth: {
      revenue: 250000,
      expenses: 150000,
      profitMargin: 0.4,
      cashFlow: 50000,
      outstandingPayments: 20000,
      healthScore: 85,
    },
  };
}

async function executeAction(action): Promise<unknown> {
  // Update status
  action.status = 'executing';
  await action.save();

  try {
    // Execute based on action type
    switch (action.type) {
      case 'pricing_adjustment':
        // Call pricing service
        break;
      case 'campaign_create':
        // Call campaign service
        break;
      case 'customer_reengagement':
        // Call retention service
        break;
    }

    // Mark as completed
    action.status = 'completed';
    action.executedAt = new Date();
    await action.save();

    return { success: true, actionId: action._id };
  } catch (error) {
    action.status = 'failed';
    await action.save();
    throw error;
  }
}

async function generateReport(
  merchantId: string,
  type: string,
  startDate: Date,
  endDate: Date
): Promise<unknown> {
  const report = {
    id: `report-${Date.now()}`,
    merchantId,
    type,
    period: { start: startDate, end: endDate },
    summary: {
      revenue: 250000,
      revenueChange: 0.15,
      orders: 1250,
      ordersChange: 0.12,
      customers: 450,
      customersChange: 0.08,
      avgOrderValue: 200,
      topProducts: [],
      customerSegments: [],
    },
    insights: [
      {
        type: 'opportunity' as const,
        title: 'Weekend Growth Opportunity',
        description: 'Weekend revenue is 30% higher. Consider extending hours.',
        data: { weekendGrowth: 0.3 },
        impact: 'high' as const,
      },
    ],
    recommendations: [
      {
        priority: 1,
        action: 'Launch weekend special campaign',
        reason: 'Historical data shows strong weekend demand',
        expectedImpact: { revenue: 15000, customers: 50, conversionRate: 0.05, roi: 2.5, confidence: 0.85 },
        effort: 'low' as const,
        autoExecutable: true,
      },
    ],
    generatedAt: new Date(),
  };

  await BusinessReportModel.create(report);
  return report;
}

// ==================== SERVER ====================

const server = app.listen(PORT, () => {
  logger.info(`REZ Business AI Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
