
/**
 * QR Integration Routes - Unified endpoints for all QR systems
 *
 * This module provides comprehensive endpoints for:
 * - Room QR: Hotel/room information, room service, service requests
 * - Menu QR: Store/menu information, product catalog, categories
 * - Rez Now: Store profile, services, appointments, analytics
 * - Ads QR: Brand information, campaigns, store locations
 *
 * Public endpoints (no auth required for QR scanning):
 * - GET /qr/public/store/:slug - Get store by slug for QR codes
 * - GET /qr/public/menu/:storeId - Get menu for QR codes
 * - GET /qr/public/hotel/:hotelId/room/:roomId - Get hotel room info
 *
 * Authenticated endpoints (for merchant operations):
 * - All standard CRUD operations for stores, products, services, campaigns
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { Service, Appointment } from '../models/Service';
import { CampaignRule } from '../models/CampaignRule';
import { Category } from '../models/Category';
import { merchantAuth } from '../middleware/auth';
import { captureIntent } from '../utils/intentCapture';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { getMenuFast, invalidateMenuCache } from '../services/menuCacheOptimizer';

const router = Router();

// ============================================================================
// PUBLIC QR ENDPOINTS (No authentication required for QR scanning)
// ============================================================================

/**
 * GET /qr/public/store/:slug
 * Get store information by slug for QR codes.
 * This is a public endpoint - no authentication required.
 */
router.get('/public/store/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const cacheKey = `qr:store:${slug}`;
    const cached = await cacheGet<unknown>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const store = await Store.findOne({ slug, isActive: true, isListed: true })
      .select('-adminNotes -adminApprovedBy')
      .lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        code: 'STORE_NOT_FOUND',
      });
    }

    const response = {
      success: true,
      data: {
        id: (store as unknown)._id?.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        banner: store.banner || [],
        category: store.category,
        subcategories: store.subcategories || [],
        location: store.location,
        contact: store.contact,
        operationalInfo: store.operationalInfo,
        storeType: store.storeType,
        acceptsOnlineOrders: store.acceptsOnlineOrders,
        acceptsScanPay: store.acceptsScanPay,
        deliveryEnabled: store.deliveryEnabled,
        deliveryRadiusKm: store.deliveryRadiusKm,
        deliveryFee: store.deliveryFee,
        ratings: store.ratings,
        tags: store.tags || [],
        features: store.features || [],
        socialLinks: {
          instagram: store.instagramHandle,
          facebook: store.facebookUrl,
          twitter: store.twitterHandle,
          website: store.websiteUrl,
        },
      },
      meta: {
        qrType: 'store',
        scannedAt: new Date().toISOString(),
      },
    };

    await cacheSet(cacheKey, response, 300); // Cache for 5 minutes
    res.json(response);
  } catch (err: unknown) {
    console.error('QR store lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /qr/public/store/id/:storeId
 * Get store information by ID for QR codes.
 */
router.get('/public/store/id/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
        code: 'INVALID_ID',
      });
    }

    const store = await Store.findOne({ _id: storeId, isActive: true, isListed: true })
      .select('-adminNotes -adminApprovedBy')
      .lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        code: 'STORE_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        id: (store as unknown)._id?.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        banner: store.banner || [],
        category: store.category,
        location: store.location,
        contact: store.contact,
        operationalInfo: store.operationalInfo,
        storeType: store.storeType,
        acceptsOnlineOrders: store.acceptsOnlineOrders,
        acceptsScanPay: store.acceptsScanPay,
        ratings: store.ratings,
      },
      meta: {
        qrType: 'store',
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('QR store lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /qr/public/menu/:storeId
 * Get full menu with products and categories for a store.
 * OPTIMIZED: Uses stale-while-revalidate caching + single DB aggregation.
 * Target: < 2 second response time.
 */
router.get('/public/menu/:storeId', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { storeId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
        code: 'INVALID_ID',
      });
    }

    // Use optimized cache-first lookup
    const { data, source } = await getMenuFast(storeId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        code: 'STORE_NOT_FOUND',
      });
    }

    const response = {
      success: true,
      data,
      meta: {
        qrType: 'menu',
        scannedAt: new Date().toISOString(),
        cacheSource: source, // 'cache' | 'stale' | 'db'
        responseTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (err: unknown) {
    console.error('QR menu lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /qr/public/services/:storeId
 * Get services catalog for a store (for appointment-based businesses).
 */
router.get('/public/services/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
        code: 'INVALID_ID',
      });
    }

    const services = await Service.find({
      storeId: new mongoose.Types.ObjectId(storeId),
      isActive: true,
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        services: services.map(s => ({
          id: (s as unknown)._id?.toString(),
          name: s.name,
          description: s.description,
          price: s.price,
          duration: s.duration,
          category: s.category,
          images: s.images,
          beforeAfter: s.beforeAfter,
        })),
      },
      meta: {
        qrType: 'services',
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('QR services lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /qr/public/campaign/:campaignId
 * Get campaign information for ads QR codes.
 */
router.get('/public/campaign/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID',
        code: 'INVALID_ID',
      });
    }

    const campaign = await CampaignRule.findOne({
      _id: campaignId,
      isActive: true,
      status: 'active',
    }).lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
        code: 'CAMPAIGN_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        id: (campaign as unknown)._id?.toString(),
        name: campaign.name,
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
        rewardValue: campaign.rewardValue,
        rewardType: campaign.rewardType,
        storeId: campaign.storeId,
      },
      meta: {
        qrType: 'campaign',
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('QR campaign lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /qr/public/service-request
 * Submit a service request from Room QR or Menu QR.
 */
const serviceRequestSchema = z.object({
  type: z.enum(['room_service', 'housekeeping', 'maintenance', 'general', 'order']),
  storeId: z.string(),
  roomId: z.string().optional(),
  hotelId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  request: z.string().min(1, 'Request description is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string(),
    quantity: z.number().int().positive().default(1),
    notes: z.string().optional(),
  })).optional(),
  scheduledTime: z.string().datetime().optional(),
});

router.post('/public/service-request', async (req: Request, res: Response) => {
  try {
    const validationResult = serviceRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: validationResult.error.issues,
      });
    }

    const data = validationResult.data;

    // Verify store exists
    if (!mongoose.Types.ObjectId.isValid(data.storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
        code: 'INVALID_ID',
      });
    }

    const store = await Store.findOne({ _id: data.storeId, isActive: true });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        code: 'STORE_NOT_FOUND',
      });
    }

    // Create service request (using Order model for tracking)
    const { Order } = await import('../models/Order');
    const requestId = new mongoose.Types.ObjectId();

    const serviceRequest = await Order.create({
      _id: requestId,
      store: data.storeId,
      merchantId: store.merchantId,
      customer: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      status: 'pending',
      orderType: data.type,
      items: data.items?.map(item => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
      })) || [],
      notes: data.request,
      metadata: {
        roomId: data.roomId,
        hotelId: data.hotelId,
        priority: data.priority,
        qrSource: 'public_qr',
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
      },
    });

    // Track intent
    captureIntent({
      userId: data.customerId || 'anonymous',
      appType: 'consumer',
      eventType: 'service_request_submitted',
      intentKey: `sr_${requestId}`,
      category: 'SERVICE_REQUEST',
      metadata: {
        requestType: data.type,
        storeId: data.storeId,
        roomId: data.roomId,
        priority: data.priority,
      },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        requestId: requestId.toString(),
        status: 'submitted',
        estimatedResponse: '15-30 minutes',
      },
      message: 'Service request submitted successfully',
    });
  } catch (err: unknown) {
    console.error('Service request error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit service request',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /qr/public/analytics/track
 * Track QR scan events for analytics.
 */
const analyticsTrackSchema = z.object({
  storeId: z.string().optional(),
  event: z.enum(['qr_scan', 'view_menu', 'add_to_cart', 'place_order', 'book_appointment']),
  metadata: z.record(z.unknown()).optional(),
  customerId: z.string().optional(),
  sessionId: z.string().optional(),
  source: z.enum(['room_qr', 'menu_qr', 'rez_now', 'ads_qr', 'unknown']).default('unknown'),
});

router.post('/public/analytics/track', async (req: Request, res: Response) => {
  try {
    const validationResult = analyticsTrackSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    }

    const { event, metadata, customerId, sessionId, source } = validationResult.data;

    // Track in analytics
    captureIntent({
      userId: customerId || 'anonymous',
      appType: 'consumer',
      eventType: event,
      intentKey: `qr_${event}_${Date.now()}`,
      category: 'QR_ANALYTICS',
      metadata: {
        ...metadata,
        source,
        storeId: metadata?.storeId,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    // Update store analytics if storeId provided
    if (metadata?.storeId) {
      const { StoreAnalytics } = await import('../models/StoreAnalytics');
      await StoreAnalytics.findOneAndUpdate(
        { store: metadata.storeId },
        {
          $inc: {
            'stats.qrScans': event === 'qr_scan' ? 1 : 0,
            'stats.ordersFromQR': event === 'place_order' ? 1 : 0,
          },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true },
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Event tracked',
    });
  } catch (err: unknown) {
    console.error('Analytics track error:', err);
    // Don't fail the request for analytics errors
    res.json({
      success: true,
      message: 'Event tracked (silent)',
    });
  }
});

// ============================================================================
// HOTEL / ROOM QR ENDPOINTS
// ============================================================================

/**
 * GET /qr/public/hotel/:hotelId/room/:roomId
 * Get hotel room information for Room QR codes.
 */
router.get('/public/hotel/:hotelId/room/:roomId', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId } = req.params;

    // Find the hotel store
    const hotel = await Store.findOne({
      _id: hotelId,
      isActive: true,
      category: { $regex: /hotel|resort|inn|lodge/gi },
    }).lean();

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
        code: 'HOTEL_NOT_FOUND',
      });
    }

    // For now, return hotel info - room-specific data would come from Hotel OTA integration
    const response = {
      success: true,
      data: {
        hotel: {
          id: (hotel as unknown)._id?.toString(),
          name: hotel.name,
          logo: hotel.logo,
          address: hotel.location?.address,
          city: hotel.location?.city,
          contact: hotel.contact,
        },
        room: {
          id: roomId,
          // Additional room details would come from Hotel OTA service
          availableServices: [
            { id: 'room_service', name: 'Room Service', icon: 'food' },
            { id: 'housekeeping', name: 'Housekeeping', icon: 'cleaning' },
            { id: 'maintenance', name: 'Maintenance', icon: 'repair' },
            { id: 'concierge', name: 'Concierge', icon: 'support' },
          ],
          quickActions: [
            { action: 'order', label: 'Order Food', icon: 'restaurant' },
            { action: 'housekeeping', label: 'Request Housekeeping', icon: 'cleaning_services' },
            { action: 'checkout', label: 'Express Checkout', icon: 'payment' },
          ],
        },
        menu: {
          // Include a preview of available items
          hasMenu: true,
          endpoint: `/qr/public/menu/${hotel._id}`,
        },
      },
      meta: {
        qrType: 'hotel_room',
        hotelId,
        roomId,
        scannedAt: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (err: unknown) {
    console.error('Hotel room QR error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel room info',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ============================================================================
// MERCHANT AUTHENTICATED ENDPOINTS
// ============================================================================

/**
 * GET /qr/merchant/stores
 * Get all stores for merchant QR management.
 */
router.get('/merchant/stores', merchantAuth, async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId })
      .select('-adminNotes -adminApprovedBy')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: stores,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
    });
  }
});

/**
 * GET /qr/merchant/stores/:storeId/analytics
 * Get QR analytics for a specific store.
 */
router.get('/merchant/stores/:storeId/analytics', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
      });
    }

    // Verify ownership
    const store = await Store.findOne({
      _id: storeId,
      merchantId: req.merchantId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Get analytics from StoreAnalytics model
    const { StoreAnalytics } = await import('../models/StoreAnalytics');
    const analytics = await StoreAnalytics.findOne({ store: storeId }).lean();

    res.json({
      success: true,
      data: {
        storeId,
        storeName: store.name,
        qrScans: analytics?.stats?.qrScans || 0,
        ordersFromQR: analytics?.stats?.ordersFromQR || 0,
        conversionRate: analytics?.stats?.qrScans
          ? ((analytics?.stats?.ordersFromQR || 0) / analytics?.stats?.qrScans * 100).toFixed(2) + '%'
          : '0%',
        lastUpdated: analytics?.lastUpdated,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
});

/**
 * POST /qr/merchant/stores/:storeId/regenerate
 * Regenerate QR codes for a store.
 */
router.post('/merchant/stores/:storeId/regenerate', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
      });
    }

    const store = await Store.findOne({
      _id: storeId,
      merchantId: req.merchantId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Generate new QR payload
    const qrPayload = {
      storeId,
      action: 'checkin',
      version: 2,
      timestamp: Date.now(),
    };

    // Update store with new QR config
    store.storeQR = {
      ...store.storeQR,
      payload: qrPayload,
      generatedAt: new Date(),
      version: 2,
    };
    await store.save();

    // Clear cache using optimized invalidation
    await invalidateMenuCache(storeId, store.slug);

    res.json({
      success: true,
      data: {
        storeId,
        storeSlug: store.slug,
        qrPayload,
        qrString: JSON.stringify(qrPayload),
        deepLink: `rezapp://checkin?storeId=${storeId}`,
      },
      message: 'QR codes regenerated successfully',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate QR codes',
    });
  }
});

/**
 * GET /qr/merchant/qr-links
 * Get all QR links for merchant's stores.
 */
router.get('/merchant/qr-links', merchantAuth, async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId, isActive: true })
      .select('name slug _id storeQR')
      .lean();

    const qrLinks = stores.map(store => {
      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://rez.money';
      return {
        storeId: (store as unknown)._id?.toString(),
        storeName: store.name,
        storeSlug: store.slug,
        links: {
          checkin: `${baseUrl}/s/${store.slug}`,
          menu: `${baseUrl}/menu/${store._id}`,
          pay: `${baseUrl}/pay/${store._id}`,
          review: `${baseUrl}/review/${store._id}`,
        },
        deepLinks: {
          checkin: `rezapp://checkin?storeId=${store._id}`,
          menu: `rezapp://menu?storeId=${store._id}`,
          pay: `rezapp://pay?storeId=${store._id}`,
        },
      };
    });

    res.json({
      success: true,
      data: qrLinks,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QR links',
    });
  }
});

/**
 * GET /qr/merchant/campaigns
 * Get campaigns for Ads QR integration.
 */
router.get('/merchant/campaigns', merchantAuth, async (req: Request, res: Response) => {
  try {
    const campaigns = await CampaignRule.find({ merchantId: req.merchantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
    });
  }
});

/**
 * GET /qr/merchant/campaigns/:campaignId/qr
 * Get QR code data for a campaign.
 */
router.get('/merchant/campaigns/:campaignId/qr', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await CampaignRule.findOne({
      _id: campaignId,
      merchantId: req.merchantId,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://rez.money';
    const qrPayload = {
      type: 'campaign',
      campaignId,
      merchantId: req.merchantId,
      action: campaign.type === 'cashback' ? 'claim' : 'view',
    };

    res.json({
      success: true,
      data: {
        campaignId,
        campaignName: campaign.name,
        campaignType: campaign.type,
        qrPayload,
        qrString: JSON.stringify(qrPayload),
        landingUrl: `${baseUrl}/campaign/${campaignId}`,
        deepLink: `rezapp://campaign/${campaignId}`,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate campaign QR data',
    });
  }
});

export default router;
