/**
 * Caption Routes - API route definitions
 * These routes are registered in src/index.ts
 */

import { Router } from 'express';
import { CaptionService } from '../services/caption.service';
import { GenerationRequest } from '../models/schemas';
import { authMiddleware } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize caption service (will be set from index.ts)
let captionService: CaptionService;

// Set caption service instance
export function setCaptionService(service: CaptionService): void {
  captionService = service;
}

// Helper to validate generation request
function validateGenerationRequest(body: any): { valid: boolean; error?: string } {
  if (!body.content || typeof body.content !== 'string' || body.content.length === 0) {
    return { valid: false, error: 'Content is required' };
  }
  if (body.content.length > 5000) {
    return { valid: false, error: 'Content must be under 5000 characters' };
  }
  if (body.variations && (body.variations < 1 || body.variations > 5)) {
    return { valid: false, error: 'Variations must be between 1 and 5' };
  }
  return { valid: true };
}

// POST /api/captions/generate - Generate captions with AI
router.post('/generate', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const validation = validateGenerationRequest(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

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

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate captions' });
  }
});

// POST /api/captions/variations - Generate A/B variations
router.post('/variations', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { content, count = 2, style } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    const result = await captionService.generateVariations(content, count, style);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate variations' });
  }
});

// GET /api/captions/templates - List caption templates
router.get('/templates', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { style, page = 1, limit = 20 } = req.query;
    // Templates are handled in index.ts with direct DB access
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

// POST /api/captions/templates - Create template
router.post('/templates', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { name, style, template, variables, createdBy } = req.body;
    if (!name || !style || !template) {
      res.status(400).json({ success: false, error: 'Name, style, and template are required' });
      return;
    }
    // Template creation handled in index.ts
    res.status(201).json({ success: true, data: { name, style, template } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// GET /api/captions/styles - Get available styles
router.get('/styles', async (_req, res) => {
  const styles = [
    { id: 'casual', name: 'Casual', description: 'Relaxed, conversational' },
    { id: 'professional', name: 'Professional', description: 'Polished, business-appropriate' },
    { id: 'witty', name: 'Witty', description: 'Clever, humorous' },
    { id: 'inspirational', name: 'Inspirational', description: 'Motivational' },
    { id: 'educational', name: 'Educational', description: 'Informative' },
  ];
  res.json({ success: true, data: styles });
});

// POST /api/captions/brand-voice - Set brand voice
router.post('/brand-voice', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { brandId, name, style, tone, commonPhrases, avoidPhrases, personality } = req.body;
    if (!brandId || !name) {
      res.status(400).json({ success: false, error: 'Brand ID and name are required' });
      return;
    }
    const result = await captionService.setBrandVoice({ brandId, name, style, tone, commonPhrases, avoidPhrases, personality });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to set brand voice' });
  }
});

// GET /api/captions/brand-voice/:brandId - Get brand voice
router.get('/brand-voice/:brandId', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const result = await captionService.getBrandVoice(req.params.brandId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Brand voice not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get brand voice' });
  }
});

// POST /api/captions/translate - Translate captions
router.post('/translate', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { caption, targetLanguage, preserveEmojis = true } = req.body;
    if (!caption || !targetLanguage) {
      res.status(400).json({ success: false, error: 'Caption and target language are required' });
      return;
    }
    const result = await captionService.translateCaption(caption, targetLanguage, preserveEmojis);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to translate caption' });
  }
});

// POST /api/captions/hooks - Generate story hooks
router.post('/hooks', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { topic, count = 3, style } = req.body;
    if (!topic) {
      res.status(400).json({ success: false, error: 'Topic is required' });
      return;
    }
    const result = await captionService.generateStoryHooks(topic, count, style);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate story hooks' });
  }
});

// POST /api/captions/hashtags - Generate hashtags
router.post('/hashtags', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { content, count = 10, includeTrending = false } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }
    const result = await captionService.generateHashtags(content, count, includeTrending);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate hashtags' });
  }
});

// POST /api/captions/cta - Generate CTAs
router.post('/cta', authMiddleware(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  process.env.INTERNAL_SERVICE_TOKEN || ''
), async (req, res) => {
  try {
    const { context, count = 3, style } = req.body;
    if (!context) {
      res.status(400).json({ success: false, error: 'Context is required' });
      return;
    }
    const result = await captionService.generateCTAs(context, count, style);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate CTAs' });
  }
});

export default router;