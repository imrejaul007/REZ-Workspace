/**
 * REZ Atlas Scraper Service
 *
 * Dedicated scraper for REZ Atlas merchant intelligence
 * Port: 5160
 *
 * Scrapers:
 * - Website scraper (Cheerio)
 * - Google Reviews scraper
 * - Zomato scraper
 * - Justdial scraper
 * - LinkedIn scraper
 * - Social media scraper
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { WebsiteScraper } from './scrapers/websiteScraper';
import { GoogleReviewsScraper } from './scrapers/googleReviewsScraper';
import { ZomatoScraper } from './scrapers/zomatoScraper';
import { SocialMediaScraper } from './scrapers/socialMediaScraper';

const app: express.Application = express();
const PORT = 5160;

app.use(cors());
app.use(express.json());

// Initialize scrapers
const websiteScraper = new WebsiteScraper();
const googleReviewsScraper = new GoogleReviewsScraper();
const zomatoScraper = new ZomatoScraper();
const socialMediaScraper = new SocialMediaScraper();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'REZ-atlas-scraper',
    version: '1.0.0',
    scrapers: ['website', 'google-reviews', 'zomato', 'social-media']
  });
});

// ==================== WEBSITE SCRAPER ====================

/**
 * Scrape merchant website
 * POST /api/scrape/website
 */
app.post('/api/scrape/website', async (req, res) => {
  try {
    const { url, extractFields } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await websiteScraper.scrape(url, extractFields);

    res.json({
      success: true,
      source: 'website',
      url,
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GOOGLE REVIEWS SCRAPER ====================

/**
 * Scrape Google Reviews
 * POST /api/scrape/google-reviews
 */
app.post('/api/scrape/google-reviews', async (req, res) => {
  try {
    const { placeUrl } = req.body;

    if (!placeUrl) {
      return res.status(400).json({ error: 'placeUrl is required (Google Maps URL)' });
    }

    const result = await googleReviewsScraper.scrape(placeUrl);

    res.json({
      success: true,
      source: 'google-reviews',
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Scrape Google Reviews by business name
 * POST /api/scrape/google-reviews/search
 */
app.post('/api/scrape/google-reviews/search', async (req, res) => {
  try {
    const { businessName, location } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: 'businessName is required' });
    }

    const result = await googleReviewsScraper.searchAndScrape(businessName, location);

    res.json({
      success: true,
      source: 'google-reviews',
      query: businessName,
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ZOMATO SCRAPER ====================

/**
 * Scrape Zomato restaurant data
 * POST /api/scrape/zomato
 */
app.post('/api/scrape/zomato', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required (Zomato URL)' });
    }

    const result = await zomatoScraper.scrape(url);

    res.json({
      success: true,
      source: 'zomato',
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search Zomato by location and cuisine
 * POST /api/scrape/zomato/search
 */
app.post('/api/scrape/zomato/search', async (req, res) => {
  try {
    const { query, city } = req.body;

    if (!query || !city) {
      return res.status(400).json({ error: 'query and city are required' });
    }

    const result = await zomatoScraper.search(query, city);

    res.json({
      success: true,
      source: 'zomato',
      query,
      city,
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOCIAL MEDIA SCRAPER ====================

/**
 * Check social media presence
 * POST /api/scrape/social-media
 */
app.post('/api/scrape/social-media', async (req, res) => {
  try {
    const { url, businessName } = req.body;

    if (!url && !businessName) {
      return res.status(400).json({ error: 'url or businessName is required' });
    }

    let result;
    if (url) {
      result = await socialMediaScraper.scrapeFromWebsite(url);
    } else {
      result = await socialMediaScraper.searchProfiles(businessName!);
    }

    res.json({
      success: true,
      source: 'social-media',
      data: result,
      scrapedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MERCHANT INTELLIGENCE ====================

/**
 * Get full merchant intelligence
 * POST /api/intelligence
 */
app.post('/api/intelligence', async (req, res) => {
  try {
    const { name, url, googleMapsUrl, zomatoUrl, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const intelligence: any = {
      merchantId: uuidv4(),
      name,
      scrapedAt: new Date().toISOString()
    };

    // Scrape website if URL provided
    if (url) {
      try {
        intelligence.website = await websiteScraper.scrape(url);
      } catch (e) {
        intelligence.website = { error: 'Failed to scrape website' };
      }
    }

    // Scrape Google Reviews if provided
    if (googleMapsUrl) {
      try {
        intelligence.googleReviews = await googleReviewsScraper.scrape(googleMapsUrl);
      } catch (e) {
        intelligence.googleReviews = { error: 'Failed to scrape Google Reviews' };
      }
    }

    // Scrape Zomato if provided
    if (zomatoUrl) {
      try {
        intelligence.zomato = await zomatoScraper.scrape(zomatoUrl);
      } catch (e) {
        intelligence.zomato = { error: 'Failed to scrape Zomato' };
      }
    }

    // Check social media
    if (url) {
      try {
        intelligence.socialMedia = await socialMediaScraper.scrapeFromWebsite(url);
      } catch (e) {
        intelligence.socialMedia = { error: 'Failed to check social media' };
      }
    } else if (location) {
      try {
        intelligence.socialMedia = await socialMediaScraper.searchProfiles(name);
      } catch (e) {
        intelligence.socialMedia = { error: 'Failed to search social media' };
      }
    }

    // Calculate web presence score
    intelligence.webPresenceScore = calculateWebScore(intelligence);

    res.json({
      success: true,
      data: intelligence
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPETITOR ANALYSIS ====================

/**
 * Analyze competitors in area
 * POST /api/competitors
 */
app.post('/api/competitors', async (req, res) => {
  try {
    const { merchantUrl, category } = req.body;

    if (!merchantUrl && !category) {
      return res.status(400).json({ error: 'merchantUrl or category is required' });
    }

    const competitors: any[] = [];

    // Scrape the merchant website
    if (merchantUrl) {
      try {
        const website = await websiteScraper.scrape(merchantUrl);
        competitors.push({
          type: 'target',
          url: merchantUrl,
          name: website.title,
          website
        });
      } catch (e) {
        // Continue even if scrape fails
      }
    }

    // Search Zomato for competitors
    if (category) {
      try {
        const zomatoResults = await zomatoScraper.search(category, 'Mumbai');
        competitors.push(...zomatoResults.restaurants.slice(0, 5).map((r: any) => ({
          type: 'competitor',
          source: 'zomato',
          ...r
        })));
      } catch (e) {
        // Continue even if search fails
      }
    }

    res.json({
      success: true,
      competitors,
      count: competitors.length,
      analyzedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function calculateWebScore(intelligence: any): number {
  let score = 0;

  // Website
  if (intelligence.website && !intelligence.website.error) {
    score += 25;
  }

  // Google Reviews
  if (intelligence.googleReviews && !intelligence.googleReviews.error) {
    score += 25;
    if (intelligence.googleReviews.rating) {
      score += Math.round(intelligence.googleReviews.rating * 5); // Up to 5 extra points
    }
  }

  // Zomato
  if (intelligence.zomato && !intelligence.zomato.error) {
    score += 20;
  }

  // Social Media
  if (intelligence.socialMedia && !intelligence.socialMedia.error) {
    const social = intelligence.socialMedia;
    if (social.hasWebsite) score += 5;
    if (social.facebook) score += 5;
    if (social.instagram) score += 5;
    if (social.twitter) score += 5;
    if (social.linkedin) score += 5;
    if (social.youtube) score += 5;
  }

  return Math.min(score, 100);
}

app.listen(PORT, () => {
  console.log(`🔍 REZ Atlas Scraper running on port ${PORT}`);
  console.log(`
  Endpoints:
  - GET  /health
  - POST /api/scrape/website
  - POST /api/scrape/google-reviews
  - POST /api/scrape/google-reviews/search
  - POST /api/scrape/zomato
  - POST /api/scrape/zomato/search
  - POST /api/scrape/social-media
  - POST /api/intelligence (full merchant intel)
  - POST /api/competitors
  `);
});

export default app;
