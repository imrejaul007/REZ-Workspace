/**
 * BuzzLocal Social Integration Service
 * Connects AdBazaar to BuzzLocal for community-based advertising
 *
 * Port: 4953
 * Purpose: Enable community targeting, society advertising, and social intent
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4953;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/buzzlocal-integration.log' })
  ]
});

// Configuration
const CONFIG = {
  BUZZLOCAL_API: process.env.BUZZLOCAL_API || 'http://localhost:4400',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token'
};

// BuzzLocal API Client
const buzzlocalClient = axios.create({
  baseURL: CONFIG.BUZZLOCAL_API,
  timeout: 10000,
  headers: {
    'X-Internal-Token': CONFIG.INTERNAL_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB Schemas
const socialIntentSchema = new mongoose.Schema({
  userId: String,
  buzzlocalUserId: String,
  societyId: String,
  communityId: String,
  intentSignals: {
    interests: [String],
    topics: [String],
    events: [String],
    localBusinesses: [String]
  },
  engagement: {
    posts: Number,
    comments: Number,
    shares: Number,
    eventsAttended: Number
  },
  demographics: {
    age: Number,
    gender: String,
    pincode: String,
    society: String
  }
}, { timestamps: true });

const SocialIntent = mongoose.model('SocialIntent', socialIntentSchema);

const communityAudienceSchema = new mongoose.Schema({
  segmentId: String,
  name: String,
  criteria: {
    societies: [String],
    pincodes: [String],
    interests: [String],
    events: [String],
    engagement: { min: Number, max: Number }
  },
  size: Number,
  createdAt: Date
});

const CommunityAudience = mongoose.model('CommunityAudience', communityAudienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    let buzzlocalStatus = 'disconnected';
    try {
      await buzzlocalClient.get('/health');
      buzzlocalStatus = 'connected';
    } catch (e) {
      buzzlocalStatus = 'unavailable';
    }

    res.json({
      status: 'healthy',
      service: 'buzzlocal-social-integration',
      port: PORT,
      buzzlocalStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// ============================================
// SOCIAL DATA WEBHOOKS
// ============================================

/**
 * Receive BuzzLocal activity events
 * POST /api/webhooks/social-event
 */
app.post('/api/webhooks/social-event', async (req: Request, res: Response) => {
  try {
    const { eventType, userId, buzzlocalUserId, data } = req.body;

    logger.info(`Received social event: ${eventType}`, { userId, buzzlocalUserId });

    if (eventType === 'user_activity') {
      // Update or create social intent
      await SocialIntent.findOneAndUpdate(
        { buzzlocalUserId },
        {
          $set: {
            userId,
            intentSignals: data.intentSignals,
            engagement: data.engagement,
            demographics: data.demographics
          }
        },
        { upsert: true, new: true }
      );

      // Send to Intent Signal Aggregator
      await sendToIntentAggregator({
        source: 'buzzlocal',
        userId,
        intent: {
          type: 'social',
          interests: data.intentSignals?.interests || [],
          topics: data.intentSignals?.topics || [],
          location: data.demographics?.pincode
        },
        timestamp: new Date()
      });
    }

    if (eventType === 'event_interest') {
      // Track event interest
      await sendToIntentAggregator({
        source: 'buzzlocal_events',
        userId,
        intent: {
          type: 'event_interest',
          eventId: data.eventId,
          eventCategory: data.category,
          rsvpStatus: data.rsvp
        },
        timestamp: new Date()
      });
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    logger.error('Webhook error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Receive community posts for content targeting
 * POST /api/webhooks/post-event
 */
app.post('/api/webhooks/post-event', async (req: Request, res: Response) => {
  try {
    const { eventType, postId, userId, communityId, content } = req.body;

    if (eventType === 'post_created' || eventType === 'post_engagement') {
      // Analyze content for ad relevance
      const relevance = await analyzeContentRelevance(content);

      if (relevance.score > 0.7) {
        // Send contextual signal
        await sendToIntentAggregator({
          source: 'buzzlocal_content',
          userId,
          intent: {
            type: 'content_engagement',
            topics: relevance.topics,
            sentiment: relevance.sentiment,
            communityId
          },
          timestamp: new Date()
        });
      }
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// COMMUNITY AUDIENCE API
// ============================================

/**
 * Get community audience segments
 * GET /api/audiences
 */
app.get('/api/audiences', async (req: Request, res: Response) => {
  try {
    const audiences = await CommunityAudience.find();
    res.json({ success: true, audiences });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Create community audience segment
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { name, criteria } = req.body;

    const audience = new CommunityAudience({
      segmentId: `comm_${Date.now()}`,
      name,
      criteria,
      size: await calculateAudienceSize(criteria),
      createdAt: new Date()
    });

    await audience.save();
    res.json({ success: true, audience });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get society-based audiences
 * GET /api/audiences/societies
 */
app.get('/api/audiences/societies', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.query;

    const societies = await SocialIntent.aggregate([
      {
        $match: pincode ? { 'demographics.pincode': pincode as string } : {}
      },
      {
        $group: {
          _id: '$demographics.society',
          count: { $sum: 1 },
          avgEngagement: {
            $avg: {
              $add: ['$engagement.posts', '$engagement.comments', '$engagement.shares']
            }
          },
          topInterests: { $push: '$intentSignals.interests' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      societies
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get interest-based audiences
 * GET /api/audiences/interests
 */
app.get('/api/audiences/interests', async (req: Request, res: Response) => {
  try {
    const { minEngagement } = req.query;

    const interests = await SocialIntent.aggregate([
      {
        $match: {
          $expr: {
            $gte: [
              {
                $add: ['$engagement.posts', '$engagement.comments', '$engagement.shares']
              },
              parseInt(minEngagement as string) || 10
            ]
          }
        }
      },
      { $unwind: '$intentSignals.interests' },
      {
        $group: {
          _id: '$intentSignals.interests',
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      interests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// LOCAL BUSINESS TARGETING
// ============================================

/**
 * Get local business audiences
 * GET /api/audiences/local-businesses
 */
app.get('/api/audiences/local-businesses', async (req: Request, res: Response) => {
  try {
    const { pincode, category } = req.query;

    const query: any = {};
    if (pincode) query['demographics.pincode'] = pincode;

    const businesses = await SocialIntent.aggregate([
      { $match: query },
      { $unwind: '$intentSignals.localBusinesses' },
      {
        $group: {
          _id: {
            business: '$intentSignals.localBusinesses',
            pincode: '$demographics.pincode'
          },
          count: { $sum: 1 },
          interestedUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    res.json({
      success: true,
      businesses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get event attendees
 * GET /api/event-attendees
 */
app.get('/api/event-attendees', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    // Query BuzzLocal for event attendees
    const response = await buzzlocalClient.get('/api/internal/events/attendees', {
      params: { eventId }
    });

    res.json({
      success: true,
      attendees: response.data.attendees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD PLACEMENTS
// ============================================

/**
 * Get society screen ad placements
 * GET /api/ad-placements/societies
 */
app.get('/api/ad-placements/societies', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.query;

    const response = await buzzlocalClient.get('/api/internal/societies/screens', {
      params: { pincode }
    });

    const placements = response.data.screens.map((screen: any) => ({
      screenId: screen.id,
      societyId: screen.societyId,
      location: screen.location, // lobby, gate, common area
      size: screen.size,
      audience: screen.audienceProfile,
      adSlots: getSocietySlots(screen.location)
    }));

    res.json({
      success: true,
      count: placements.length,
      placements
    });
  } catch (error) {
    logger.error('Society placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get community feed placements
 * GET /api/ad-placements/feed
 */
app.get('/api/ad-placements/feed', async (req: Request, res: Response) => {
  try {
    const { communityId } = req.query;

    const response = await buzzlocalClient.get('/api/internal/communities/feed-slots', {
      params: { communityId }
    });

    res.json({
      success: true,
      slots: response.data.slots
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// INSIGHTS
// ============================================

/**
 * Get community insights
 * GET /api/insights/communities
 */
app.get('/api/insights/communities', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.query;

    const insights = await SocialIntent.aggregate([
      {
        $match: pincode ? { 'demographics.pincode': pincode as string } : {}
      },
      {
        $group: {
          _id: '$communityId',
          userCount: { $sum: 1 },
          totalPosts: { $sum: '$engagement.posts' },
          totalEngagement: {
            $sum: {
              $add: ['$engagement.posts', '$engagement.comments', '$engagement.shares']
            }
          },
          topInterests: { $push: '$intentSignals.interests' }
        }
      },
      { $sort: { userCount: -1 } }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get demographic insights
 * GET /api/insights/demographics
 */
app.get('/api/insights/demographics', async (req: Request, res: Response) => {
  try {
    const insights = await SocialIntent.aggregate([
      {
        $group: {
          _id: {
            pincode: '$demographics.pincode',
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: ['$demographics.age', 25] }, then: '18-24' },
                  { case: { $lt: ['$demographics.age', 35] }, then: '25-34' },
                  { case: { $lt: ['$demographics.age', 45] }, then: '35-44' },
                  { case: { $lt: ['$demographics.age', 55] }, then: '45-54' }
                ],
                default: '55+'
              }
            }
          },
          count: { $sum: 1 },
          avgEngagement: {
            $avg: {
              $add: ['$engagement.posts', '$engagement.comments', '$engagement.shares']
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD SERVING
// ============================================

/**
 * Serve community ad
 * POST /api/ad/serve
 */
app.post('/api/ad/serve', async (req: Request, res: Response) => {
  try {
    const { placementType, userId, context, campaignId } = req.body;

    // Get contextual ad based on placement and user interests
    const ad = await getCommunityAd(placementType, context);

    // Record impression
    await recordAdImpression(userId, campaignId, ad.id, placementType);

    res.json({
      success: true,
      ad: {
        id: ad.id,
        content: ad.content,
        type: ad.type,
        cta: ad.cta
      }
    });
  } catch (error) {
    logger.error('Ad serve error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Track ad click
 * POST /api/ad/click
 */
app.post('/api/ad/click', async (req: Request, res: Response) => {
  try {
    const { userId, adId, action } = req.body;

    await recordAdClick(userId, adId, action);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function calculateAudienceSize(criteria: any): Promise<number> {
  const query: any = {};

  if (criteria.societies) {
    query['demographics.society'] = { $in: criteria.societies };
  }
  if (criteria.pincodes) {
    query['demographics.pincode'] = { $in: criteria.pincodes };
  }
  if (criteria.interests) {
    query['intentSignals.interests'] = { $in: criteria.interests };
  }

  return SocialIntent.countDocuments(query);
}

async function sendToIntentAggregator(data: any) {
  try {
    await axios.post('http://localhost:4800/api/signals', data, {
      headers: { 'X-Internal-Token': CONFIG.INTERNAL_TOKEN }
    });
  } catch (error) {
    logger.error('Failed to send to intent aggregator:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function analyzeContentRelevance(content: any) {
  // Simple content analysis for ad relevance
  const keywords = content.text?.toLowerCase().split(' ') || [];
  const relevantTopics = keywords.filter(w => [
    'food', 'restaurant', 'shop', 'sale', 'discount', 'offer',
    'event', 'festival', 'celebration', 'service', 'home'
  ].includes(w));

  return {
    score: relevantTopics.length > 2 ? 0.8 : 0.3,
    topics: relevantTopics,
    sentiment: 'neutral'
  };
}

function getSocietySlots(location: string): string[] {
  const slots: Record<string, string[]> = {
    lobby: ['welcome_display', 'notice_board'],
    gate: ['entry_display', 'security_kiosk'],
    common_area: ['community_board', 'event_display'],
    elevator: ['elevator_screen'],
    parking: ['parking_display']
  };
  return slots[location] || ['community_display'];
}

async function getCommunityAd(placementType: string, context: any) {
  const ads: Record<string, any> = {
    society_lobby: {
      content: 'Community event this weekend - Join us!',
      type: 'image'
    },
    society_gate: {
      content: 'Local business spotlight - New cafe opening',
      type: 'image'
    },
    community_feed: {
      content: 'Recommended for you - Check out this offer',
      type: 'native'
    },
    event_page: {
      content: 'Don\'t miss - Early bird tickets available',
      type: 'image'
    }
  };

  return {
    id: `buzz_ad_${Date.now()}`,
    ...(ads[placementType] || { content: 'Discover local businesses', type: 'image' }),
    cta: 'Learn More'
  };
}

async function recordAdImpression(userId: string, campaignId: string, adId: string, placementType: string) {
  logger.info('BuzzLocal ad impression', { userId, campaignId, adId, placementType });
}

async function recordAdClick(userId: string, adId: string, action: string) {
  logger.info('BuzzLocal ad click', { userId, adId, action });
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 BuzzLocal Social Integration started on port ${PORT}`);
  logger.info(`📱 Connected to BuzzLocal API: ${CONFIG.BUZZLOCAL_API}`);

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_integration')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;