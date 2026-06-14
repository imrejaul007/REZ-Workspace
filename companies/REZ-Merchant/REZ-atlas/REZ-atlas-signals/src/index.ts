/**
 * REZ Atlas Signals - AI Opportunity Detection
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5155;

// Web Intelligence URL - for competitor monitoring, news, reviews
const WEB_INTELLIGENCE_URL = process.env.WEB_INTELLIGENCE_URL || 'http://localhost:4595';

interface Opportunity {
  id: string;
  merchantId: string;
  type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestedProduct: string;
  potentialRevenue: number;
  status: 'open' | 'converted' | 'dismissed';
  createdAt: string;
  source?: 'internal' | 'web_intelligence';
}

interface Competitor {
  id: string;
  merchantId: string;
  competitorName: string;
  product: string;
  marketShare: number;
  lastSeen: string;
}

const opportunities: Map<string, Opportunity> = new Map();
const competitors: Map<string, Competitor[]> = new Map();

// Seed sample opportunities
const sampleOpps: Opportunity[] = [
  { id: uuidv4(), merchantId: 'm1', type: 'no_qr', title: 'No QR Ordering', description: 'Restaurant has no digital menu', severity: 'high', suggestedProduct: 'REZ Menu QR', potentialRevenue: 12000, status: 'open', createdAt: new Date().toISOString() },
  { id: uuidv4(), merchantId: 'm2', type: 'no_loyalty', title: 'No Loyalty Program', description: 'Retail store missing customer retention', severity: 'medium', suggestedProduct: 'REZ Loyalty', potentialRevenue: 8000, status: 'open', createdAt: new Date().toISOString() },
  { id: uuidv4(), merchantId: 'm3', type: 'poor_reviews', title: 'Poor Review Response', description: 'Hotel has 3.2 rating with 40% response rate', severity: 'high', suggestedProduct: 'REZ Review Response', potentialRevenue: 15000, status: 'open', createdAt: new Date().toISOString() }
];
sampleOpps.forEach(o => opportunities.set(o.id, o));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'REZ-atlas-signals', version: '1.0.0' });
});

app.get('/api/opportunities', (req, res) => {
  const { merchantId, type, severity, status, limit = 50 } = req.query;
  let filtered = Array.from(opportunities.values());
  if (merchantId) filtered = filtered.filter(o => o.merchantId === merchantId);
  if (type) filtered = filtered.filter(o => o.type === type);
  if (severity) filtered = filtered.filter(o => o.severity === severity);
  if (status) filtered = filtered.filter(o => o.status === status);
  res.json({ opportunities: filtered.slice(0, Number(limit)), count: filtered.length });
});

app.get('/api/opportunities/stats', (req, res) => {
  const all = Array.from(opportunities.values());
  res.json({
    total: all.length,
    byType: {
      no_qr: all.filter(o => o.type === 'no_qr').length,
      no_loyalty: all.filter(o => o.type === 'no_loyalty').length,
      poor_reviews: all.filter(o => o.type === 'poor_reviews').length
    },
    bySeverity: {
      high: all.filter(o => o.severity === 'high').length,
      medium: all.filter(o => o.severity === 'medium').length,
      low: all.filter(o => o.severity === 'low').length
    },
    totalPotentialRevenue: all.reduce((sum, o) => sum + o.potentialRevenue, 0)
  });
});

app.get('/api/competitors', (req, res) => {
  const { merchantId } = req.query;
  const allCompetitors = merchantId ? competitors.get(merchantId as string) || [] : [];
  res.json({ competitors: allCompetitors, count: allCompetitors.length });
});

app.get('/api/dashboard', (req, res) => {
  const all = Array.from(opportunities.values());
  res.json({
    totalOpportunities: all.length,
    highPriority: all.filter(o => o.severity === 'high').length,
    potentialRevenue: all.reduce((sum, o) => sum + o.potentialRevenue, 0),
    byCategory: ['no_qr', 'no_loyalty', 'poor_reviews'].map(type => ({
      type,
      count: all.filter(o => o.type === type).length,
      revenue: all.filter(o => o.type === type).reduce((sum, o) => sum + o.potentialRevenue, 0)
    }))
  });
});

// ==================== WEB INTELLIGENCE INTEGRATION ====================

/**
 * Generate signals from web intelligence
 * POST /api/signals/web-intelligence
 */
app.post('/api/signals/web-intelligence', async (req, res) => {
  try {
    const { merchantId, merchantUrl } = req.body;

    if (!merchantId || !merchantUrl) {
      return res.status(400).json({ error: 'merchantId and merchantUrl required' });
    }

    const signals: string[] = [];

    // 1. Check website existence
    try {
      const scrapeResponse = await axios.post(`${WEB_INTELLIGENCE_URL}/api/scrape/simple`, {
        url: merchantUrl
      });

      if (!scrapeResponse.data.success) {
        signals.push('NO_WEBSITE');
      }
    } catch {
      signals.push('NO_WEBSITE');
    }

    // 2. Check for news coverage (positive signal)
    try {
      const domain = new URL(merchantUrl).hostname.replace('www.', '');
      const newsResponse = await axios.get(`${WEB_INTELLIGENCE_URL}/api/news/search`, {
        params: { query: domain, maxResults: 5 }
      });

      if (newsResponse.data.data?.length > 0) {
        signals.push('HAS_NEWS_COVERAGE');
      }
    } catch {
      // News check failed - not critical
    }

    // 3. Check for social media presence
    try {
      const socialResponse = await axios.post(`${WEB_INTELLIGENCE_URL}/api/scrape/simple`, {
        url: merchantUrl,
        selectors: {
          links: 'a[href*="facebook"], a[href*="instagram"], a[href*="twitter"]'
        }
      });

      if (!socialResponse.data.data?.links?.length) {
        signals.push('NO_SOCIAL_MEDIA');
      }
    } catch {
      signals.push('NO_SOCIAL_MEDIA');
    }

    // 4. Check for review platforms (Zomato, Swiggy)
    try {
      const deliveryCheck = await axios.get(`${WEB_INTELLIGENCE_URL}/api/news/search`, {
        params: { query: `${merchantUrl} zomato swiggy`, maxResults: 3 }
      });

      const hasDelivery = deliveryCheck.data.data?.some((a: any) =>
        a.title.toLowerCase().includes('zomato') ||
        a.title.toLowerCase().includes('swiggy')
      );

      if (!hasDelivery) {
        signals.push('NO_FOOD_DELIVERY');
      }
    } catch {
      signals.push('NO_FOOD_DELIVERY');
    }

    res.json({
      merchantId,
      merchantUrl,
      signals,
      webIntelligenceActive: true
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get competitor intelligence
 * GET /api/competitors/web/:merchantId
 */
app.get('/api/competitors/web/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'url query param required' });
    }

    // Search for competitor news
    const response = await axios.get(`${WEB_INTELLIGENCE_URL}/api/news/search`, {
      params: { query: `nearby competitors ${url}`, maxResults: 10 }
    });

    const competitors = response.data.data?.map((article: any) => ({
      name: article.domain,
      url: article.url,
      title: article.title,
      date: article.seendate
    })) || [];

    res.json({
      merchantId,
      competitors,
      count: competitors.length
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enrich merchant with web data
 * POST /api/enrich
 */
app.post('/api/enrich', async (req, res) => {
  try {
    const { merchantId, merchantUrl } = req.body;

    if (!merchantId || !merchantUrl) {
      return res.status(400).json({ error: 'merchantId and merchantUrl required' });
    }

    // Get all web intelligence in parallel
    const [website, news, social] = await Promise.allSettled([
      axios.post(`${WEB_INTELLIGENCE_URL}/api/scrape/simple`, { url: merchantUrl }),
      axios.get(`${WEB_INTELLIGENCE_URL}/api/news/search`, { params: { query: new URL(merchantUrl).hostname, maxResults: 5 } }),
      axios.post(`${WEB_INTELLIGENCE_URL}/api/scrape/simple`, { url: merchantUrl, selectors: { links: 'a[href*="facebook"], a[href*="instagram"], a[href*="twitter"], a[href*="linkedin"]' } })
    ]);

    const enrichment = {
      merchantId,
      hasWebsite: website.status === 'fulfilled' && website.value.data.success,
      newsCount: news.status === 'fulfilled' ? news.value.data.data?.length || 0 : 0,
      socialProfiles: social.status === 'fulfilled'
        ? Object.keys(social.value.data.data?.links || []).length
        : 0,
      webIntelligenceScore: calculateWebScore(
        website.status === 'fulfilled',
        news.status === 'fulfilled',
        social.status === 'fulfilled'
      ),
      enrichedAt: new Date().toISOString()
    };

    res.json({ success: true, enrichment });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function calculateWebScore(hasWebsite: boolean, hasNews: boolean, hasSocial: boolean): number {
  let score = 0;
  if (hasWebsite) score += 40;
  if (hasNews) score += 30;
  if (hasSocial) score += 30;
  return score;
}

app.listen(PORT, () => console.log(`📡 REZ Atlas Signals running on port ${PORT}`));
export default app;