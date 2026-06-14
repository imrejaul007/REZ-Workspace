/**
 * REE Creative Studio
 *
 * Ad creative generation and management
 * Port: 3005
 *
 * Features:
 * - Creative templates
 * - A/B testing
 * - Asset library
 * - Performance analytics
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3005', 10);

// Types
type CreativeStatus = 'draft' | 'active' | 'paused' | 'archived';
type CreativeType = 'banner' | 'video' | 'carousel' | 'story' | 'text' | 'native';
type AssetType = 'image' | 'video' | 'audio' | 'font' | 'color';

interface Creative {
  id: string;
  name: string;
  type: CreativeType;
  status: CreativeStatus;
  merchant_id: string;
  campaign_id?: string;
  content: {
    headline?: string;
    body?: string;
    cta?: string;
    image_url?: string;
    video_url?: string;
  };
  target_audience: {
    age_min?: number;
    age_max?: number;
    gender?: string[];
    location?: string[];
    interests?: string[];
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversion_rate: number;
    spend: number;
  };
  variants: string[];
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

interface Template {
  id: string;
  name: string;
  type: CreativeType;
  category: string;
  structure: Record<string, unknown>;
  placeholders: string[];
  thumbnail_url?: string;
  usage_count: number;
  conversion_avg: number;
}

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  size: number;
  mime_type: string;
  merchant_id?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ABMTest {
  id: string;
  name: string;
  creative_ids: string[];
  status: 'running' | 'completed' | 'paused';
  start_date: string;
  end_date?: string;
  results: {
    creative_id: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    statistical_significance: number;
  }[];
  winner?: string;
  confidence_level: number;
}

// In-memory storage
const creatives = new Map<string, Creative>();
const templates = new Map<string, Template>();
const assets = new Map<string, Asset>();
const tests = new Map<string, ABMTest>();

// Initialize with sample data
const sampleTemplates: Template[] = [
  {
    id: 'template_banner_1',
    name: 'Classic Banner',
    type: 'banner',
    category: 'general',
    structure: { width: 300, height: 250, format: 'png' },
    placeholders: ['headline', 'image', 'cta'],
    thumbnail_url: '/thumbnails/banner-classic.png',
    usage_count: 1250,
    conversion_avg: 3.2
  },
  {
    id: 'template_carousel_1',
    name: 'Product Carousel',
    type: 'carousel',
    category: 'e-commerce',
    structure: { slides: 5, swipe_enabled: true },
    placeholders: ['headline', 'product_image', 'price', 'cta'],
    thumbnail_url: '/thumbnails/carousel-product.png',
    usage_count: 890,
    conversion_avg: 4.1
  },
  {
    id: 'template_video_15s',
    name: '15 Second Video',
    type: 'video',
    category: 'awareness',
    structure: { duration: 15, format: 'mp4', resolution: '1080p' },
    placeholders: ['logo', 'headline', 'product_shot', 'cta'],
    thumbnail_url: '/thumbnails/video-15s.png',
    usage_count: 456,
    conversion_avg: 2.8
  }
];

sampleTemplates.forEach(t => templates.set(t.id, t));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'creative-studio',
    version: '1.0.0',
    creatives_count: creatives.size,
    templates_count: templates.size,
    assets_count: assets.size,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// CREATIVE MANAGEMENT
// ============================================

app.get('/api/creatives', (req: Request, res: Response) => {
  const { merchant_id, campaign_id, status, type, limit = 50 } = req.query;

  let result = Array.from(creatives.values());

  if (merchant_id) result = result.filter(c => c.merchant_id === merchant_id);
  if (campaign_id) result = result.filter(c => c.campaign_id === campaign_id);
  if (status) result = result.filter(c => c.status === status);
  if (type) result = result.filter(c => c.type === type);

  result = result.slice(0, parseInt(limit as string));

  res.json({ creatives: result, count: result.length });
});

app.get('/api/creatives/:id', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }
  res.json({ creative });
});

app.post('/api/creatives', (req: Request, res: Response) => {
  try {
    const { name, type, merchant_id, campaign_id, content, target_audience } = req.body;

    if (!name || !type || !merchant_id) {
      res.status(400).json({ error: 'Missing required fields: name, type, merchant_id' });
      return;
    }

    const creative: Creative = {
      id: `creative_${uuidv4()}`,
      name,
      type,
      status: 'draft',
      merchant_id,
      campaign_id,
      content: content || {},
      target_audience: target_audience || {},
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversion_rate: 0,
        spend: 0
      },
      variants: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    creatives.set(creative.id, creative);

    res.json({ success: true, creative });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/creatives/:id', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }

  const { name, content, target_audience, status } = req.body;

  if (name) creative.name = name;
  if (content) creative.content = { ...creative.content, ...content };
  if (target_audience) creative.target_audience = { ...creative.target_audience, ...target_audience };
  if (status) creative.status = status;

  creative.updated_at = new Date().toISOString();
  creatives.set(creative.id, creative);

  res.json({ success: true, creative });
});

app.post('/api/creatives/:id/publish', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }

  creative.status = 'active';
  creative.updated_at = new Date().toISOString();
  creatives.set(creative.id, creative);

  res.json({ success: true, creative });
});

app.post('/api/creatives/:id/pause', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }

  creative.status = 'paused';
  creative.updated_at = new Date().toISOString();
  creatives.set(creative.id, creative);

  res.json({ success: true, creative });
});

app.post('/api/creatives/:id/archive', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }

  creative.status = 'archived';
  creative.archived_at = new Date().toISOString();
  creative.updated_at = new Date().toISOString();
  creatives.set(creative.id, creative);

  res.json({ success: true, creative });
});

// ============================================
// TEMPLATES
// ============================================

app.get('/api/templates', (req: Request, res: Response) => {
  const { type, category, sort = 'usage' } = req.query;

  let result = Array.from(templates.values());

  if (type) result = result.filter(t => t.type === type);
  if (category) result = result.filter(t => t.category === category);

  if (sort === 'usage') result.sort((a, b) => b.usage_count - a.usage_count);
  if (sort === 'conversion') result.sort((a, b) => b.conversion_avg - a.conversion_avg);

  res.json({ templates: result, count: result.length });
});

app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json({ template });
});

app.post('/api/templates/:id/use', (req: Request, res: Response) => {
  const template = templates.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const { merchant_id, content } = req.body;

  // Create creative from template
  const creative: Creative = {
    id: `creative_${uuidv4()}`,
    name: `${template.name} - ${new Date().toISOString()}`,
    type: template.type,
    status: 'draft',
    merchant_id: merchant_id || 'unknown',
    content: content || {},
    target_audience: {},
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversion_rate: 0,
      spend: 0
    },
    variants: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  creatives.set(creative.id, creative);
  template.usage_count++;
  templates.set(template.id, template);

  res.json({ success: true, creative, template });
});

// ============================================
// ASSETS
// ============================================

app.get('/api/assets', (req: Request, res: Response) => {
  const { type, merchant_id, tags } = req.query;

  let result = Array.from(assets.values());

  if (type) result = result.filter(a => a.type === type);
  if (merchant_id) result = result.filter(a => a.merchant_id === merchant_id);
  if (tags) {
    const tagList = (tags as string).split(',');
    result = result.filter(a => tagList.some(t => a.tags.includes(t)));
  }

  res.json({ assets: result, count: result.length });
});

app.post('/api/assets', (req: Request, res: Response) => {
  const { name, type, url, size, mime_type, merchant_id, tags, metadata } = req.body;

  if (!name || !type || !url) {
    res.status(400).json({ error: 'Missing required fields: name, type, url' });
    return;
  }

  const asset: Asset = {
    id: `asset_${uuidv4()}`,
    name,
    type,
    url,
    size: size || 0,
    mime_type: mime_type || 'application/octet-stream',
    merchant_id,
    tags: tags || [],
    metadata: metadata || {},
    created_at: new Date().toISOString()
  };

  assets.set(asset.id, asset);

  res.json({ success: true, asset });
});

// ============================================
// A/B TESTING
// ============================================

app.post('/api/tests', (req: Request, res: Response) => {
  const { name, creative_ids } = req.body;

  if (!name || !creative_ids || creative_ids.length < 2) {
    res.status(400).json({ error: 'Missing required fields: name, creative_ids (min 2)' });
    return;
  }

  const test: ABMTest = {
    id: `test_${uuidv4()}`,
    name,
    creative_ids,
    status: 'running',
    start_date: new Date().toISOString(),
    results: creative_ids.map(id => ({
      creative_id: id,
      impressions: Math.floor(Math.random() * 10000),
      clicks: Math.floor(Math.random() * 500),
      conversions: Math.floor(Math.random() * 50),
      ctr: 0,
      statistical_significance: 0
    })),
    confidence_level: 0
  };

  // Calculate CTR
  test.results.forEach(r => {
    r.ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
  });

  tests.set(test.id, test);

  res.json({ success: true, test });
});

app.get('/api/tests/:id', (req: Request, res: Response) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }
  res.json({ test });
});

app.post('/api/tests/:id/complete', (req: Request, res: Response) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }

  test.status = 'completed';
  test.end_date = new Date().toISOString();

  // Determine winner
  const sorted = [...test.results].sort((a, b) => b.ctr - a.ctr);
  if (sorted.length > 1) {
    const diff = Math.abs(sorted[0].ctr - sorted[1].ctr);
    test.confidence_level = Math.min(0.99, 1 - diff * 10);

    if (test.confidence_level > 0.95 && diff > 0.01) {
      test.winner = sorted[0].creative_id;
    }
  }

  tests.set(test.id, test);

  res.json({ success: true, test });
});

// ============================================
// METRICS
// ============================================

app.post('/api/creatives/:id/metrics', (req: Request, res: Response) => {
  const creative = creatives.get(req.params.id);
  if (!creative) {
    res.status(404).json({ error: 'Creative not found' });
    return;
  }

  const { impressions, clicks, conversions, spend } = req.body;

  if (impressions !== undefined) creative.metrics.impressions += impressions;
  if (clicks !== undefined) creative.metrics.clicks += clicks;
  if (conversions !== undefined) creative.metrics.conversions += conversions;
  if (spend !== undefined) creative.metrics.spend += spend;

  // Recalculate rates
  creative.metrics.ctr = creative.metrics.impressions > 0
    ? creative.metrics.clicks / creative.metrics.impressions
    : 0;
  creative.metrics.conversion_rate = creative.metrics.clicks > 0
    ? creative.metrics.conversions / creative.metrics.clicks
    : 0;

  creative.updated_at = new Date().toISOString();
  creatives.set(creative.id, creative);

  res.json({ success: true, metrics: creative.metrics });
});

// ============================================
// ANALYTICS
// ============================================

app.get('/api/analytics/dashboard', (req: Request, res: Response) => {
  const creativeList = Array.from(creatives.values());

  const byType = creativeList.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = creativeList.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totals = creativeList.reduce((acc, c) => ({
    impressions: acc.impressions + c.metrics.impressions,
    clicks: acc.clicks + c.metrics.clicks,
    conversions: acc.conversions + c.metrics.conversions,
    spend: acc.spend + c.metrics.spend
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0 });

  totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  res.json({
    summary: {
      total_creatives: creativeList.length,
      active: creativeList.filter(c => c.status === 'active').length,
      ...totals
    },
    by_type: byType,
    by_status: byStatus,
    top_performers: [...creativeList]
      .sort((a, b) => b.metrics.ctr - a.metrics.ctr)
      .slice(0, 5)
      .map(c => ({ id: c.id, name: c.name, ctr: c.metrics.ctr }))
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Creative Studio Error]', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`REE Creative Studio - Port ${PORT}`);
  console.log(`  → Creatives: GET/POST /api/creatives`);
  console.log(`  → Templates: GET /api/templates`);
  console.log(`  → Assets: GET/POST /api/assets`);
  console.log(`  → A/B Tests: POST /api/tests`);
  console.log(`  → Analytics: GET /api/analytics/dashboard`);
});

export default app;