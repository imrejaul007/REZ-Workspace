/**
 * Industry-specific Twin Routes
 */
import { Router } from 'express';
import { TwinRegistry } from '../services/twinRegistry.js';

const router = Router();
const twinRegistry = new TwinRegistry();

// Get all industry twin catalogs
router.get('/', async (req, res) => {
  try {
    const catalog = twinRegistry.getCatalog();
    res.json({
      industries: catalog,
      totalIndustries: catalog.length,
      totalTwins: twinRegistry.getTotalCount()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry twins' });
  }
});

// Get specific industry twins
router.get('/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    const twins = twinRegistry.getByIndustry(industry);
    
    if (twins.length === 0) {
      return res.status(404).json({ error: 'Industry not found' });
    }
    
    res.json({
      industry,
      twins,
      count: twins.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry twins' });
  }
});

// Get twin types in an industry
router.get('/:industry/types', async (req, res) => {
  try {
    const { industry } = req.params;
    const twins = twinRegistry.getByIndustry(industry);
    
    if (twins.length === 0) {
      return res.status(404).json({ error: 'Industry not found' });
    }
    
    const types = twins.map(t => ({
      type: t.type,
      name: t.name,
      description: t.description,
      capabilities: t.capabilities
    }));
    
    res.json({
      industry,
      types,
      count: types.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry types' });
  }
});

// Get specific twin type in an industry
router.get('/:industry/:type', async (req, res) => {
  try {
    const { industry, type } = req.params;
    const twins = twinRegistry.getByIndustry(industry);
    
    const twin = twins.find(t => t.type === type);
    
    if (!twin) {
      return res.status(404).json({ error: 'Twin type not found' });
    }
    
    res.json(twin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch twin' });
  }
});

// Compare twins across industries
router.post('/compare', async (req, res) => {
  try {
    const { industries, type } = req.body;
    
    const comparison = industries.map(industry => {
      const twins = twinRegistry.getByIndustry(industry);
      const twin = type ? twins.find(t => t.type === type) : twins[0];
      return {
        industry,
        twin: twin || null
      };
    });
    
    res.json({
      type: type || 'all',
      comparison,
      comparedIndustries: industries.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare twins' });
  }
});

export default router;
