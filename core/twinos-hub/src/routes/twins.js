/**
 * Twin Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TwinRegistry } from '../services/twinRegistry.js';

const router = Router();
const twinRegistry = new TwinRegistry();

// Get all registered twins
router.get('/', async (req, res) => {
  try {
    const { industry, type, page = 1, limit = 50 } = req.query;
    
    let twins = [];
    
    if (industry) {
      twins = twinRegistry.getByIndustry(industry);
    } else if (type) {
      twins = twinRegistry.getByType(type);
    } else {
      twins = Array.from(twinRegistry.twins.values());
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const paginatedTwins = twins.slice(start, start + parseInt(limit));
    
    res.json({
      twins: paginatedTwins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: twins.length,
        pages: Math.ceil(twins.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch twins' });
  }
});

// Get specific twin definition
router.get('/:twinId', async (req, res) => {
  try {
    const { twinId } = req.params;
    const twin = twinRegistry.get(twinId);
    
    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }
    
    res.json(twin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch twin' });
  }
});

// Get twins by type across all industries
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const twins = twinRegistry.getByType(type);
    
    res.json({
      type,
      twins,
      count: twins.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch twins by type' });
  }
});

// Search twins (GET - for URL-based search)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const twins = twinRegistry.search(query);

    res.json({
      query,
      twins,
      total: twins.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search twins' });
  }
});

// Search twins (POST - for Business Copilot integration)
router.post('/search', async (req, res) => {
  try {
    const { query, industry, limit = 10 } = req.body;

    let twins = Array.from(twinRegistry.twins.values());

    // Filter by industry
    if (industry) {
      twins = twins.filter(t => t.industry === industry);
    }

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      twins = twins.filter(t => {
        return t.name.toLowerCase().includes(q) ||
               t.type.toLowerCase().includes(q) ||
               t.description.toLowerCase().includes(q) ||
               (t.capabilities && t.capabilities.some(c => c.toLowerCase().includes(q)));
      });
    }

    // Sort by relevance
    twins = twins.slice(0, limit);

    res.json({
      twins,
      total: twins.length,
      returned: twins.length,
      query,
      industry
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search twins' });
  }
});

// Get twin capabilities
router.get('/:twinId/capabilities', async (req, res) => {
  try {
    const { twinId } = req.params;
    const twin = twinRegistry.get(twinId);
    
    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }
    
    res.json({
      twinId,
      twinType: twin.type,
      capabilities: twin.capabilities
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
});

export default router;
