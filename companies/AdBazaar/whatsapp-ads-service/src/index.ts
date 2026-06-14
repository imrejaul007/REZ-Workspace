/**
 * WhatsApp Commerce Ads Service
 *
 * India-specific WhatsApp advertising platform.
 * Connects ads to WhatsApp commerce flows.
 *
 * Features:
 * - WhatsApp ad campaigns
 * - Click-to-WhatsApp tracking
 * - WhatsApp order attribution
 * - WhatsApp loyalty integration
 *
 * Port: 4640
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface WhatsAppAdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  messageTemplate: string;
  cta: {
    type: 'click_to_chat' | 'quick_reply' | 'list' | 'button';
    text: string;
    phoneNumber: string;
    preFilledMessage?: string;
  };
  targetCriteria: {
    cities?: string[];
    segments?: string[];
    interests?: string[];
  };
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: WhatsAppAdStats;
}

interface WhatsAppAdStats {
  sent: number;
  delivered: number;
  read: number;
  clicks: number;
  conversations: number;
  orders: number;
  revenue: number;
}

interface WhatsAppTrackingEvent {
  id: string;
  campaignId: string;
  userId: string;
  event: 'sent' | 'delivered' | 'read' | 'click' | 'conversation' | 'order';
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface WhatsAppOrder {
  id: string;
  campaignId: string;
  userId: string;
  merchantId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  loyaltyCoinsEarned: number;
  createdAt: Date;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    text?: string;
    format?: 'text' | 'image' | 'video' | 'document';
    buttons?: Array<{ type: string; text: string }>;
  }>;
  approved: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const campaigns: WhatsAppAdCampaign[] = [
  {
    id: 'wa_001',
    advertiserId: 'adv_001',
    name: 'Pizza Palace Launch',
    messageTemplate: '🍕 Hey! Check out our new range of pizzas. Use code PIZZA20 for 20% off!',
    cta: {
      type: 'click_to_chat',
      text: 'Order Now',
      phoneNumber: '+919876543210',
      preFilledMessage: 'Hi! I saw your ad and would like to order.',
    },
    targetCriteria: {
      cities: ['Bangalore', 'Mumbai'],
      segments: ['food_lovers', 'pizza_fans'],
    },
    budget: 50000,
    spent: 12500,
    status: 'active',
    stats: {
      sent: 25000,
      delivered: 24500,
      read: 18000,
      clicks: 4200,
      conversations: 850,
      orders: 120,
      revenue: 36000,
    },
  },
  {
    id: 'wa_002',
    advertiserId: 'adv_002',
    name: 'Weekend Sale Alert',
    messageTemplate: '🛍️ Weekend special! Extra 15% off on all orders. Limited time only!',
    cta: {
      type: 'button',
      text: 'Shop Now',
      phoneNumber: '+919876543211',
    },
    targetCriteria: {
      cities: ['Delhi', 'Hyderabad'],
      interests: ['shopping', 'fashion'],
    },
    budget: 30000,
    spent: 8000,
    status: 'active',
    stats: {
      sent: 15000,
      delivered: 14700,
      read: 10500,
      clicks: 2800,
      conversations: 520,
      orders: 85,
      revenue: 25500,
    },
  },
];

const trackingEvents: WhatsAppTrackingEvent[] = [];
const orders: WhatsAppOrder[] = [];

const templates: WhatsAppTemplate[] = [
  {
    id: 'tmpl_001',
    name: 'Order Confirmation',
    category: 'utility',
    language: 'en',
    components: [
      { type: 'header', text: 'Order Confirmed! 🍕', format: 'text' },
      { type: 'body', text: 'Hi {{1}}, your order #{{2}} is confirmed. Total: ₹{{3}}' },
      { type: 'footer', text: 'Track your order in the app.' },
    ],
    approved: true,
  },
  {
    id: 'tmpl_002',
    name: 'Promotional Offer',
    category: 'marketing',
    language: 'en',
    components: [
      { type: 'header', text: 'Special Offer! 🎉', format: 'text' },
      { type: 'body', text: 'Hi {{1}}! {{2}}% off on your next order. Use code: {{3}}' },
      { type: 'button', text: 'Claim Offer', buttons: [{ type: 'quick_reply', text: 'Claim Now' }] },
    ],
    approved: true,
  },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4640', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'whatsapp-ads',
    version: '1.0.0',
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
  });
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, advertiserId } = req.query;

  let filtered = [...campaigns];

  if (status) filtered = filtered.filter(c => c.status === status);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);

  res.json({
    success: true,
    data: {
      campaigns: filtered,
      summary: {
        total: filtered.length,
        active: filtered.filter(c => c.status === 'active').length,
        totalSent: filtered.reduce((sum, c) => sum + c.stats.sent, 0),
        totalOrders: filtered.reduce((sum, c) => sum + c.stats.orders, 0),
        totalRevenue: filtered.reduce((sum, c) => sum + c.stats.revenue, 0),
      },
    },
  });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { advertiserId, name, messageTemplate, cta, targetCriteria, budget } = req.body;

  if (!advertiserId || !name || !messageTemplate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: WhatsAppAdCampaign = {
    id: `wa_${Date.now()}`,
    advertiserId,
    name,
    messageTemplate,
    cta: cta || { type: 'click_to_chat', text: 'Chat Now', phoneNumber: '+919876543210' },
    targetCriteria: targetCriteria || {},
    budget,
    spent: 0,
    status: 'draft',
    stats: {
      sent: 0, delivered: 0, read: 0, clicks: 0, conversations: 0, orders: 0, revenue: 0,
    },
  };

  campaigns.push(campaign);

  res.json({ success: true, data: campaign });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  res.json({ success: true, data: campaign });
});

// Update campaign
app.patch('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  Object.assign(campaign, req.body);

  res.json({ success: true, data: campaign });
});

// Update status
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  campaign.status = req.body.status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// TRACKING
// ============================================================================

// Track event
app.post('/api/track', (req: Request, res: Response) => {
  const { campaignId, userId, event, metadata } = req.body;

  if (!campaignId || !event) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign = campaigns.find(c => c.id === campaignId);
  if (campaign) {
    switch (event) {
      case 'sent':
        campaign.stats.sent++;
        break;
      case 'delivered':
        campaign.stats.delivered++;
        break;
      case 'read':
        campaign.stats.read++;
        break;
      case 'click':
        campaign.stats.clicks++;
        break;
      case 'conversation':
        campaign.stats.conversations++;
        break;
      case 'order':
        campaign.stats.orders++;
        break;
    }
  }

  const trackingEvent: WhatsAppTrackingEvent = {
    id: `evt_${Date.now()}`,
    campaignId,
    userId,
    event,
    timestamp: new Date(),
    metadata: metadata || {},
  };

  trackingEvents.push(trackingEvent);

  res.json({ success: true, data: { eventId: trackingEvent.id } });
});

// Get tracking events
app.get('/api/track/campaign/:id', (req: Request, res: Response) => {
  const events = trackingEvents.filter(e => e.campaignId === req.params.id);

  res.json({ success: true, data: events });
});

// ============================================================================
// CLICK-TO-WHATSAPP
// ============================================================================

// Generate click link
app.post('/api/click/generate', (req: Request, res: Response) => {
  const { campaignId, userId } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  // Track click
  campaign.stats.clicks++;

  // Generate WhatsApp link
  const phone = campaign.cta.phoneNumber.replace('+', '');
  const message = encodeURIComponent(campaign.cta.preFilledMessage || 'Hi!');
  const waLink = `https://wa.me/${phone}?text=${message}`;

  res.json({
    success: true,
    data: {
      clickId: `click_${Date.now()}`,
      campaignId,
      userId,
      waLink,
      timestamp: new Date(),
    },
  });
});

// ============================================================================
// ORDERS
// ============================================================================

// Create order from WhatsApp
app.post('/api/orders', (req: Request, res: Response) => {
  const { campaignId, userId, merchantId, items } = req.body;

  if (!merchantId || !items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const loyaltyCoinsEarned = Math.floor(total / 10); // 1 coin per ₹10

  const order: WhatsAppOrder = {
    id: `wa_ord_${Date.now()}`,
    campaignId,
    userId,
    merchantId,
    items,
    total,
    status: 'pending',
    loyaltyCoinsEarned,
    createdAt: new Date(),
  };

  orders.push(order);

  // Update campaign
  const campaign = campaigns.find(c => c.id === campaignId);
  if (campaign) {
    campaign.stats.orders++;
    campaign.stats.revenue += total;
  }

  res.json({ success: true, data: order });
});

// Get orders
app.get('/api/orders', (req: Request, res: Response) => {
  const { campaignId, userId, status } = req.query;

  let filtered = [...orders];

  if (campaignId) filtered = filtered.filter(o => o.campaignId === campaignId);
  if (userId) filtered = filtered.filter(o => o.userId === userId);
  if (status) filtered = filtered.filter(o => o.status === status);

  res.json({ success: true, data: filtered });
});

// Update order status
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.status = req.body.status;

  res.json({ success: true, data: order });
});

// ============================================================================
// TEMPLATES
// ============================================================================

// List templates
app.get('/api/templates', (req: Request, res: Response) => {
  const { category, approved } = req.query;

  let filtered = [...templates];

  if (category) filtered = filtered.filter(t => t.category === category);
  if (approved !== undefined) filtered = filtered.filter(t => t.approved === (approved === 'true'));

  res.json({ success: true, data: filtered });
});

// Create template
app.post('/api/templates', (req: Request, res: Response) => {
  const { name, category, language, components } = req.body;

  const template: WhatsAppTemplate = {
    id: `tmpl_${Date.now()}`,
    name,
    category: category || 'marketing',
    language: language || 'en',
    components: components || [],
    approved: false,
  };

  templates.push(template);

  res.json({ success: true, data: template });
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get campaign analytics
app.get('/api/analytics/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const { stats } = campaign;

  res.json({
    success: true,
    data: {
      campaign,
      metrics: {
        deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
        readRate: stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0,
        clickRate: stats.read > 0 ? (stats.clicks / stats.read) * 100 : 0,
        conversionRate: stats.clicks > 0 ? (stats.orders / stats.clicks) * 100 : 0,
        costPerSend: campaign.spent / stats.sent,
        costPerClick: campaign.spent / stats.clicks,
        costPerOrder: campaign.spent / stats.orders,
        revenuePerOrder: stats.revenue / stats.orders,
        roi: (stats.revenue - campaign.spent) / campaign.spent * 100,
      },
    },
  });
});

// Get overall analytics
app.get('/api/analytics/overview', (_req, res) => {
  const total = campaigns.reduce((sum, c) => ({
    sent: sum.sent + c.stats.sent,
    delivered: sum.delivered + c.stats.delivered,
    read: sum.read + c.stats.read,
    clicks: sum.clicks + c.stats.clicks,
    orders: sum.orders + c.stats.orders,
    revenue: sum.revenue + c.stats.revenue,
  }), { sent: 0, delivered: 0, read: 0, clicks: 0, orders: 0, revenue: 0 });

  res.json({
    success: true,
    data: {
      summary: {
        totalSent: total.sent,
        totalDelivered: total.delivered,
        totalRead: total.read,
        totalClicks: total.clicks,
        totalOrders: total.orders,
        totalRevenue: total.revenue,
      },
      rates: {
        deliveryRate: total.sent > 0 ? (total.delivered / total.sent) * 100 : 0,
        readRate: total.delivered > 0 ? (total.read / total.delivered) * 100 : 0,
        clickRate: total.read > 0 ? (total.clicks / total.read) * 100 : 0,
        conversionRate: total.clicks > 0 ? (total.orders / total.clicks) * 100 : 0,
      },
    },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║         WHATSAPP COMMERCE ADS v1.0.0              ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Campaigns: ${campaigns.length}                                           ║
║  Active:   ${campaigns.filter(c => c.status === 'active').length}                                             ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                              ║
║  ✓ WhatsApp Campaigns    ✓ Click-to-WhatsApp               ║
║  ✓ Order Tracking      ✓ Loyalty Integration               ║
║  ✓ Message Templates    ✓ Analytics                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
