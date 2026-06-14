/**
 * REZ Atlas v2 - Company Twin Service
 * Company Intelligence Engine
 *
 * Provides deep company intelligence:
 * - Revenue estimation
 * - Employee count
 * - Funding information
 * - Technology stack
 * - Growth signals
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5156;

// Company Twin Interface
interface CompanyTwin {
  id: string;
  name: string;
  domain: string;
  industry: string;
  category: string;
  size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  employeeCount: number;
  revenueEstimate: number;
  revenueRange: string;
  founded: number;
  funding: {
    stage: string;
    amount: number;
    date: string;
    investors: string[];
  } | null;
  techStack: string[];
  locations: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
    isHQ: boolean;
  }[];
  socialProfiles: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
  };
  gstin: string | null;
  pan: string | null;
  buyingSignals: string[];
  painPoints: string[];
  competitors: string[];
  lastIntentSignal: {
    type: string;
    description: string;
    timestamp: string;
    confidence: number;
  } | null;
  sources: {
    name: string;
    url: string;
    lastFetched: string;
  }[];
  enrichedAt: string;
  score: number;
  tags: string[];
}

// In-memory storage
const companyTwins: Map<string, CompanyTwin> = new Map();

// Seed sample companies
const sampleCompanies: CompanyTwin[] = [
  {
    id: uuidv4(),
    name: 'Truffles Restaurant',
    domain: 'truffles.in',
    industry: 'food-beverage',
    category: 'restaurant',
    size: 'smb',
    employeeCount: 45,
    revenueEstimate: 5000000,
    revenueRange: '₹3-7 Cr',
    founded: 2015,
    funding: null,
    techStack: ['Zomato POS', 'Swiggy', 'Zomato'],
    locations: [{
      address: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      lat: 12.9352,
      lng: 77.6246,
      isHQ: true
    }],
    socialProfiles: {
      linkedin: 'truffles-restaurant',
      twitter: 'trufflesblr',
      facebook: 'trufflesblr',
      instagram: 'truffles_blr'
    },
    gstin: '29AAACT1234C1Z5',
    pan: 'AAACT1234C',
    buyingSignals: ['expansion', 'hiring'],
    painPoints: ['slow-delivery', 'review-management'],
    competitors: ['Third Wave Coffee', 'Starbucks', 'Blue Tokai'],
    lastIntentSignal: {
      type: 'hiring',
      description: 'Hired 5 new staff members in last30 days',
      timestamp: new Date().toISOString(),
      confidence: 0.85
    },
    sources: [{ name: 'LinkedIn', url: 'linkedin.com', lastFetched: new Date().toISOString() }],
    enrichedAt: new Date().toISOString(),
    score: 78,
    tags: ['coffee', 'cafe', 'bangalore', 'popular']
  },
  {
    id: uuidv4(),
    name: 'Urbanivan Salon',
    domain: 'urbanivan.com',
    industry: 'beauty-wellness',
    category: 'salon',
    size: 'smb',
    employeeCount: 12,
    revenueEstimate: 1800000,
    revenueRange: '₹1-3 Cr',
    founded: 2018,
    funding: null,
    techStack: ['Minda Salon Software'],
    locations: [{
      address: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      lat: 12.9784,
      lng: 77.6408,
      isHQ: true
    }],
    socialProfiles: {
      linkedin: '',
      twitter: 'urbanivan',
      facebook: 'urbanivan',
      instagram: 'urbanivan_salon'
    },
    gstin: '29AAAUU1234C1Z5',
    pan: 'AAAUU1234C',
    buyingSignals: ['no-loyalty', 'review-spike'],
    painPoints: ['no-loyalty-program', 'poor-reviews'],
    competitors: ['Lakme Salon', 'VLCC'],
    lastIntentSignal: {
      type: 'review-spike',
      description: '30 new reviews in last 7 days, avg3.2 stars',
      timestamp: new Date().toISOString(),
      confidence: 0.72
    },
    sources: [{ name: 'Google', url: 'google.com', lastFetched: new Date().toISOString() }],
    enrichedAt: new Date().toISOString(),
    score: 65,
    tags: ['salon', 'beauty', 'bangalore']
  },
  {
    id: uuidv4(),
    name: 'FreshMart Grocery',
    domain: 'freshmart.in',
    industry: 'retail',
    category: 'grocery',
    size: 'mid-market',
    employeeCount: 150,
    revenueEstimate: 25000000,
    revenueRange: '₹15-30 Cr',
    founded: 2012,
    funding: {
      stage: 'Series B',
      amount: 50000000,
      date: '2024-03-15',
      investors: ['Sequoia', 'Matrix']
    },
    techStack: ['SAP', 'Own POS', 'BigBasket API'],
    locations: [
      { address: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946, isHQ: true },
      { address: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066', lat: 12.9698, lng: 77.7499, isHQ: false }
    ],
    socialProfiles: {
      linkedin: 'freshmart-india',
      twitter: 'freshmart',
      facebook: 'freshmart',
      instagram: 'freshmart_in'
    },
    gstin: '29AAAFT1234C1Z5',
    pan: 'AAAFT1234C',
    buyingSignals: ['expansion', 'technology', 'funding'],
    painPoints: ['inventory-management', 'multi-location'],
    competitors: ['BigBasket', 'Star Bazaar', 'Reliance Fresh'],
    lastIntentSignal: {
      type: 'funding',
      description: 'Raised ₹50 Cr Series B from Sequoia',
      timestamp: new Date().toISOString(),
      confidence: 0.95
    },
    sources: [
      { name: 'LinkedIn', url: 'linkedin.com', lastFetched: new Date().toISOString() },
      { name: 'Crunchbase', url: 'crunchbase.com', lastFetched: new Date().toISOString() }
    ],
    enrichedAt: new Date().toISOString(),
    score: 92,
    tags: ['grocery', 'retail', 'bangalore', 'funded']
  }
];

sampleCompanies.forEach(c => companyTwins.set(c.id, c));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atlas-company-twin',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all company twins
app.get('/api/companies', (req, res) => {
  const { industry, category, size, minScore, limit = 50 } = req.query;
  let filtered = Array.from(companyTwins.values());

  if (industry) filtered = filtered.filter(c => c.industry === industry);
  if (category) filtered = filtered.filter(c => c.category === category);
  if (size) filtered = filtered.filter(c => c.size === size);
  if (minScore) filtered = filtered.filter(c => c.score >= Number(minScore));

  filtered.sort((a, b) => b.score - a.score);

  res.json({
    companies: filtered.slice(0, Number(limit)),
    count: filtered.length,
    total: companyTwins.size
  });
});

// Get company by ID
app.get('/api/companies/:id', (req, res) => {
  const company = companyTwins.get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  res.json(company);
});

// Search companies
app.post('/api/companies/search', (req, res) => {
  const { query, industry, category, location, minRevenue, maxRevenue } = req.body;

  let results = Array.from(companyTwins.values());

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (industry) results = results.filter(c => c.industry === industry);
  if (category) results = results.filter(c => c.category === category);
  if (location) {
    const loc = location.toLowerCase();
    results = results.filter(c =>
      c.locations.some(l => l.city.toLowerCase().includes(loc))
    );
  }
  if (minRevenue) results = results.filter(c => c.revenueEstimate >= minRevenue);
  if (maxRevenue) results = results.filter(c => c.revenueEstimate <= maxRevenue);

  results.sort((a, b) => b.score - a.score);

  res.json({
    companies: results,
    count: results.length
  });
});

// Create company twin
app.post('/api/companies', (req, res) => {
  const { name, domain, industry, category, location } = req.body;

  if (!name || !domain) {
    return res.status(400).json({ error: 'Name and domain are required' });
  }

  const company: CompanyTwin = {
    id: uuidv4(),
    name,
    domain,
    industry: industry || 'unknown',
    category: category || 'general',
    size: 'smb',
    employeeCount: 0,
    revenueEstimate: 0,
    revenueRange: 'Unknown',
    founded: new Date().getFullYear(),
    funding: null,
    techStack: [],
    locations: location ? [{
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      pincode: location.pincode || '',
      lat: location.lat || 0,
      lng: location.lng || 0,
      isHQ: true
    }] : [],
    socialProfiles: { linkedin: '', twitter: '', facebook: '', instagram: '' },
    gstin: null,
    pan: null,
    buyingSignals: [],
    painPoints: [],
    competitors: [],
    lastIntentSignal: null,
    sources: [],
    enrichedAt: new Date().toISOString(),
    score: 50,
    tags: []
  };

  companyTwins.set(company.id, company);

  res.status(201).json(company);
});

// Enrich company
app.post('/api/companies/:id/enrich', async (req, res) => {
  const company = companyTwins.get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  // Simulate enrichment process
  const enrichmentResult = {
    employeeCount: Math.floor(Math.random() * 500) + 10,
    revenueEstimate: Math.floor(Math.random() * 50000000) + 500000,
    techStack: ['POS System', 'Zomato', 'Swiggy', 'Google Analytics'],
    socialProfiles: {
      linkedin: `https://linkedin.com/company/${company.name.replace(/\s+/g, '-')}`,
      twitter: company.name.toLowerCase().replace(/\s+/g, ''),
      facebook: company.name.toLowerCase().replace(/\s+/g, ''),
      instagram: company.name.toLowerCase().replace(/\s+/g, '_')
    },
    buyingSignals: ['review-growth', 'expansion'],
    painPoints: ['customer-retention', 'online-presence']
  };

  // Update company with enrichment
  Object.assign(company, enrichmentResult);
  company.enrichedAt = new Date().toISOString();
  company.score = Math.min(100, company.score + 15);

  companyTwins.set(company.id, company);

  res.json({
    company,
    enrichment: enrichmentResult,
    enrichedAt: company.enrichedAt
  });
});

// Update company
app.put('/api/companies/:id', (req, res) => {
  const company = companyTwins.get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const updates = req.body;
  const updated = { ...company, ...updates, id: company.id };
  companyTwins.set(updated.id, updated);

  res.json(updated);
});

// Add intent signal
app.post('/api/companies/:id/signals', (req, res) => {
  const company = companyTwins.get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const { type, description, confidence } = req.body;

  company.lastIntentSignal = {
    type,
    description,
    timestamp: new Date().toISOString(),
    confidence: confidence || 0.7
  };

  // Update score based on signal
  if (type === 'funding' || type === 'expansion') {
    company.score = Math.min(100, company.score + 10);
    company.buyingSignals.push(type);
  }

  companyTwins.set(company.id, company);

  res.json({
    signal: company.lastIntentSignal,
    newScore: company.score
  });
});

// Get companies by intent signal
app.get('/api/companies/intent/:signalType', (req, res) => {
  const { signalType } = req.params;

  const companies = Array.from(companyTwins.values()).filter(c =>
    c.lastIntentSignal?.type === signalType ||
    c.buyingSignals.includes(signalType)
  );

  res.json({
    signalType,
    companies,
    count: companies.length
  });
});

// Company analytics
app.get('/api/analytics/overview', (req, res) => {
  const companies = Array.from(companyTwins.values());

  const overview = {
    totalCompanies: companies.length,
    bySize: {
      startup: companies.filter(c => c.size === 'startup').length,
      smb: companies.filter(c => c.size === 'smb').length,
      'mid-market': companies.filter(c => c.size === 'mid-market').length,
      enterprise: companies.filter(c => c.size === 'enterprise').length
    },
    byIndustry: companies.reduce((acc, c) => {
      acc[c.industry] = (acc[c.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: companies.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgScore: Math.round(companies.reduce((sum, c) => sum + c.score, 0) / companies.length),
    highIntent: companies.filter(c => c.lastIntentSignal !== null).length,
    totalRevenue: companies.reduce((sum, c) => sum + c.revenueEstimate, 0),
    signalTypes: companies.reduce((acc, c) => {
      if (c.lastIntentSignal) {
        acc[c.lastIntentSignal.type] = (acc[c.lastIntentSignal.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  };

  res.json(overview);
});

// Start server
app.listen(PORT, () => {
  console.log(`🏢 Atlas Company Twin running on port ${PORT}`);
  console.log(`   ${companyTwins.size} companies loaded`);
});

export default app;
