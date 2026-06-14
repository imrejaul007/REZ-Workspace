/**
 * BIZORA Partner Network
 * Partners sell BIZORA services + their own services
 * Reseller + Referral + White-label capabilities
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'reseller' | 'referral' | 'agency' | 'ca_partner' | 'technology_partner';
  status: 'active' | 'suspended' | 'pending';
  commission: number;
  revenue: {
    thisMonth: number;
    total: number;
    pending: number;
  };
  metrics: {
    clients: number;
    services: number;
    retention: number;
  };
  createdAt: Date;
}

interface Client {
  id: string;
  partnerId: string;
  businessName: string;
  email: string;
  phone: string;
  plan: string;
  mrr: number;
  status: 'active' | 'churned' | 'trial';
  services: string[];
  createdAt: Date;
}

// ============================================================================
// Sample Partners
// ============================================================================

const partners: Partner[] = [
  {
    id: 'p1',
    name: 'TechServe Solutions',
    email: 'partner@techserve.in',
    phone: '+91-9876543210',
    type: 'reseller',
    status: 'active',
    commission: 20,
    revenue: { thisMonth: 45000, total: 520000, pending: 12000 },
    metrics: { clients: 23, services: 45, retention: 92 },
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'p2',
    name: 'DigitalBuzz Agency',
    email: 'partner@digitalbuzz.in',
    phone: '+91-9876543211',
    type: 'agency',
    status: 'active',
    commission: 15,
    revenue: { thisMonth: 28000, total: 340000, pending: 8000 },
    metrics: { clients: 15, services: 32, retention: 88 },
    createdAt: new Date('2024-08-20'),
  },
  {
    id: 'p3',
    name: 'CorpAssist CA',
    email: 'partner@corpassist.in',
    phone: '+91-9876543212',
    type: 'ca_partner',
    status: 'active',
    commission: 25,
    revenue: { thisMonth: 85000, total: 980000, pending: 15000 },
    metrics: { clients: 45, services: 120, retention: 95 },
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'p4',
    name: 'CloudTech Partners',
    email: 'partner@cloudtech.in',
    phone: '+91-9876543213',
    type: 'technology_partner',
    status: 'active',
    commission: 30,
    revenue: { thisMonth: 120000, total: 1500000, pending: 25000 },
    metrics: { clients: 67, services: 156, retention: 94 },
    createdAt: new Date('2024-01-05'),
  },
];

const clients: Client[] = [
  {
    id: 'c1',
    partnerId: 'p1',
    businessName: 'The Burger Joint',
    email: 'owner@burgerjoint.in',
    phone: '+91-9876500001',
    plan: 'Business',
    mrr: 2999,
    status: 'active',
    services: ['RestaurantOS', 'TaxFlow', 'InvoiceFlow'],
    createdAt: new Date('2024-07-01'),
  },
  {
    id: 'c2',
    partnerId: 'p1',
    businessName: 'FitLife Salon',
    email: 'owner@fitlife.in',
    phone: '+91-9876500002',
    plan: 'Growth',
    mrr: 1999,
    status: 'active',
    services: ['SalonOS', 'WhatsApp'],
    createdAt: new Date('2024-09-15'),
  },
];

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'partner-network',
    partners: partners.length,
    clients: clients.length,
  });
});

// List partners
app.get('/api/partners', (_req, res) => {
  res.json({
    partners,
    summary: {
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'active').length,
      totalRevenue: partners.reduce((sum, p) => sum + p.revenue.total, 0),
    },
  });
});

// Partner dashboard
app.get('/api/partners/:id/dashboard', (req, res) => {
  const partner = partners.find(p => p.id === req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const partnerClients = clients.filter(c => c.partnerId === req.params.id);

  res.json({
    partner,
    clients: partnerClients,
    performance: {
      mrr: partnerClients.reduce((sum, c) => sum + c.mrr, 0),
      services: partnerClients.flatMap(c => c.services).length,
      topClients: partnerClients.slice(0, 5),
    },
    commission: {
      rate: partner.commission,
      thisMonth: partner.revenue.thisMonth * (partner.commission / 100),
      pending: partner.revenue.pending * (partner.commission / 100),
    },
  });
});

// Referral link generation
app.post('/api/partners/:id/refer', (req, res) => {
  const { clientName, email, phone, plan } = req.body;
  const partner = partners.find(p => p.id === req.params.id);

  const clientId = `c_${Date.now()}`;
  const referralLink = `bizora.com/ref/${req.params.id}/${clientId}`;

  res.status(201).json({
    clientId,
    referralLink,
    commission: partner?.commission || 20,
    message: 'Client referred successfully',
  });
});

// Partner signup
app.post('/api/partners/join', (req, res) => {
  const { name, email, phone, type } = req.body;

  const id = `partner_${Date.now()}`;
  res.status(201).json({
    partnerId: id,
    status: 'pending',
    commission: type === 'ca_partner' ? 25 : 20,
    message: 'Application submitted. We\'ll review within 24 hours.',
  });
});

// White-label setup
app.post('/api/partners/:id/whitelabel', (req, res) => {
  const { brandName, logo, colors, domain } = req.body;

  res.json({
    setup: 'whitelabel',
    brandName,
    subdomain: `${brandName.toLowerCase().replace(/\s+/g, '-')}.bizora.com`,
    estimated: '3-5 business days',
  });
});

// Analytics
app.get('/api/partners/:id/analytics', (req, res) => {
  const partner = partners.find(p => p.id === req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const partnerClients = clients.filter(c => c.partnerId === req.params.id);

  res.json({
    overview: {
      mrr: partnerClients.reduce((sum, c) => sum + c.mrr, 0),
      clients: partnerClients.length,
      retention: partner.metrics.retention,
      growth: 12.5,
    },
    chart: [
      { month: 'Jan', revenue: 25000 },
      { month: 'Feb', revenue: 32000 },
      { month: 'Mar', revenue: 38000 },
      { month: 'Apr', revenue: 42000 },
      { month: 'May', revenue: partner.revenue.thisMonth },
    ],
    topServices: ['RestaurantOS', 'TaxFlow', 'InvoiceFlow'],
    geography: [
      { city: 'Mumbai', clients: 45, revenue: 180000 },
      { city: 'Delhi', clients: 32, revenue: 120000 },
      { city: 'Bangalore', clients: 28, revenue: 95000 },
      { city: 'Hyderabad', clients: 15, revenue: 55000 },
    ],
  });
});

// Commission payout
app.get('/api/partners/:id/payouts', (req, res) => {
  res.json({
    pending: 15000,
    processing: [
      { id: 'pay_001', amount: 8500, status: 'processing' },
      { id: 'pay_002', amount: 6500, status: 'approved' },
    ],
    paid: [
      { id: 'pay_0001', amount: 12000, date: '2026-04-15' },
      { id: 'pay_0002', amount: 15000, date: '2026-03-15' },
    ],
    upcoming: 25000,
  });
});

const PORT = process.env.PORT || 4070;
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════╗
║  🤝 Partner Network Service      ║
║  Resellers + Referral + White-label ║
║  Port: ${PORT}                     ║
╚══════════════════════════════════╝
  `);
});
