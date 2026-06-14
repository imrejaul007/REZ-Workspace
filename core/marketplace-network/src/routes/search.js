import express from 'express';
import { listingRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/search
 * Unified search across all industries
 */
router.get('/', async (req, res) => {
  try {
    const { q, industry, type, minPrice, maxPrice, sort = 'relevance', limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let listings = Array.from(listingRegistry.values());

    // Search in title and description
    const query = q.toLowerCase();
    listings = listings.filter(l =>
      l.title.toLowerCase().includes(query) ||
      l.description?.toLowerCase().includes(query)
    );

    // Apply filters
    if (industry) listings = listings.filter(l => l.industry === industry);
    if (type) listings = listings.filter(l => l.type === type);
    if (minPrice) listings = listings.filter(l => l.price >= parseFloat(minPrice));
    if (maxPrice) listings = listings.filter(l => l.price <= parseFloat(maxPrice));

    // Sort
    switch (sort) {
      case 'price_asc':
        listings.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        listings.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        listings.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'recent':
        listings.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    listings = listings.slice(0, parseInt(limit));

    // Aggregate by industry
    const byIndustry = {};
    for (const listing of listings) {
      if (!byIndustry[listing.industry]) {
        byIndustry[listing.industry] = { count: 0, total: 0 };
      }
      byIndustry[listing.industry].count++;
      byIndustry[listing.industry].total += listing.price;
    }

    res.json({
      success: true,
      query: q,
      count: listings.length,
      listings,
      facets: { byIndustry }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, suggestions: [] });
    }

    const query = q.toLowerCase();
    const titles = new Set();

    for (const listing of listingRegistry.values()) {
      if (listing.title.toLowerCase().includes(query)) {
        titles.add(listing.title);
      }
      if (titles.size >= 10) break;
    }

    res.json({
      success: true,
      suggestions: Array.from(titles)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
