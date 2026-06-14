/**
 * AdBazaar HOJAI AI Gateway
 * Central gateway for all HOJAI AI integrations in AdBazaar
 *
 * Port: 4870
 * Purpose: Route all AI requests to HOJAI services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@hojai/sdk';
import winston from 'winston';
import mongoose from 'mongoose';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4870;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/hojai-gateway.log' })
  ]
});

// HOJAI SDK Client
const hojaiClient = createClient({
  apiKey: process.env.HOJAI_API_KEY || 'dev-key',
  baseUrl: process.env.HOJAI_BASE_URL || 'http://localhost:4800',
  timeout: 30000,
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, //100 requests per minute
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check HOJAI connectivity
    let hojaiStatus = 'disconnected';
    try {
      await hojaiClient.health();
      hojaiStatus = 'connected';
    } catch (e) {
      hojaiStatus = 'error';
    }

    res.json({
      status: 'healthy',
      service: 'adbazaar-hojai-gateway',
      port: PORT,
      hojaiStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// ============================================
// AI SERVICES ROUTES
// ============================================

/**
 * Caption Generation - Uses HOJAI AI
 * POST /api/ai/caption/generate
 */
app.post('/api/ai/caption/generate', async (req: Request, res: Response) => {
  try {
    const { content, brandVoice, style, tone, length, platforms, variations } = req.body;

    const result = await hojaiClient.generateCaption({
      content,
      brandVoice,
      style: style || 'casual',
      tone: tone || 'friendly',
      length: length || 'medium',
      platforms: platforms || ['instagram'],
      variations: variations || 3
    });

    res.json({
      success: true,
      captions: result.captions,
      hashtags: result.hashtags,
      platformOptimized: result.platformOptimized
    });
  } catch (error) {
    logger.error('Caption generation error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Content Compliance Check - Uses HOJAI AI
 * POST /api/ai/compliance/check
 */
app.post('/api/ai/compliance/check', async (req: Request, res: Response) => {
  try {
    const { content, platform, brandSafety } = req.body;

    const result = await hojaiClient.checkCompliance({
      content,
      platform,
      brandSafety: brandSafety || true
    });

    res.json({
      success: true,
      compliant: result.compliant,
      issues: result.issues,
      score: result.score,
      suggestions: result.suggestions
    });
  } catch (error) {
    logger.error('Compliance check error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Hashtag Suggestions - Uses HOJAI AI
 * POST /api/ai/hashtags/suggest
 */
app.post('/api/ai/hashtags/suggest', async (req: Request, res: Response) => {
  try {
    const { content, count, category } = req.body;

    const result = await hojaiClient.suggestHashtags({
      content,
      count: count || 10,
      category
    });

    res.json({
      success: true,
      hashtags: result.hashtags,
      trending: result.trending,
      related: result.related
    });
  } catch (error) {
    logger.error('Hashtag suggestion error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Image Analysis - Uses HOJAI Vision
 * POST /api/ai/image/analyze
 */
app.post('/api/ai/image/analyze', async (req: Request, res: Response) => {
  try {
    const { imageUrl, analysisType } = req.body;

    const result = await hojaiClient.analyzeImage({
      imageUrl,
      analysisType: analysisType || 'full'
    });

    res.json({
      success: true,
      objects: result.objects,
      text: result.text,
      scene: result.scene,
      colors: result.colors,
      tags: result.tags
    });
  } catch (error) {
    logger.error('Image analysis error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Sentiment Analysis - Uses HOJAI AI
 * POST /api/ai/sentiment/analyze
 */
app.post('/api/ai/sentiment/analyze', async (req: Request, res: Response) => {
  try {
    const { text, context } = req.body;

    const result = await hojaiClient.analyzeSentiment({
      text,
      context
    });

    res.json({
      success: true,
      sentiment: result.sentiment,
      score: result.score,
      emotions: result.emotions,
      keywords: result.keywords
    });
  } catch (error) {
    logger.error('Sentiment analysis error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Trend Analysis - Uses HOJAI AI
 * POST /api/ai/trends/analyze
 */
app.post('/api/ai/trends/analyze', async (req: Request, res: Response) => {
  try {
    const { category, region, timeframe } = req.body;

    const result = await hojaiClient.analyzeTrends({
      category,
      region: region || 'india',
      timeframe: timeframe || '7d'
    });

    res.json({
      success: true,
      trends: result.trends,
      emerging: result.emerging,
      declining: result.declining
    });
  } catch (error) {
    logger.error('Trend analysis error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Campaign Optimization - Uses HOJAI AI
 * POST /api/ai/campaign/optimize
 */
app.post('/api/ai/campaign/optimize', async (req: Request, res: Response) => {
  try {
    const { campaignId, currentMetrics, targetGoals } = req.body;

    const result = await hojaiClient.optimizeCampaign({
      campaignId,
      currentMetrics,
      targetGoals
    });

    res.json({
      success: true,
      recommendations: result.recommendations,
      predictedImprovement: result.predictedImprovement,
      actions: result.actions
    });
  } catch (error) {
    logger.error('Campaign optimization error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Audience Insights - Uses HOJAI AI
 * POST /api/ai/audience/insights
 */
app.post('/api/ai/audience/insights', async (req: Request, res: Response) => {
  try {
    const { audienceId, segments } = req.body;

    const result = await hojaiClient.getAudienceInsights({
      audienceId,
      segments
    });

    res.json({
      success: true,
      demographics: result.demographics,
      interests: result.interests,
      behavior: result.behavior,
      predictions: result.predictions
    });
  } catch (error) {
    logger.error('Audience insights error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Content Generation - Uses HOJAI AI
 * POST /api/ai/content/generate
 */
app.post('/api/ai/content/generate', async (req: Request, res: Response) => {
  try {
    const { type, topic, tone, length, targetAudience } = req.body;

    const result = await hojaiClient.generateContent({
      type: type || 'post',
      topic,
      tone: tone || 'engaging',
      length: length || 'medium',
      targetAudience
    });

    res.json({
      success: true,
      content: result.content,
      variations: result.variations,
      metadata: result.metadata
    });
  } catch (error) {
    logger.error('Content generation error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Influencer Analysis - Uses HOJAI AI
 * POST /api/ai/influencer/analyze
 */
app.post('/api/ai/influencer/analyze', async (req: Request, res: Response) => {
  try {
    const { influencerId, platform, metrics } = req.body;

    const result = await hojaiClient.analyzeInfluencer({
      influencerId,
      platform,
      metrics
    });

    res.json({
      success: true,
      authenticity: result.authenticity,
      engagement: result.engagement,
      audience: result.audience,
      recommendations: result.recommendations
    });
  } catch (error) {
    logger.error('Influencer analysis error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Crisis Detection - Uses HOJAI AI
 * POST /api/ai/crisis/detect
 */
app.post('/api/ai/crisis/detect', async (req: Request, res: Response) => {
  try {
    const { brandId, mentions, timeframe } = req.body;

    const result = await hojaiClient.detectCrisis({
      brandId,
      mentions,
      timeframe: timeframe || '24h'
    });

    res.json({
      success: true,
      crisisLevel: result.crisisLevel,
      topics: result.topics,
      sentiment: result.sentiment,
      recommendedActions: result.recommendedActions
    });
  } catch (error) {
    logger.error('Crisis detection error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Product Description - Uses HOJAI AI
 * POST /api/ai/product/describe
 */
app.post('/api/ai/product/describe', async (req: Request, res: Response) => {
  try {
    const { product, platform, tone } = req.body;

    const result = await hojaiClient.generateProductDescription({
      product,
      platform: platform || 'instagram',
      tone: tone || 'persuasive'
    });

    res.json({
      success: true,
      title: result.title,
      description: result.description,
      features: result.features,
      tags: result.tags
    });
  } catch (error) {
    logger.error('Product description error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * A/B Test Suggestions - Uses HOJAI AI
 * POST /api/ai/abtest/suggest
 */
app.post('/api/ai/abtest/suggest', async (req: Request, res: Response) => {
  try {
    const { content, variable } = req.body;

    const result = await hojaiClient.suggestABTests({
      content,
      variable
    });

    res.json({
      success: true,
      variations: result.variations,
      hypotheses: result.hypotheses,
      predictedWinner: result.predictedWinner
    });
  } catch (error) {
    logger.error('A/B test suggestion error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Scheduled AI Tasks
 * GET /api/ai/scheduled
 */
app.get('/api/ai/scheduled', async (req: Request, res: Response) => {
  try {
    const tasks = await hojaiClient.getScheduledTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar HOJAI AI Gateway started on port ${PORT}`);
  logger.info(`📡 HOJAI SDK connected to ${process.env.HOJAI_BASE_URL || 'http://localhost:4800'}`);
});

export default app;
