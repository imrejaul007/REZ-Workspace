import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { listingRegistry, LISTING_TYPES, LISTING_STATUS } from '../index.js';

const router = express.Router();

/**
 * GET /api/listings
 * List marketplace listings
 */
router.get('/', async (req, res) => {
  try {
    const { industry, type, status, minPrice, maxPrice, limit = 50 } = req.query;

    let listings = Array.from(listingRegistry.values());

    if (industry) listings = listings.filter(l => l.industry === industry);
    if (type) listings = listings.filter(l => l.type === type);
    if (status) listings = listings.filter(l => l.status === status);
    if (minPrice) listings = listings.filter(l => l.price >= parseFloat(minPrice));
    if (maxPrice) listings = listings.filter(l => l.price <= parseFloat(maxPrice));

    listings = listings.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/listings
 * Create a listing
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      type = LISTING_TYPES.PRODUCT,
      industry,
      price,
      currency = 'USD',
      providerId,
      metadata = {}
    } = req.body;

    if (!title || !industry || !price) {
      return res.status(400).json({
        success: false,
        error: 'Title, industry, and price are required'
      });
    }

    const listingId = `listing_${uuidv4()}`;
    const listing = {
      id: listingId,
      title,
      description,
      type,
      industry,
      price,
      currency,
      providerId,
      status: LISTING_STATUS.ACTIVE,
      views: 0,
      favorites: 0,
      metadata,
      createdAt: new Date().toISOString()
    };

    listingRegistry.set(listingId, listing);

    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/listings/:id
 * Get listing details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = listingRegistry.get(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Increment views
    listing.views++;
    listingRegistry.set(id, listing);

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/listings/:id
 * Update listing
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const listing = listingRegistry.get(id);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    const updated = { ...listing, ...updates, updatedAt: new Date().toISOString() };
    listingRegistry.set(id, updated);

    res.json({
      success: true,
      listing: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/listings/industry/:industry
 * Get listings by industry
 */
router.get('/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;

    const listings = Array.from(listingRegistry.values())
      .filter(l => l.industry === industry);

    res.json({
      success: true,
      industry,
      count: listings.length,
      listings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
