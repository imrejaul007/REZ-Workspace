/**
 * caption-generator-ai - AI-Powered Caption Generation Service
 * Generates creative captions, hashtags, CTAs, and content variations
 *
 * Features:
 * - Multiple caption styles (casual, professional, witty, inspirational)
 * - Emoji optimization
 * - Call-to-action generation
 * - Story hooks
 * - Caption templates
 * - Brand voice adaptation
 * - A/B variations for testing
 * - Hashtag integration
 * - Character count optimization
 * - Translation to multiple languages
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import OpenAI from 'openai';
import axios from 'axios';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import logger from 'utils/logger.js';
import { GenerationRequestSchema, IGeneratedCaption, CaptionTemplate } from './models/schemas';
import { CaptionService } from './services/caption.service';
import { authMiddleware } from './middleware/auth';

// Load OpenAPI specification
const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Initialize Prometheus metrics
const register = new Registry();
collectDefaultMetrics({ register });

// Metrics
const generationCounter = new Counter({
  name: 'caption_generation_total',
  help: 'Total number of caption generations',
  labelNames: ['style', 'status'],
  registers: [register],
});

const generationDuration = new Histogram({
  name: 'caption_generation_duration_seconds',
  help: 'Duration of caption generation requests',
  labelNames: ['style'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const app = express();

// Configuration
const PORT = parseInt(process.env.PORT || '5091', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/caption-generator';

// RABTUL Integration
const RABTUL = {
  AUTH_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || '',
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Caption Service
const captionService = new CaptionService(openai);

// CORS Configuration
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Token'],
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Error handler middleware
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
}

// Validation middleware
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ==================== HEALTH & METRICS ====================

// Health check endpoint
app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const openaiOk = !!process.env.OPENAI_API_KEY;
  res.json({
    status: mongoOk && openaiOk ? 'healthy' : 'degraded',
    service: 'caption-generator-ai',
    mongodb: mongoOk ? 'connected' : 'disconnected',
    openai: openaiOk ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
  });
});

// Ready check
app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }
  res.json({ ready: true });
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Caption Generator AI API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// ==================== CAPTION GENERATION ====================

// Generate captions with AI
app.post('/api/captions/generate',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  validateBody(GenerationRequestSchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const {
        content,
        brandVoice,
        style,
        tone,
        length,
        includeHashtags,
        includeCTA,
        platforms,
        variations,
      } = req.body;

      logger.info('Generating captions', { content: content.substring(0, 50), style, tone });

      const result = await captionService.generateCaptions({
        content,
        brandVoice,
        style,
        tone,
        length,
        includeHashtags,
        includeCTA,
        platforms,
        variations,
      });

      generationCounter.inc({ style: style || 'default', status: 'success' });
      generationDuration.observe({ style: style || 'default' }, (Date.now() - startTime) / 1000);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Caption generation error:', { error: error instanceof Error ? error.message : 'Unknown' });
      generationCounter.inc({ style: req.body.style || 'default', status: 'error' });
      res.status(500).json({ success: false, error: 'Failed to generate captions' });
    }
  }
);

// Generate A/B variations
app.post('/api/captions/variations',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { content, count = 2, style } = req.body;

      if (!content) {
        res.status(400).json({ success: false, error: 'Content is required' });
        return;
      }

      if (count < 2 || count > 5) {
        res.status(400).json({ success: false, error: 'Count must be between 2 and 5' });
        return;
      }

      logger.info('Generating A/B variations', { content: content.substring(0, 50), count });

      const result = await captionService.generateVariations(content, count, style);

      generationCounter.inc({ style: 'variations', status: 'success' });
      generationDuration.observe({ style: 'variations' }, (Date.now() - startTime) / 1000);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Variation generation error:', { error: error instanceof Error ? error.message : 'Unknown' });
      generationCounter.inc({ style: 'variations', status: 'error' });
      res.status(500).json({ success: false, error: 'Failed to generate variations' });
    }
  }
);

// ==================== TEMPLATES ====================

// List caption templates
app.get('/api/captions/templates',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { style, page = 1, limit = 20 } = req.query;

      const query: Record<string, unknown> = {};
      if (style) query.style = style;

      const templates = await CaptionTemplate.find(query)
        .sort({ usageCount: -1, createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await CaptionTemplate.countDocuments(query);

      res.json({
        success: true,
        data: templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('List templates error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to list templates' });
    }
  }
);

// Create template
app.post('/api/captions/templates',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { name, style, template, variables, createdBy } = req.body;

      if (!name || !style || !template) {
        res.status(400).json({ success: false, error: 'Name, style, and template are required' });
        return;
      }

      const newTemplate = new CaptionTemplate({
        name,
        style,
        template,
        variables: variables || [],
        usageCount: 0,
        createdBy: createdBy || 'system',
      });

      await newTemplate.save();

      res.status(201).json({
        success: true,
        data: newTemplate,
      });
    } catch (error) {
      logger.error('Create template error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  }
);

// Update template usage
app.patch('/api/captions/templates/:id/use',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const template = await CaptionTemplate.findByIdAndUpdate(
        req.params.id,
        { $inc: { usageCount: 1 } },
        { new: true }
      );

      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error) {
      logger.error('Update template error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to update template' });
    }
  }
);

// ==================== STYLES & BRAND VOICE ====================

// Get available styles
app.get('/api/captions/styles', async (_req, res) => {
  try {
    const styles = [
      {
        id: 'casual',
        name: 'Casual',
        description: 'Relaxed, conversational tone perfect for everyday content',
        emoji: '😊',
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Polished, business-appropriate content for corporate audiences',
        emoji: '💼',
      },
      {
        id: 'witty',
        name: 'Witty',
        description: 'Clever, humorous content that engages with wordplay',
        emoji: '😏',
      },
      {
        id: 'inspirational',
        name: 'Inspirational',
        description: 'Motivational content that uplifts and inspires',
        emoji: '✨',
      },
      {
        id: 'educational',
        name: 'Educational',
        description: 'Informative content that teaches and informs',
        emoji: '📚',
      },
    ];

    const tones = [
      { id: 'friendly', name: 'Friendly', emoji: '🤝' },
      { id: 'bold', name: 'Bold', emoji: '🔥' },
      { id: 'luxury', name: 'Luxury', emoji: '💎' },
      { id: 'playful', name: 'Playful', emoji: '🎉' },
      { id: 'professional', name: 'Professional', emoji: '💼' },
    ];

    const lengths = [
      { id: 'short', name: 'Short', maxChars: 150, description: 'Quick, punchy captions' },
      { id: 'medium', name: 'Medium', maxChars: 300, description: 'Balanced content length' },
      { id: 'long', name: 'Long', maxChars: 500, description: 'Detailed, story-driven content' },
    ];

    res.json({
      success: true,
      data: { styles, tones, lengths },
    });
  } catch (error) {
    logger.error('Get styles error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to get styles' });
  }
});

// Set brand voice
app.post('/api/captions/brand-voice',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { brandId, name, style, tone, commonPhrases, avoidPhrases, personality } = req.body;

      if (!brandId || !name) {
        res.status(400).json({ success: false, error: 'Brand ID and name are required' });
        return;
      }

      const brandVoice = await captionService.setBrandVoice({
        brandId,
        name,
        style,
        tone,
        commonPhrases,
        avoidPhrases,
        personality,
      });

      res.json({
        success: true,
        data: brandVoice,
      });
    } catch (error) {
      logger.error('Set brand voice error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to set brand voice' });
    }
  }
);

// Get brand voice
app.get('/api/captions/brand-voice/:brandId',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const brandVoice = await captionService.getBrandVoice(req.params.brandId);

      if (!brandVoice) {
        res.status(404).json({ success: false, error: 'Brand voice not found' });
        return;
      }

      res.json({ success: true, data: brandVoice });
    } catch (error) {
      logger.error('Get brand voice error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to get brand voice' });
    }
  }
);

// ==================== TRANSLATION ====================

// Translate captions
app.post('/api/captions/translate',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { caption, targetLanguage, preserveEmojis = true } = req.body;

      if (!caption || !targetLanguage) {
        res.status(400).json({ success: false, error: 'Caption and target language are required' });
        return;
      }

      logger.info('Translating caption', { targetLanguage });

      const translated = await captionService.translateCaption(caption, targetLanguage, preserveEmojis);

      res.json({
        success: true,
        data: translated,
      });
    } catch (error) {
      logger.error('Translate caption error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to translate caption' });
    }
  }
);

// ==================== STORY HOOKS ====================

// Generate story hooks
app.post('/api/captions/hooks',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { topic, count = 3, style } = req.body;

      if (!topic) {
        res.status(400).json({ success: false, error: 'Topic is required' });
        return;
      }

      if (count < 1 || count > 10) {
        res.status(400).json({ success: false, error: 'Count must be between 1 and 10' });
        return;
      }

      logger.info('Generating story hooks', { topic, count });

      const hooks = await captionService.generateStoryHooks(topic, count, style);

      res.json({
        success: true,
        data: hooks,
      });
    } catch (error) {
      logger.error('Generate hooks error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to generate story hooks' });
    }
  }
);

// ==================== HASHTAG SUGGESTIONS ====================

// Generate hashtag suggestions
app.post('/api/captions/hashtags',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { content, count = 10, includeTrending = false } = req.body;

      if (!content) {
        res.status(400).json({ success: false, error: 'Content is required' });
        return;
      }

      logger.info('Generating hashtags', { content: content.substring(0, 50) });

      const hashtags = await captionService.generateHashtags(content, count, includeTrending);

      res.json({
        success: true,
        data: hashtags,
      });
    } catch (error) {
      logger.error('Generate hashtags error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to generate hashtags' });
    }
  }
);

// ==================== CTA GENERATION ====================

// Generate CTAs
app.post('/api/captions/cta',
  authMiddleware(RABTUL.AUTH_URL, RABTUL.INTERNAL_TOKEN),
  async (req: Request, res: Response) => {
    try {
      const { context, count = 3, style } = req.body;

      if (!context) {
        res.status(400).json({ success: false, error: 'Context is required' });
        return;
      }

      logger.info('Generating CTAs', { context });

      const ctas = await captionService.generateCTAs(context, count, style);

      res.json({
        success: true,
        data: ctas,
      });
    } catch (error) {
      logger.error('Generate CTA error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Failed to generate CTAs' });
    }
  }
);

// Error handler
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);

    app.listen(PORT, () => {
      logger.info(`[${new Date().toISOString()}] caption-generator-ai running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup error:', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

start();

export default app;
