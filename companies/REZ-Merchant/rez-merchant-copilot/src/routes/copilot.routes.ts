/**
 * Copilot Routes
 * Main API routes for REZ Merchant Copilot with REZ Media Insights
 *
 * Routes:
 * - Chat/Natural Language Interface
 * - WhatsApp Insights
 * - Voice Campaign Insights
 * - Engagement Analysis
 * - Auto Campaign Creation
 * - Message Optimization
 * - Audience Intelligence
 */

import express, { Request, Response } from 'express';
import { copilotChatService, ChatMessage } from '../services/copilotChat';
import { whatsAppInsightsService } from '../services/whatsappInsights';
import { voiceInsightsService } from '../services/voiceInsights';
import { engagementAnalysisService } from '../services/engagementAnalysis';
import { autoCampaignService } from '../services/autoCampaign';
import { messageOptimizerService } from '../services/messageOptimizer';
import { audienceIntelligenceService } from '../services/audienceIntelligence';
import { merchantHealthScorer } from '../services/merchantHealthScorer';
import { recommendationEngine } from '../services/recommendationEngine';

const router = express.Router();

// ── Type Definitions ────────────────────────────────────────

type InsightsPeriod = '7d' | '30d' | '90d' | 'custom';
type InsightsChannel = 'whatsapp' | 'voice' | 'all';
type CampaignChannel = 'whatsapp' | 'sms' | 'email' | 'voice';
type MessageTone = 'professional' | 'friendly' | 'urgent' | 'casual';
type TestType = 'subject' | 'content' | 'timing' | 'audience';

// ============================================================
// Chat / Natural Language Interface
// ============================================================

/**
 * POST /api/chat
 * Process natural language chat message
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { merchantId, sessionId, message } = req.body as {
      merchantId: string;
      sessionId?: string;
      message: string;
    };

    if (!merchantId || !message) {
      return res.status(400).json({ error: 'merchantId and message are required' });
    }

    const response = await copilotChatService.processMessage(
      merchantId,
      sessionId || `session_${Date.now()}`,
      message
    );

    res.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/context/:sessionId
 * Get chat context/history
 */
router.get('/chat/context/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId query parameter required' });
    }

    // Note: In production, retrieve from persistent storage
    res.json({
      success: true,
      sessionId,
      merchantId,
      history: [],
    });
  } catch (error) {
    console.error('[Chat Context] Error:', error);
    res.status(500).json({ error: 'Failed to get context' });
  }
});

// ============================================================
// WhatsApp Insights
// ============================================================

/**
 * GET /api/whatsapp/insights
 * Get WhatsApp marketing insights
 */
router.get('/whatsapp/insights', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const period = (req.query.period as string) || 'weekly';

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const insights = await whatsAppInsightsService.getInsights(merchantId, period as unknown);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[WhatsApp Insights] Error:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp insights' });
  }
});

/**
 * GET /api/whatsapp/campaigns
 * Get WhatsApp campaigns
 */
router.get('/whatsapp/campaigns', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const campaigns = await whatsAppInsightsService.getCampaigns(merchantId);

    res.json({
      success: true,
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[WhatsApp Campaigns] Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/whatsapp/audience
 * Get WhatsApp audience insights
 */
router.get('/whatsapp/audience', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const [audience, segments, optimalTimes, subscriberGrowth] = await Promise.all([
      whatsAppInsightsService.getAudienceInsights(merchantId),
      whatsAppInsightsService.getAudienceSegments(merchantId),
      whatsAppInsightsService.getOptimalSendTimes(merchantId),
      whatsAppInsightsService.getSubscriberGrowth(merchantId),
    ]);

    res.json({
      success: true,
      audience,
      segments,
      optimalTimes,
      subscriberGrowth,
    });
  } catch (error) {
    console.error('[WhatsApp Audience] Error:', error);
    res.status(500).json({ error: 'Failed to fetch audience data' });
  }
});

// ============================================================
// Voice Insights
// ============================================================

/**
 * GET /api/voice/insights
 * Get voice campaign insights
 */
router.get('/voice/insights', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const period = (req.query.period as string) || 'weekly';

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const insights = await voiceInsightsService.getInsights(merchantId, period as unknown);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[Voice Insights] Error:', error);
    res.status(500).json({ error: 'Failed to fetch voice insights' });
  }
});

/**
 * GET /api/voice/campaigns
 * Get voice campaigns
 */
router.get('/voice/campaigns', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const campaigns = await voiceInsightsService.getCampaigns(merchantId);

    res.json({
      success: true,
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[Voice Campaigns] Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/voice/optimal-times
 * Get optimal calling times
 */
router.get('/voice/optimal-times', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const optimalTimes = await voiceInsightsService.getOptimalCallTimes(merchantId);

    res.json({
      success: true,
      optimalTimes,
    });
  } catch (error) {
    console.error('[Voice Optimal Times] Error:', error);
    res.status(500).json({ error: 'Failed to fetch optimal times' });
  }
});

// ============================================================
// Engagement Analysis
// ============================================================

/**
 * GET /api/engagement/insights
 * Get customer engagement insights
 */
router.get('/engagement/insights', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const period = (req.query.period as string) || 'weekly';

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const insights = await engagementAnalysisService.getInsights(merchantId, period as unknown);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[Engagement Insights] Error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement insights' });
  }
});

/**
 * GET /api/engagement/segments
 * Get engagement segments
 */
router.get('/engagement/segments', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const segments = await engagementAnalysisService.analyzeSegments(merchantId);

    res.json({
      success: true,
      segments,
      count: segments.length,
    });
  } catch (error) {
    console.error('[Engagement Segments] Error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

/**
 * GET /api/engagement/churn
 * Get churn risk analysis
 */
router.get('/engagement/churn', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const churnRisks = await engagementAnalysisService.getChurnRiskAnalysis(merchantId);

    res.json({
      success: true,
      churnRisks,
      count: churnRisks.length,
    });
  } catch (error) {
    console.error('[Churn Analysis] Error:', error);
    res.status(500).json({ error: 'Failed to fetch churn analysis' });
  }
});

// ============================================================
// Auto Campaign
// ============================================================

/**
 * POST /api/campaigns/auto
 * Generate automatic campaign
 */
router.post('/campaigns/auto', async (req: Request, res: Response) => {
  try {
    const { merchantId, objective, channel, targetSegment, budget, timeframe } = req.body;

    if (!merchantId || !objective) {
      return res.status(400).json({ error: 'merchantId and objective are required' });
    }

    const result = await autoCampaignService.generateCampaign(merchantId, objective, {
      channel: channel as unknown,
      targetSegment,
      budget,
      timeframe: timeframe as unknown,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Auto Campaign] Error:', error);
    res.status(500).json({ error: 'Failed to generate campaign' });
  }
});

/**
 * POST /api/campaigns/create
 * Create campaign from brief
 */
router.post('/campaigns/create', async (req: Request, res: Response) => {
  try {
    const { brief } = req.body;

    if (!brief) {
      return res.status(400).json({ error: 'Campaign brief required' });
    }

    const result = await autoCampaignService.createCampaign(brief);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Campaign Create] Error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/campaigns/templates
 * Get campaign templates
 */
router.get('/campaigns/templates', async (req: Request, res: Response) => {
  try {
    const channel = req.query.channel as string;

    const templates = await autoCampaignService.getTemplates(channel as unknown);

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('[Campaign Templates] Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/campaigns/recommended
 * Get recommended campaigns
 */
router.get('/campaigns/recommended', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const recommendations = await autoCampaignService.getRecommendedCampaigns(merchantId);

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('[Campaign Recommendations] Error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * POST /api/campaigns/optimize
 * Optimize existing campaign
 */
router.post('/campaigns/optimize', async (req: Request, res: Response) => {
  try {
    const { merchantId, campaignId, targetMetric } = req.body;

    if (!merchantId || !campaignId || !targetMetric) {
      return res.status(400).json({ error: 'merchantId, campaignId, and targetMetric required' });
    }

    const result = await autoCampaignService.optimizeCampaign(
      merchantId,
      campaignId,
      targetMetric as unknown
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Campaign Optimize] Error:', error);
    res.status(500).json({ error: 'Failed to optimize campaign' });
  }
});

// ============================================================
// Message Optimization
// ============================================================

/**
 * POST /api/messages/analyze
 * Analyze message for optimization
 */
router.post('/messages/analyze', async (req: Request, res: Response) => {
  try {
    const { message, channel } = req.body;

    if (!message || !channel) {
      return res.status(400).json({ error: 'message and channel are required' });
    }

    const analysis = messageOptimizerService.analyzeMessage(message, channel as unknown);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Message Analyze] Error:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});

/**
 * POST /api/messages/optimize
 * Optimize message content
 */
router.post('/messages/optimize', async (req: Request, res: Response) => {
  try {
    const { message, channel, includeVariations, maxLength, tone } = req.body;

    if (!message || !channel) {
      return res.status(400).json({ error: 'message and channel are required' });
    }

    const optimized = messageOptimizerService.optimizeMessage(message, channel as unknown, {
      includeVariations,
      maxLength,
      tone: tone as unknown,
    });

    res.json({
      success: true,
      optimized,
    });
  } catch (error) {
    console.error('[Message Optimize] Error:', error);
    res.status(500).json({ error: 'Failed to optimize message' });
  }
});

/**
 * POST /api/messages/ab-test
 * Generate A/B test variants
 */
router.post('/messages/ab-test', async (req: Request, res: Response) => {
  try {
    const { message, channel, testType } = req.body;

    if (!message || !channel || !testType) {
      return res.status(400).json({ error: 'message, channel, and testType are required' });
    }

    const variations = messageOptimizerService.generateABTest(message, channel as unknown, testType as unknown);

    res.json({
      success: true,
      variations,
    });
  } catch (error) {
    console.error('[Message AB Test] Error:', error);
    res.status(500).json({ error: 'Failed to generate A/B test' });
  }
});

/**
 * GET /api/messages/templates
 * Get message templates
 */
router.get('/messages/templates', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;

    const templates = messageOptimizerService.getTemplates(category);

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('[Message Templates] Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ============================================================
// Audience Intelligence
// ============================================================

/**
 * GET /api/audience/insights
 * Get comprehensive audience insights
 */
router.get('/audience/insights', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const period = (req.query.period as string) || '30d';

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const insights = await audienceIntelligenceService.getAudienceInsights(merchantId, period);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[Audience Insights] Error:', error);
    res.status(500).json({ error: 'Failed to fetch audience insights' });
  }
});

/**
 * GET /api/audience/segments
 * Get audience segments
 */
router.get('/audience/segments', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const segments = await audienceIntelligenceService.getSegments(merchantId);

    res.json({
      success: true,
      segments,
      count: segments.length,
    });
  } catch (error) {
    console.error('[Audience Segments] Error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

/**
 * GET /api/audience/segments/:segmentId
 * Get segment details
 */
router.get('/audience/segments/:segmentId', async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const segment = await audienceIntelligenceService.getSegmentDetails(merchantId, segmentId);

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    res.json({
      success: true,
      segment,
    });
  } catch (error) {
    console.error('[Audience Segment] Error:', error);
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

/**
 * POST /api/audience/segments
 * Create custom segment
 */
router.post('/audience/segments', async (req: Request, res: Response) => {
  try {
    const { merchantId, name, description, criteria } = req.body;

    if (!merchantId || !name || !criteria) {
      return res.status(400).json({ error: 'merchantId, name, and criteria required' });
    }

    const result = await audienceIntelligenceService.createSegment(merchantId, criteria, name, description);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Audience Segment Create] Error:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

/**
 * GET /api/audience/segments/:segmentId/audience
 * Get segment audience members
 */
router.get('/audience/segments/:segmentId/audience', async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const merchantId = req.query.merchantId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const result = await audienceIntelligenceService.getSegmentAudience(merchantId, segmentId, { page, limit });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Audience Segment Audience] Error:', error);
    res.status(500).json({ error: 'Failed to fetch segment audience' });
  }
});

/**
 * GET /api/audience/high-value
 * Get high-value customer insights
 */
router.get('/audience/high-value', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const insights = await audienceIntelligenceService.getHighValueInsights(merchantId);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[High Value Insights] Error:', error);
    res.status(500).json({ error: 'Failed to fetch high-value insights' });
  }
});

/**
 * GET /api/audience/churn
 * Get churn analysis
 */
router.get('/audience/churn', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const analysis = await audienceIntelligenceService.getChurnAnalysis(merchantId);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Churn Analysis] Error:', error);
    res.status(500).json({ error: 'Failed to fetch churn analysis' });
  }
});

/**
 * GET /api/audience/lookalikes
 * Find lookalike audiences
 */
router.get('/audience/lookalikes', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const seedSegmentId = req.query.seedSegmentId as string;

    if (!merchantId || !seedSegmentId) {
      return res.status(400).json({ error: 'merchantId and seedSegmentId required' });
    }

    const lookalikes = await audienceIntelligenceService.findLookalikes(merchantId, seedSegmentId);

    res.json({
      success: true,
      lookalikes,
    });
  } catch (error) {
    console.error('[Lookalikes] Error:', error);
    res.status(500).json({ error: 'Failed to find lookalikes' });
  }
});

// ============================================================
// Combined / Dashboard Endpoints
// ============================================================

/**
 * GET /api/dashboard/overview
 * Get comprehensive dashboard overview
 */
router.get('/dashboard/overview', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const [
      healthScore,
      recommendations,
      engagementInsights,
      whatsappInsights,
      voiceInsights,
    ] = await Promise.all([
      merchantHealthScorer.calculateHealthScore(merchantId),
      recommendationEngine.generateRecommendations(
        merchantId,
        await merchantHealthScorer.getMerchantMetrics(merchantId),
        0
      ),
      engagementAnalysisService.getInsights(merchantId, 'weekly'),
      whatsAppInsightsService.getInsights(merchantId, 'weekly'),
      voiceInsightsService.getInsights(merchantId, 'weekly'),
    ]);

    res.json({
      success: true,
      healthScore,
      recommendations: recommendations.slice(0, 5),
      engagement: {
        summary: engagementInsights.summary,
        atRiskCount: engagementInsights.atRisk.filter(c => c.riskLevel === 'high').length,
      },
      whatsapp: {
        totalMessages: whatsappInsights.metrics.totalMessages,
        openRate: whatsappInsights.metrics.openRate,
        activeSubscribers: whatsappInsights.audienceMetrics.activeSubscribers,
      },
      voice: {
        totalCalls: voiceInsights.metrics.totalCalls,
        answerRate: voiceInsights.metrics.answerRate,
      },
    });
  } catch (error) {
    console.error('[Dashboard Overview] Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

/**
 * GET /api/dashboard/actions
 * Get recommended actions for merchant
 */
router.get('/dashboard/actions', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId required' });
    }

    const [
      recommendations,
      campaignRecommendations,
      engagementInsights,
    ] = await Promise.all([
      recommendationEngine.generateRecommendations(
        merchantId,
        await merchantHealthScorer.getMerchantMetrics(merchantId),
        0
      ),
      autoCampaignService.getRecommendedCampaigns(merchantId),
      engagementAnalysisService.getInsights(merchantId, 'weekly'),
    ]);

    const actions = [
      ...recommendations.slice(0, 3).map(rec => ({
        type: 'recommendation',
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        expectedImpact: rec.expectedImpact,
        actions: rec.actions,
      })),
      ...campaignRecommendations.slice(0, 2).map(rec => ({
        type: 'campaign',
        title: rec.type,
        description: rec.reason,
        priority: rec.priority,
        expectedImpact: rec.expectedImpact,
        channel: rec.channel,
      })),
    ];

    // Add engagement-based actions
    if (engagementInsights.atRisk.length > 0) {
      actions.push({
        type: 'churn',
        title: 'Address At-Risk Customers',
        description: `${engagementInsights.atRisk.filter(c => c.riskLevel === 'high').length} high-risk customers need attention`,
        priority: 'high',
        expectedImpact: 'Reduce churn by 15-25%',
      });
    }

    res.json({
      success: true,
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error('[Dashboard Actions] Error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

export default router;
