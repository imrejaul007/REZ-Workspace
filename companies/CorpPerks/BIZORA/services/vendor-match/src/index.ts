/**
 * BIZORA VendorMatch Service
 * AI-Powered Vendor Recommendation Engine
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

interface Vendor {
  id: string;
  name: string;
  agencyName: string;
  description: string;
  categories: string[];
  subcategories: string[];
  location: { country: string; city: string; state?: string };
  rating: number;
  reviewCount: number;
  completedOrders: number;
  responseTime: number;
  completionRate: number;
  verified: boolean;
  priceRange: { min: number; max: number };
  specializations: string[];
  badges: string[];
  portfolio: { title: string; image?: string }[];
}

interface MatchParams {
  category: string;
  subcategory?: string;
  location?: string;
  budget?: { min: number; max: number };
  requirements?: string[];
  preferredRating?: number;
  requirementsText?: string;
}

interface VendorScore {
  vendorId: string;
  vendor: Vendor;
  overallScore: number;
  breakdown: {
    relevance: number;
    rating: number;
    experience: number;
    responseTime: number;
    completion: number;
    priceFit: number;
    location: number;
    specialization: number;
  };
  reasons: string[];
  warnings?: string[];
  matchedRequirements: string[];
  recommendedFor: string[];
}

interface Requirement {
  keyword: string;
  weight: number;
  category: string;
}

interface SearchQuery {
  original: string;
  tokens: string[];
  intent: string;
  category?: string;
  location?: string;
  budget?: string;
}

// ============================================================================
// Sample Vendor Data
// ============================================================================

const vendors = new Map<string, Vendor>();

function initializeVendors() {
  const sampleVendors: Vendor[] = [
    {
      id: 'vendor-001',
      name: 'Rahul Mehta',
      agencyName: 'DigitalBuzz Agency',
      description: 'Full-service digital marketing agency specializing in restaurant and retail businesses. Expert in social media management, targeted advertising, and brand positioning for food & beverage industry.',
      categories: ['marketing'],
      subcategories: ['social-media', 'advertising', 'content', 'seo'],
      location: { country: 'India', city: 'Mumbai', state: 'Maharashtra' },
      rating: 4.8,
      reviewCount: 127,
      completedOrders: 234,
      responseTime: 30,
      completionRate: 0.98,
      verified: true,
      priceRange: { min: 5000, max: 100000 },
      specializations: ['restaurant', 'retail', 'food', 'beverage', 'qsr'],
      badges: ['Top Rated', 'Fast Response', 'Restaurant Expert'],
      portfolio: [
        { title: 'The Burger Joint - Social Media Rebrand', image: 'https://example.com/1.jpg' },
        { title: 'Cafe Milano - Instagram Growth', image: 'https://example.com/2.jpg' },
      ],
    },
    {
      id: 'vendor-002',
      name: 'Priya Sharma',
      agencyName: 'TechServe Solutions',
      description: 'Technology solutions provider offering website development, POS systems, and custom software. Specializing in restaurant and retail automation.',
      categories: ['technology'],
      subcategories: ['website', 'pos', 'crm', 'erp', 'mobile-app'],
      location: { country: 'India', city: 'Bangalore', state: 'Karnataka' },
      rating: 4.6,
      reviewCount: 89,
      completedOrders: 156,
      responseTime: 60,
      completionRate: 0.95,
      verified: true,
      priceRange: { min: 15000, max: 500000 },
      specializations: ['restaurant', 'retail', 'pos', 'online-ordering'],
      badges: ['Verified', 'Tech Expert'],
      portfolio: [
        { title: 'QuickBites - POS Implementation', image: 'https://example.com/3.jpg' },
      ],
    },
    {
      id: 'vendor-003',
      name: 'Amit Patel',
      agencyName: 'CorpAssist CA',
      description: 'Chartered accountant firm offering comprehensive business compliance services including GST registration, tax filing, company registration, and financial consulting.',
      categories: ['business_setup', 'compliance'],
      subcategories: ['company-registration', 'gst', 'tax-filing', 'roc', 'bookkeeping'],
      location: { country: 'India', city: 'Delhi', state: 'Delhi' },
      rating: 4.9,
      reviewCount: 245,
      completedOrders: 567,
      responseTime: 15,
      completionRate: 0.99,
      verified: true,
      priceRange: { min: 2000, max: 50000 },
      specializations: ['gst', 'company-registration', 'pvt-ltd', 'llp', 'startup'],
      badges: ['Top Rated', 'Fast Response', 'CA Verified', 'Expert'],
      portfolio: [],
    },
    {
      id: 'vendor-004',
      name: 'Neha Singh',
      agencyName: 'BrandCraft Studios',
      description: 'Creative branding agency with expertise in logo design, brand identity, and visual communication. Creating memorable brand experiences.',
      categories: ['marketing', 'creative'],
      subcategories: ['branding', 'logo-design', 'graphic-design', 'packaging'],
      location: { country: 'India', city: 'Mumbai', state: 'Maharashtra' },
      rating: 4.7,
      reviewCount: 78,
      completedOrders: 123,
      responseTime: 45,
      completionRate: 0.96,
      verified: true,
      priceRange: { min: 8000, max: 200000 },
      specializations: ['branding', 'logo', 'restaurant', 'café', 'luxury'],
      badges: ['Creative Expert', 'Design Award'],
      portfolio: [
        { title: 'Spice Garden - Brand Identity', image: 'https://example.com/4.jpg' },
        { title: 'Urban Café - Logo & Menu Design', image: 'https://example.com/5.jpg' },
      ],
    },
    {
      id: 'vendor-005',
      name: 'Vikram Reddy',
      agencyName: 'GrowthLabs Digital',
      description: 'Performance marketing agency focused on ROI-driven campaigns. Expert in Google Ads, Meta Ads, and conversion optimization.',
      categories: ['marketing'],
      subcategories: ['google-ads', 'meta-ads', 'performance-marketing', 'analytics'],
      location: { country: 'India', city: 'Hyderabad', state: 'Telangana' },
      rating: 4.5,
      reviewCount: 56,
      completedOrders: 98,
      responseTime: 90,
      completionRate: 0.93,
      verified: true,
      priceRange: { min: 10000, max: 150000 },
      specializations: ['performance-marketing', 'ecommerce', 'leads', 'app-installs'],
      badges: ['ROI Expert'],
      portfolio: [],
    },
    {
      id: 'vendor-006',
      name: 'Sneha Kapoor',
      agencyName: 'LegalEase Consultants',
      description: 'Legal advisory firm specializing in business law, contracts, trademark registration, and regulatory compliance.',
      categories: ['legal'],
      subcategories: ['contracts', 'trademark', 'ip', 'compliance', 'dispute-resolution'],
      location: { country: 'India', city: 'Mumbai', state: 'Maharashtra' },
      rating: 4.8,
      reviewCount: 45,
      completedOrders: 78,
      responseTime: 120,
      completionRate: 0.97,
      verified: true,
      priceRange: { min: 5000, max: 100000 },
      specializations: ['trademark', 'contracts', 'food-law', 'franchise'],
      badges: ['Legal Expert', 'Verified Advocate'],
      portfolio: [],
    },
    {
      id: 'vendor-007',
      name: 'Arjun Nair',
      agencyName: 'RestaurantSetup Pro',
      description: 'Complete restaurant setup consultancy. From interior design to kitchen equipment, menu planning to staff training.',
      categories: ['operations'],
      subcategories: ['interior-design', 'kitchen-equipment', 'menu-planning', 'staff-training', 'consultancy'],
      location: { country: 'India', city: 'Bangalore', state: 'Karnataka' },
      rating: 4.4,
      reviewCount: 34,
      completedOrders: 56,
      responseTime: 180,
      completionRate: 0.91,
      verified: true,
      priceRange: { min: 50000, max: 2000000 },
      specializations: ['restaurant', 'cafe', 'cloud-kitchen', 'bar', 'fine-dining'],
      badges: ['Restaurant Expert', 'Setup Specialist'],
      portfolio: [],
    },
    {
      id: 'vendor-008',
      name: 'Kavita Joshi',
      agencyName: 'ContentCraft Studio',
      description: 'Content creation agency specializing in food photography, videography, and social media content for restaurants and food brands.',
      categories: ['creative', 'marketing'],
      subcategories: ['photography', 'videography', 'content-creation', 'food-styling'],
      location: { country: 'India', city: 'Pune', state: 'Maharashtra' },
      rating: 4.6,
      reviewCount: 67,
      completedOrders: 112,
      responseTime: 60,
      completionRate: 0.94,
      verified: true,
      priceRange: { min: 10000, max: 150000 },
      specializations: ['food-photography', 'restaurant', 'social-media', 'video'],
      badges: ['Creative Expert', 'Food Specialist'],
      portfolio: [
        { title: 'FineDine - Food Photography', image: 'https://example.com/6.jpg' },
      ],
    },
  ];

  sampleVendors.forEach(v => vendors.set(v.id, v));
}

initializeVendors();

// ============================================================================
// Requirement Keywords
// ============================================================================

const REQUIREMENT_KEYWORDS: Record<string, Requirement[]> = {
  'marketing': [
    { keyword: 'social media', weight: 0.9, category: 'social-media' },
    { keyword: 'instagram', weight: 0.8, category: 'social-media' },
    { keyword: 'facebook', weight: 0.8, category: 'social-media' },
    { keyword: 'ads', weight: 0.85, category: 'advertising' },
    { keyword: 'google ads', weight: 0.9, category: 'google-ads' },
    { keyword: 'meta ads', weight: 0.9, category: 'meta-ads' },
    { keyword: 'branding', weight: 0.9, category: 'branding' },
    { keyword: 'logo', weight: 0.85, category: 'logo-design' },
    { keyword: 'seo', weight: 0.8, category: 'seo' },
    { keyword: 'content', weight: 0.7, category: 'content-creation' },
    { keyword: 'video', weight: 0.7, category: 'videography' },
    { keyword: 'photo', weight: 0.7, category: 'photography' },
  ],
  'technology': [
    { keyword: 'website', weight: 0.9, category: 'website' },
    { keyword: 'app', weight: 0.9, category: 'mobile-app' },
    { keyword: 'pos', weight: 0.95, category: 'pos' },
    { keyword: 'crm', weight: 0.85, category: 'crm' },
    { keyword: 'erp', weight: 0.8, category: 'erp' },
    { keyword: 'online ordering', weight: 0.9, category: 'pos' },
    { keyword: 'kitchen display', weight: 0.9, category: 'pos' },
    { keyword: 'qr menu', weight: 0.85, category: 'pos' },
  ],
  'business_setup': [
    { keyword: 'company', weight: 0.9, category: 'company-registration' },
    { keyword: 'pvt ltd', weight: 0.95, category: 'company-registration' },
    { keyword: 'llp', weight: 0.9, category: 'company-registration' },
    { keyword: 'register', weight: 0.85, category: 'company-registration' },
    { keyword: 'incorporation', weight: 0.9, category: 'company-registration' },
  ],
  'compliance': [
    { keyword: 'gst', weight: 0.95, category: 'gst' },
    { keyword: 'tax', weight: 0.85, category: 'tax-filing' },
    { keyword: 'tds', weight: 0.9, category: 'tax-filing' },
    { keyword: 'filing', weight: 0.8, category: 'gst' },
    { keyword: 'roc', weight: 0.8, category: 'roc' },
    { keyword: 'audit', weight: 0.7, category: 'audit' },
  ],
  'legal': [
    { keyword: 'contract', weight: 0.9, category: 'contracts' },
    { keyword: 'trademark', weight: 0.95, category: 'trademark' },
    { keyword: 'agreement', weight: 0.85, category: 'contracts' },
    { keyword: 'legal', weight: 0.8, category: 'contracts' },
  ],
  'operations': [
    { keyword: 'interior', weight: 0.9, category: 'interior-design' },
    { keyword: 'kitchen', weight: 0.85, category: 'kitchen-equipment' },
    { keyword: 'equipment', weight: 0.8, category: 'kitchen-equipment' },
    { keyword: 'staff', weight: 0.8, category: 'staff-training' },
    { keyword: 'training', weight: 0.75, category: 'staff-training' },
    { keyword: 'menu', weight: 0.7, category: 'menu-planning' },
  ],
};

// ============================================================================
// Scoring Weights
// ============================================================================

const SCORING_WEIGHTS = {
  relevance: 0.20,
  rating: 0.15,
  experience: 0.10,
  responseTime: 0.10,
  completion: 0.15,
  priceFit: 0.15,
  location: 0.05,
  specialization: 0.10,
};

// ============================================================================
// AI Functions
// ============================================================================

function parseSearchQuery(query: string): SearchQuery {
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  // Detect category
  let category: string | undefined;
  const categoryMap: Record<string, string> = {
    'marketing': 'marketing',
    'social': 'marketing',
    'ads': 'marketing',
    'branding': 'marketing',
    'technology': 'technology',
    'website': 'technology',
    'app': 'technology',
    'pos': 'technology',
    'business': 'business_setup',
    'company': 'business_setup',
    'register': 'business_setup',
    'compliance': 'compliance',
    'gst': 'compliance',
    'tax': 'compliance',
    'legal': 'legal',
    'contract': 'legal',
    'operations': 'operations',
    'interior': 'operations',
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (tokens.some(t => t.includes(key))) {
      category = value;
      break;
    }
  }

  // Detect location
  const locationKeywords = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'pune', 'chennai', 'kolkata'];
  const location = tokens.find(t => locationKeywords.includes(t));

  // Detect budget
  const budgetKeywords = ['budget', 'under', 'within', 'below', 'less'];
  const hasBudget = budgetKeywords.some(k => tokens.includes(k));

  return {
    original: query,
    tokens,
    intent: category || 'general',
    category,
    location,
    budget: hasBudget ? 'budget' : undefined,
  };
}

function extractRequirements(text: string): string[] {
  if (!text) return [];

  const requirements: string[] = [];
  const lower = text.toLowerCase();

  // Common requirement patterns
  const patterns = [
    /need\s+(?:a\s+|an\s+)?([^.!?]+)/gi,
    /looking\s+for\s+([^.!?]+)/gi,
    /want\s+([^.!?]+)/gi,
    /require[s]?\s+([^.!?]+)/gi,
    /help\s+with\s+([^.!?]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const req = match[1].trim();
      if (req.length > 3 && req.length < 100) {
        requirements.push(req);
      }
    }
  }

  // Deduplicate
  return [...new Set(requirements)];
}

function scoreVendor(vendor: Vendor, params: MatchParams): VendorScore {
  const breakdown = {
    relevance: 0,
    rating: 0,
    experience: 0,
    responseTime: 0,
    completion: 0,
    priceFit: 0,
    location: 0,
    specialization: 0,
  };

  const reasons: string[] = [];
  const warnings: string[] = [];

  // Category Relevance
  const categoryMatch = vendor.categories.includes(params.category) ? 1 : 0;
  breakdown.relevance = categoryMatch * 100;
  if (categoryMatch) reasons.push(`Specializes in ${params.category}`);

  // Subcategory match
  if (params.subcategory) {
    const subMatch = vendor.subcategories.includes(params.subcategory);
    breakdown.relevance += subMatch ? 25 : 0;
    if (subMatch) reasons.push(`Expert in ${params.subcategory}`);
  }

  // Rating
  breakdown.rating = (vendor.rating / 5) * 100;
  if (vendor.rating >= 4.5) reasons.push(`Highly rated (${vendor.rating}/5)`);

  // Experience
  const experienceScore = Math.min(vendor.completedOrders / 200, 1) * 100;
  breakdown.experience = experienceScore;
  if (vendor.completedOrders > 100) reasons.push(`${vendor.completedOrders}+ completed projects`);

  // Response Time
  if (vendor.responseTime < 30) {
    breakdown.responseTime = 100;
    reasons.push('Lightning fast response');
  } else if (vendor.responseTime < 60) {
    breakdown.responseTime = 80;
  } else if (vendor.responseTime < 120) {
    breakdown.responseTime = 60;
  } else {
    breakdown.responseTime = 40;
    warnings.push('Slower response time');
  }

  // Completion Rate
  breakdown.completion = vendor.completionRate * 100;
  if (vendor.completionRate < 0.9) {
    warnings.push('Some projects not completed on time');
  }

  // Price Fit
  if (params.budget) {
    if (params.budget.min <= vendor.priceRange.min && params.budget.max >= vendor.priceRange.min) {
      breakdown.priceFit = 100;
      reasons.push('Within your budget range');
    } else if (params.budget.max >= vendor.priceRange.min) {
      breakdown.priceFit = 70;
      reasons.push('Slightly above budget');
    } else {
      breakdown.priceFit = 30;
      warnings.push('Above your budget range');
    }
  } else {
    breakdown.priceFit = 75;
  }

  // Location
  if (params.location) {
    const loc = params.location.toLowerCase();
    if (vendor.location.city.toLowerCase() === loc) {
      breakdown.location = 100;
      reasons.push(`Based in ${vendor.location.city}`);
    } else if (vendor.location.state?.toLowerCase() === loc) {
      breakdown.location = 80;
      reasons.push(`Operates in ${vendor.location.state}`);
    } else {
      breakdown.location = 50;
    }
  } else {
    breakdown.location = 70;
  }

  // Specialization match
  const matchedSpecializations = params.requirements?.filter(r =>
    vendor.specializations.some(s => s.toLowerCase().includes(r.toLowerCase()))
  ) || [];
  breakdown.specialization = matchedSpecializations.length > 0 ? 80 + (matchedSpecializations.length * 5) : 50;

  // Calculate overall score
  const overallScore = Object.entries(breakdown)
    .reduce((sum, [key, score]) => sum + score * SCORING_WEIGHTS[key as keyof typeof SCORING_WEIGHTS], 0);

  return {
    vendorId: vendor.id,
    vendor,
    overallScore: Math.round(overallScore * 10) / 10,
    breakdown,
    reasons,
    warnings: warnings.length > 0 ? warnings : undefined,
    matchedRequirements: matchedSpecializations,
    recommendedFor: matchedSpecializations.length > 0 ? matchedSpecializations : vendor.specializations.slice(0, 3),
  };
}

function generateRecommendations(scores: VendorScore[], params: MatchParams): {
  primary: VendorScore;
  alternatives: VendorScore[];
  insights: string[];
} {
  // Sort by score
  scores.sort((a, b) => b.overallScore - a.overallScore);

  const insights: string[] = [];

  // Generate insights
  const topVendor = scores[0];
  if (topVendor) {
    insights.push(`Based on your requirements, ${topVendor.vendor.agencyName} is the top match with ${topVendor.overallScore}% compatibility.`);
    insights.push(`${topVendor.vendor.completedOrders} projects completed with ${topVendor.vendor.rating}/5 rating.`);

    if (topVendor.vendor.badges.includes('Fast Response')) {
      insights.push('Top vendor typically responds within 30 minutes.');
    }

    if (topVendor.reasons.length > 0) {
      insights.push(`Why: ${topVendor.reasons.slice(0, 2).join('. ')}`);
    }
  }

  // Price comparison
  const avgPrice = scores.reduce((sum, s) => sum + s.vendor.priceRange.min, 0) / scores.length;
  insights.push(`Average starting price for this service: ₹${Math.round(avgPrice).toLocaleString()}`);

  // Tips
  insights.push('Tip: Check vendor portfolio and reviews before finalizing.');
  insights.push('Tip: Discuss your specific requirements in the first call.');

  return {
    primary: scores[0],
    alternatives: scores.slice(1, 4),
    insights,
  };
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'vendor-match', timestamp: new Date().toISOString() });
});

// Main matching endpoint
app.post('/api/match', (req: Request, res: Response) => {
  try {
    const params: MatchParams = req.body;

    if (!params.category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Get all vendors
    let candidateVendors = Array.from(vendors.values())
      .filter(v => v.categories.includes(params.category));

    // Filter by verified if requested
    candidateVendors = candidateVendors.filter(v => v.verified);

    // Score each vendor
    const scores = candidateVendors.map(v => scoreVendor(v, params));

    // Generate recommendations
    const recommendations = generateRecommendations(scores, params);

    res.json({
      success: true,
      request: params,
      totalMatches: scores.length,
      ...recommendations,
    });
  } catch (error) {
    logger.error('Match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search endpoint
app.post('/api/search', (req: Request, res: Response) => {
  try {
    const { query, requirements, location, budget } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Parse the query
    const parsedQuery = parseSearchQuery(query);
    const extractedRequirements = extractRequirements(requirements || query);

    const matchParams: MatchParams = {
      category: parsedQuery.category || 'marketing',
      subcategory: parsedQuery.tokens.find(t =>
        ['social-media', 'advertising', 'website', 'pos', 'gst', 'branding'].includes(t)
      ),
      location: location || parsedQuery.location,
      budget,
      requirements: extractedRequirements,
      requirementsText: requirements,
    };

    // Get matching vendors
    let candidateVendors = Array.from(vendors.values())
      .filter(v => v.verified);

    if (matchParams.category) {
      candidateVendors = candidateVendors.filter(v => v.categories.includes(matchParams.category!));
    }

    // Score and sort
    const scores = candidateVendors.map(v => scoreVendor(v, matchParams));
    scores.sort((a, b) => b.overallScore - a.overallScore);

    res.json({
      success: true,
      query: parsedQuery,
      extractedRequirements,
      totalMatches: scores.length,
      topMatches: scores.slice(0, 5),
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vendor details
app.get('/api/vendors/:id', (req: Request, res: Response) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  res.json(vendor);
});

// Get all vendors
app.get('/api/vendors', (req: Request, res: Response) => {
  const { category, location, minRating, verified } = req.query;

  let result = Array.from(vendors.values());

  if (category) {
    result = result.filter(v => v.categories.includes(category as string));
  }
  if (location) {
    result = result.filter(v =>
      v.location.city.toLowerCase() === (location as string).toLowerCase()
    );
  }
  if (minRating) {
    result = result.filter(v => v.rating >= Number(minRating));
  }
  if (verified === 'true') {
    result = result.filter(v => v.verified);
  }

  result.sort((a, b) => b.rating - a.rating);

  res.json({ vendors: result, total: result.length });
});

// Get categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = [
    { id: 'marketing', name: 'Marketing', icon: '📢', popular: true },
    { id: 'technology', name: 'Technology', icon: '💻', popular: true },
    { id: 'business_setup', name: 'Business Setup', icon: '📋', popular: true },
    { id: 'compliance', name: 'Tax & Compliance', icon: '📜', popular: true },
    { id: 'legal', name: 'Legal Services', icon: '⚖️', popular: false },
    { id: 'operations', name: 'Operations', icon: '🔧', popular: false },
    { id: 'creative', name: 'Creative Services', icon: '🎨', popular: false },
    { id: 'finance', name: 'Finance & Accounting', icon: '💰', popular: false },
  ];

  res.json({ categories });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4020;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 BIZORA VendorMatch Service                         ║
║   AI-Powered Vendor Recommendations                     ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Vendors: ${vendors.size}                                            ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/match - AI Vendor Matching               ║
║   • POST /api/search - Smart Search                   ║
║   • GET /api/vendors - List Vendors                  ║
║   • GET /api/categories - Service Categories         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
