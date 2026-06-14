import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { providerRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/providers
 * List providers
 */
router.get('/', async (req, res) => {
  try {
    const { industry, verified } = req.query;

    let providers = Array.from(providerRegistry.values());

    if (industry) providers = providers.filter(p => p.industries.includes(industry));
    if (verified !== undefined) {
      providers = providers.filter(p => p.verified === (verified === 'true'));
    }

    res.json({
      success: true,
      count: providers.length,
      providers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/providers
 * Register provider
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      industries = [],
      description,
      contact,
      verified = false
    } = req.body;

    if (!name || !industries.length) {
      return res.status(400).json({
        success: false,
        error: 'Name and at least one industry are required'
      });
    }

    const providerId = `provider_${uuidv4()}`;
    const provider = {
      id: providerId,
      name,
      industries,
      description,
      contact,
      verified,
      rating: 0,
      totalSales: 0,
      createdAt: new Date().toISOString()
    };

    providerRegistry.set(providerId, provider);

    res.status(201).json({
      success: true,
      provider
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/:id
 * Get provider details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = providerRegistry.get(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    res.json({
      success: true,
      provider
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
