/**
 * Creative Studio Service
 *
 * Ad creative management, templates, and asset management.
 * Features:
 * - Template library
 * - Drag-drop builder
 * - Asset management
 * - Creative optimization
 *
 * Port: 4700
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface AdTemplate {
  id: string;
  name: string;
  category: 'native' | 'display' | 'video' | 'qr' | 'social';
  format: 'banner' | 'square' | 'story' | 'reel';
  dimensions: { width: number; height: number };
  elements: TemplateElement[];
  thumbnail: string;
  popularity: number;
}

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'background' | 'logo';
  properties: Record<string, unknown>;
  editable: boolean;
}

interface Creative {
  id: string;
  advertiserId: string;
  name: string;
  templateId?: string;
  format: 'native' | 'display' | 'video' | 'qr';
  content: CreativeContent;
  preview: string;
  status: 'draft' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

interface CreativeContent {
  headline?: string;
  description?: string;
  cta?: string;
  imageUrl?: string;
  logoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface AdAsset {
  id: string;
  advertiserId: string;
  name: string;
  type: 'image' | 'video' | 'logo' | 'font';
  url: string;
  size: number;
  dimensions?: { width: number; height: number };
  format: string;
  uploadedAt: Date;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const templates: AdTemplate[] = [
  {
    id: 'tpl_001',
    name: 'Clean Native Banner',
    category: 'native',
    format: 'banner',
    dimensions: { width: 1200, height: 628 },
    elements: [
      { id: 'el_1', type: 'background', properties: { color: '#ffffff' }, editable: true },
      { id: 'el_2', type: 'image', properties: { position: 'center' }, editable: true },
      { id: 'el_3', type: 'text', properties: { fontSize: 24, fontWeight: 'bold' }, editable: true },
      { id: 'el_4', type: 'text', properties: { fontSize: 16 }, editable: true },
      { id: 'el_5', type: 'button', properties: { text: 'Shop Now', color: '#FF5722' }, editable: true },
    ],
    thumbnail: 'https://cdn.example.com/templates/native_01.jpg',
    popularity: 95,
  },
  {
    id: 'tpl_002',
    name: 'Bold Display Ad',
    category: 'display',
    format: 'banner',
    dimensions: { width: 728, height: 90 },
    elements: [
      { id: 'el_1', type: 'background', properties: { gradient: true }, editable: true },
      { id: 'el_2', type: 'logo', properties: { position: 'left' }, editable: true },
      { id: 'el_3', type: 'text', properties: { fontSize: 28, fontWeight: 'bold' }, editable: true },
      { id: 'el_4', type: 'button', properties: { text: 'Learn More' }, editable: true },
    ],
    thumbnail: 'https://cdn.example.com/templates/display_01.jpg',
    popularity: 88,
  },
  {
    id: 'tpl_003',
    name: 'Instagram Story',
    category: 'social',
    format: 'story',
    dimensions: { width: 1080, height: 1920 },
    elements: [
      { id: 'el_1', type: 'background', properties: { color: '#1a1a2e' }, editable: true },
      { id: 'el_2', type: 'image', properties: { position: 'cover' }, editable: true },
      { id: 'el_3', type: 'text', properties: { fontSize: 48, fontWeight: 'bold', color: '#ffffff' }, editable: true },
      { id: 'el_4', type: 'text', properties: { fontSize: 24, color: '#cccccc' }, editable: true },
      { id: 'el_5', type: 'button', properties: { text: 'Shop Now', style: 'rounded' }, editable: true },
    ],
    thumbnail: 'https://cdn.example.com/templates/story_01.jpg',
    popularity: 92,
  },
  {
    id: 'tpl_004',
    name: 'Restaurant QR Card',
    category: 'qr',
    format: 'square',
    dimensions: { width: 500, height: 500 },
    elements: [
      { id: 'el_1', type: 'background', properties: { color: '#f5f5f5' }, editable: true },
      { id: 'el_2', type: 'image', properties: { src: 'qr-placeholder', size: 200 }, editable: false },
      { id: 'el_3', type: 'text', properties: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }, editable: true },
      { id: 'el_4', type: 'text', properties: { fontSize: 14, textAlign: 'center' }, editable: true },
      { id: 'el_5', type: 'logo', properties: { position: 'bottom', size: 60 }, editable: true },
    ],
    thumbnail: 'https://cdn.example.com/templates/qr_01.jpg',
    popularity: 78,
  },
  {
    id: 'tpl_005',
    name: 'Video Pre-roll',
    category: 'video',
    format: 'banner',
    dimensions: { width: 1920, height: 1080 },
    elements: [
      { id: 'el_1', type: 'background', properties: { video: true }, editable: false },
      { id: 'el_2', type: 'text', properties: { fontSize: 64, fontWeight: 'bold', position: 'center' }, editable: true },
      { id: 'el_3', type: 'text', properties: { fontSize: 32, position: 'center' }, editable: true },
    ],
    thumbnail: 'https://cdn.example.com/templates/video_01.jpg',
    popularity: 65,
  },
];

const creatives: Creative[] = [
  {
    id: 'cr_001',
    advertiserId: 'adv_001',
    name: 'Pizza Palace Launch Ad',
    templateId: 'tpl_001',
    format: 'native',
    content: {
      headline: 'Fresh Pizza, Delivered Fast!',
      description: 'Order now and get 20% off your first order',
      cta: 'Order Now',
      imageUrl: 'https://cdn.example.com/pizza.jpg',
    },
    preview: 'https://cdn.example.com/preview/cr_001.jpg',
    status: 'approved',
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-05-25'),
  },
];

const assets: AdAsset[] = [
  { id: 'ast_001', advertiserId: 'adv_001', name: 'Pizza Banner', type: 'image', url: 'https://cdn.example.com/pizza.jpg', size: 245000, dimensions: { width: 1200, height: 628 }, format: 'jpg', uploadedAt: new Date('2026-05-15') },
  { id: 'ast_002', advertiserId: 'adv_001', name: 'Brand Logo', type: 'logo', url: 'https://cdn.example.com/logo.png', size: 45000, dimensions: { width: 200, height: 200 }, format: 'png', uploadedAt: new Date('2026-05-10') },
  { id: 'ast_003', advertiserId: 'adv_001', name: 'Product Video', type: 'video', url: 'https://cdn.example.com/video.mp4', size: 15000000, format: 'mp4', uploadedAt: new Date('2026-05-18') },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4700', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'creative-studio', version: '1.0.0', templates: templates.length, creatives: creatives.length });
});

// ============================================================================
// TEMPLATES
// ============================================================================

// List templates
app.get('/api/templates', (req: Request, res: Response) => {
  const { category, format, search } = req.query;

  let filtered = [...templates];

  if (category) filtered = filtered.filter(t => t.category === category);
  if (format) filtered = filtered.filter(t => t.format === format);
  if (search) {
    const s = search.toString().toLowerCase();
    filtered = filtered.filter(t => t.name.toLowerCase().includes(s));
  }

  // Sort by popularity
  filtered.sort((a, b) => b.popularity - a.popularity);

  res.json({ success: true, data: filtered });
});

// Get template
app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

// Get template elements
app.get('/api/templates/:id/elements', (req: Request, res: Response) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template.elements });
});

// ============================================================================
// CREATIVES
// ============================================================================

// List creatives
app.get('/api/creatives', (req: Request, res: Response) => {
  const { advertiserId, status, format } = req.query;

  let filtered = [...creatives];

  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (format) filtered = filtered.filter(c => c.format === format);

  res.json({ success: true, data: filtered });
});

// Get creative
app.get('/api/creatives/:id', (req: Request, res: Response) => {
  const creative = creatives.find(c => c.id === req.params.id);
  if (!creative) return res.status(404).json({ success: false, error: 'Creative not found' });
  res.json({ success: true, data: creative });
});

// Create creative
app.post('/api/creatives', (req: Request, res: Response) => {
  const { advertiserId, name, templateId, format, content } = req.body;

  if (!advertiserId || !name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const creative: Creative = {
    id: `cr_${Date.now()}`,
    advertiserId,
    name,
    templateId,
    format: format || 'native',
    content: content || {},
    preview: `https://cdn.example.com/preview/${Date.now()}.jpg`,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  creatives.push(creative);

  res.json({ success: true, data: creative });
});

// Update creative
app.patch('/api/creatives/:id', (req: Request, res: Response) => {
  const creative = creatives.find(c => c.id === req.params.id);
  if (!creative) return res.status(404).json({ success: false, error: 'Creative not found' });

  Object.assign(creative, req.body, { updatedAt: new Date() });

  res.json({ success: true, data: creative });
});

// Preview creative
app.post('/api/creatives/:id/preview', (req: Request, res: Response) => {
  const creative = creatives.find(c => c.id === req.params.id);
  if (!creative) return res.status(404).json({ success: false, error: 'Creative not found' });

  res.json({
    success: true,
    data: {
      previewUrl: creative.preview,
      generatedAt: new Date(),
      format: creative.format,
    },
  });
});

// Approve/Reject creative
app.patch('/api/creatives/:id/status', (req: Request, res: Response) => {
  const creative = creatives.find(c => c.id === req.params.id);
  if (!creative) return res.status(404).json({ success: false, error: 'Creative not found' });

  const { status } = req.body;
  if (!['draft', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  creative.status = status;
  creative.updatedAt = new Date();

  res.json({ success: true, data: creative });
});

// ============================================================================
// ASSETS
// ============================================================================

// List assets
app.get('/api/assets', (req: Request, res: Response) => {
  const { advertiserId, type } = req.query;

  let filtered = [...assets];

  if (advertiserId) filtered = filtered.filter(a => a.advertiserId === advertiserId);
  if (type) filtered = filtered.filter(a => a.type === type);

  res.json({ success: true, data: filtered });
});

// Upload asset (simulated)
app.post('/api/assets', (req: Request, res: Response) => {
  const { advertiserId, name, type, url, size, dimensions, format } = req.body;

  const asset: AdAsset = {
    id: `ast_${Date.now()}`,
    advertiserId,
    name,
    type,
    url,
    size: size || 0,
    dimensions,
    format: format || 'jpg',
    uploadedAt: new Date(),
  };

  assets.push(asset);

  res.json({ success: true, data: asset });
});

// Delete asset
app.delete('/api/assets/:id', (req: Request, res: Response) => {
  const index = assets.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Asset not found' });

  assets.splice(index, 1);

  res.json({ success: true, message: 'Asset deleted' });
});

// ============================================================================
// CREATIVE OPTIMIZATION
// ============================================================================

// Get creative performance
app.get('/api/creatives/:id/performance', (req: Request, res: Response) => {
  const creative = creatives.find(c => c.id === req.params.id);
  if (!creative) return res.status(404).json({ success: false, error: 'Creative not found' });

  res.json({
    success: true,
    data: {
      creativeId: creative.id,
      impressions: Math.round(10000 + Math.random() * 50000),
      clicks: Math.round(500 + Math.random() * 2000),
      ctr: 3.5 + Math.random() * 2,
      conversions: Math.round(50 + Math.random() * 200),
      spend: Math.round(5000 + Math.random() * 20000),
      recommendations: [
        'Headline with numbers performs 23% better',
        'Add urgency text to increase CTR',
        'Use warm colors for food category',
      ],
    },
  });
});

// Get A/B test results
app.get('/api/creatives/:id/ab-test', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      variants: [
        { id: 'v1', headline: 'Fresh Pizza!', impressions: 5000, clicks: 250, ctr: 5.0 },
        { id: 'v2', headline: '20% Off Today Only!', impressions: 5000, clicks: 320, ctr: 6.4 },
      ],
      winner: 'v2',
      confidence: 95,
      uplift: 28,
    },
  });
});

app.listen(PORT, () => {
  logger.info(`[Creative Studio] Running on port ${PORT}`);
});

export default app;
