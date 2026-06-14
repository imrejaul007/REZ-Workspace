/**
 * REZ Atlas Discover - Discovery Routes
 * Map-First Merchant Search
 */

import { Router, Request, Response } from 'express';
import { DiscoveredMerchantModel, ISearchQuery } from '../models/merchant.js';
import { GooglePlacesService } from '../services/googlePlaces.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize external services
const googlePlaces = new GooglePlacesService();

// ============================================================================
// SEARCH - Map-First Discovery
// ============================================================================

/**
 * GET /api/search
 * Search merchants by query and/or location
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q,
      lat,
      lng,
      radius = 5000,
      category,
      subCategory,
      minRating,
      limit = 20,
      offset = 0
    } = req.query;

    const results: any[] = [];

    // 1. Search in our database
    const dbQuery: any = {};

    if (q) {
      dbQuery.name = { $regex: q, $options: 'i' };
    }

    if (category) {
      dbQuery.category = category;
    }

    if (subCategory) {
      dbQuery.subCategory = subCategory;
    }

    if (minRating) {
      dbQuery['rating.overall'] = { $gte: Number(minRating) };
    }

    // Geo search if coordinates provided
    if (lat && lng) {
      dbQuery['location.lat'] = { $exists: true };
      dbQuery['location.lng'] = { $exists: true };
    }

    const dbResults = await DiscoveredMerchantModel
      .find(dbQuery)
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    results.push(...dbResults.map(m => ({
      ...m,
      source: 'database',
      _id: undefined
    })));

    // 2. Search Google Places if API key available
    if (process.env.GOOGLE_PLACES_API_KEY && q) {
      try {
        const placesResults = await googlePlaces.searchPlaces({
          query: q as string,
          lat: lat ? Number(lat) : undefined,
          lng: lng ? Number(lng) : undefined,
          radius: Number(radius),
          type: category as string
        });

        // Merge and deduplicate
        for (const place of placesResults) {
          const exists = results.some(r =>
            r.name?.toLowerCase() === place.name?.toLowerCase() &&
            r.location?.address === place.address
          );

          if (!exists) {
            results.push({
              businessId: place.placeId,
              name: place.name,
              category: place.category || category,
              location: {
                address: place.address,
                lat: place.lat,
                lng: place.lng
              },
              contact: {
                phone: place.phone,
                website: place.website
              },
              rating: place.rating,
              source: 'google_places',
              _id: undefined
            });
          }
        }
      } catch (error) {
        console.error('Google Places search failed:', error);
      }
    }

    // 3. Sort by relevance (exact match first, then by rating)
    results.sort((a, b) => {
      // Exact name match first
      if (q) {
        const aExact = a.name?.toLowerCase() === (q as string).toLowerCase();
        const bExact = b.name?.toLowerCase() === (q as string).toLowerCase();
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
      }

      // Then by rating
      const aRating = a.rating?.overall || 0;
      const bRating = b.rating?.overall || 0;
      return bRating - aRating;
    });

    res.json({
      query: q,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng), radius: Number(radius) } : null,
      count: results.length,
      merchants: results.slice(0, Number(limit))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================================
// NEARBY - Find merchants near a location
// ============================================================================

/**
 * GET /api/nearby
 * Find merchants near a specific location
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000, category, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusMeters = Number(radius);

    // Build query
    const query: any = {
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    };

    if (category) {
      query.category = category;
    }

    // GeoJSON query for nearby
    const nearbyMerchants = await DiscoveredMerchantModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lngNum, latNum] },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          spherical: true,
          query
        }
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] }
        }
      },
      { $limit: Number(limit) }
    ]);

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const merchant of nearbyMerchants) {
      const cat = merchant.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(merchant);
    }

    res.json({
      center: { lat: latNum, lng: lngNum },
      radius: radiusMeters,
      total: nearbyMerchants.length,
      merchants: nearbyMerchants,
      byCategory,
      summary: {
        byCategory: Object.keys(byCategory).map(cat => ({
          category: cat,
          count: byCategory[cat].length
        }))
      }
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: 'Nearby search failed' });
  }
});

// ============================================================================
// MERCHANTS - CRUD operations
// ============================================================================

/**
 * GET /api/merchants
 * List all discovered merchants
 */
router.get('/merchants', async (req: Request, res: Response) => {
  try {
    const { category, city, enriched, limit = 50, offset = 0 } = req.query;

    const query: any = {};
    if (category) query.category = category;
    if (city) query['location.city'] = city;
    if (enriched !== undefined) query.enriched = enriched === 'true';

    const merchants = await DiscoveredMerchantModel
      .find(query)
      .skip(Number(offset))
      .limit(Number(limit))
      .sort({ discoveredAt: -1 });

    const total = await DiscoveredMerchantModel.countDocuments(query);

    res.json({
      count: merchants.length,
      total,
      merchants
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list merchants' });
  }
});

/**
 * GET /api/merchants/:id
 * Get merchant by ID
 */
router.get('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const merchant = await DiscoveredMerchantModel.findOne({ businessId: req.params.id });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get merchant' });
  }
});

/**
 * POST /api/merchants
 * Add a new discovered merchant
 */
router.post('/merchants', async (req: Request, res: Response) => {
  try {
    const merchantData = req.body;

    // Generate businessId if not provided
    if (!merchantData.businessId) {
      merchantData.businessId = `ATLAS-${uuidv4().slice(0, 8).toUpperCase()}`;
    }

    merchantData.discoveredAt = new Date();

    const merchant = await DiscoveredMerchantModel.create(merchantData);

    res.status(201).json({ merchant });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ error: 'Failed to create merchant' });
  }
});

/**
 * PUT /api/merchants/:id
 * Update a discovered merchant
 */
router.put('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const merchant = await DiscoveredMerchantModel.findOneAndUpdate(
      { businessId: req.params.id },
      { $set: { ...req.body, lastVerified: new Date() } },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update merchant' });
  }
});

// ============================================================================
// CATEGORIES - Category management
// ============================================================================

/**
 * GET /api/categories
 * Get all available categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await DiscoveredMerchantModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subCategories: { $addToSet: '$subCategory' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      categories: categories.map(c => ({
        name: c._id,
        count: c.count,
        subCategories: c.subCategories.filter(Boolean)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// ============================================================================
// AREAS - Area/Zip analysis
// ============================================================================

/**
 * GET /api/areas
 * Get merchant density by area
 */
router.get('/areas', async (req: Request, res: Response) => {
  try {
    const { city, category, limit = 20 } = req.query;

    const match: any = {};
    if (city) match['location.city'] = city;
    if (category) match.category = category;

    const areas = await DiscoveredMerchantModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            city: '$location.city',
            area: '$area',
            zone: '$zone'
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $match: {
          '_id.area': { $ne: null, $ne: '' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({
      areas: areas.map(a => ({
        city: a._id.city,
        area: a._id.area,
        zone: a._id.zone,
        count: a.count,
        avgRating: a.avgRating || 0,
        categories: a.categories
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get areas' });
  }
});

// ============================================================================
// SYNC - External data sync
// ============================================================================

/**
 * POST /api/sync/google-places
 * Sync merchants from Google Places
 */
router.post('/sync/google-places', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000, type } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const results = await googlePlaces.nearbySearch({
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
      type
    });

    // Save to database
    const merchants = [];
    for (const place of results) {
      const merchant = await DiscoveredMerchantModel.findOneAndUpdate(
        { businessId: place.placeId },
        {
          $set: {
            businessId: place.placeId,
            name: place.name,
            category: place.category,
            location: {
              address: place.address,
              lat: place.lat,
              lng: place.lng
            },
            contact: {
              phone: place.phone,
              website: place.website
            },
            rating: place.rating,
            lastVerified: new Date()
          },
          $addToSet: { sources: 'google_places' }
        },
        { upsert: true, new: true }
      );
      merchants.push(merchant);
    }

    res.json({
      synced: merchants.length,
      merchants
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ============================================================================
// STATS - Discovery statistics
// ============================================================================

/**
 * GET /api/stats
 * Get discovery statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const total = await DiscoveredMerchantModel.countDocuments();
    const enriched = await DiscoveredMerchantModel.countDocuments({ enriched: true });
    const verified = await DiscoveredMerchantModel.countDocuments({ 'dataQuality.verified': true });

    const byCategory = await DiscoveredMerchantModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const bySource = await DiscoveredMerchantModel.aggregate([
      { $unwind: '$sources' },
      { $group: { _id: '$sources', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      enriched,
      verified,
      byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
      bySource: bySource.map(s => ({ source: s._id, count: s.count }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export { router as discoverRoutes };