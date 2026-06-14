import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR, KarmaFeedPost, KarmaState, KarmaEvent } from '../shared/models';
import { karmaConfig } from '../config/karma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/karma/feed
 * Public endpoint - Get lost items feed for karma app
 * Anyone can view (helps spread the word)
 */
router.get(
 '/feed',
 optionalAuth,
 asyncHandler(async (req: Request, res: Response) => {
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
   const mode = req.query.mode as string; // Optional filter by mode

   // Build query - get QRs that are in 'lost' mode and have active feed posts
   const query: unknown = {
     status: 'lost',
     'karma.feedPostActive': true,
   };

   if (mode) {
     query.mode = mode;
   }

   const skip = (page - 1) * limit;

   const [qrs, total] = await Promise.all([
     SafeQR.find(query)
       .select('shortcode qrId mode status profile stats karma createdAt lostModeActivatedAt')
       .sort({ lostModeActivatedAt: -1 })
       .skip(skip)
       .limit(limit)
       .lean(),
     SafeQR.countDocuments(query),
   ]);

   // Transform to feed post format
   const feedPosts = qrs.map((qr) => ({
     postId: `lost_${qr.shortcode}`,
     shortcode: qr.shortcode,
     mode: qr.mode,
     type: 'lost_item',
     title: getTitle(qr.mode, qr.profile),
     description: getDescription(qr.mode, qr.profile),
     photo: qr.profile?.photo || null,
     location: qr.profile?.location || null,
     reward: qr.karma?.reward || null,
     helperCount: qr.karma?.helperCount || 0,
     scanCount: qr.stats?.totalScans || 0,
     owner: {
       id: qr.ownerId,
       karmaLevel: 'Helper', // Would need to fetch from KarmaState
     },
     status: qr.status,
     createdAt: qr.lostModeActivatedAt || qr.createdAt,
     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
     distance: null, // Would calculate based on user's location
   }));

   res.json({
     success: true,
     data: {
       posts: feedPosts,
       pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit),
         hasMore: page * limit < total,
       },
     },
   });
 })
);

/**
 * GET /api/karma/feed/:shortcode
 * Get single lost item details
 */
router.get(
 '/feed/:shortcode',
 optionalAuth,
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);

   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   // Get full profile based on mode
   const profile = await getFullProfile(qr.mode, qr.profile);

   res.json({
     success: true,
     data: {
       postId: `lost_${qr.shortcode}`,
       shortcode: qr.shortcode,
       mode: qr.mode,
       type: 'lost_item',
       title: getTitle(qr.mode, qr.profile),
       description: getDescription(qr.mode, qr.profile),
       photo: qr.profile?.photo || null,
       profile: profile,
       location: qr.profile?.location || null,
       reward: qr.karma?.reward || null,
       helperCount: qr.karma?.helperCount || 0,
       scanCount: qr.stats?.totalScans || 0,
       status: qr.status,
       createdAt: qr.lostModeActivatedAt || qr.createdAt,
     },
   });
 })
);

/**
 * POST /api/karma/feed/:shortcode/report
 * Report sighting of lost item
 * User doesn't need to be authenticated but can earn karma if logged in
 */
router.post(
 '/feed/:shortcode/report',
 optionalAuth,
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { location, description, contactInfo } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);

   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.status !== 'lost') {
     throw createError('This item is not marked as lost', 400, 'NOT_LOST');
   }

   const sightingId = `sighting_${Date.now()}_${uuidv4().substring(0, 8)}`;

   // If user is logged in, award karma points
   let karmaEarned = 0;
   if (req.userId) {
     karmaEarned = karmaConfig.earned.confirmedSighting;

     // Update karma state
     let karmaState = await KarmaState.findOne({ userId: req.userId });

     if (!karmaState) {
       karmaState = new KarmaState({
         userId: req.userId,
         totalPoints: 0,
         helpCount: 0,
         level: 'Newbie',
         badge: '🟢',
       });
     }

     // Add points
     karmaState.totalPoints += karmaEarned;
     karmaState.helpCount += 1;

     // Update level
     const newLevel = getKarmaLevel(karmaState.totalPoints);
     karmaState.level = newLevel.name;
     karmaState.badge = newLevel.badge;
     karmaState.updatedAt = new Date();

     await karmaState.save();

     // Create karma event
     const event = new KarmaEvent({
       eventId: `event_${Date.now()}`,
       userId: req.userId,
       type: karmaConfig.eventTypes.SAFE_QR_SIGHTING_REPORT,
       points: karmaEarned,
       metadata: {
         shortcode: normalizedShortcode,
         mode: qr.mode,
         sightingId,
         location,
         description,
       },
     });
     await event.save();

     // Update QR helper count
     qr.karma.helperCount = (qr.karma.helperCount || 0) + 1;
     await qr.save();
   }

   res.json({
     success: true,
     data: {
       sightingId,
       message: req.userId
         ? `Thank you for your help! You earned ${karmaEarned} karma points.`
         : 'Thank you for your report! Log in to earn karma points.',
       karmaEarned,
     },
   });
 })
);

/**
 * GET /api/karma/feed/modes
 * Get available modes to filter
 */
router.get(
 '/feed/modes',
 asyncHandler(async (req: Request, res: Response) => {
   const modes = [
     { id: 'pet', name: 'Pets', icon: '🐕', count: 0 },
     { id: 'device', name: 'Devices', icon: '💻', count: 0 },
     { id: 'vehicle', name: 'Vehicles', icon: '🚗', count: 0 },
     { id: 'bicycle', name: 'Bicycles', icon: '🚲', count: 0 },
     { id: 'key', name: 'Keys', icon: '🔑', count: 0 },
     { id: 'luggage', name: 'Luggage', icon: '🧳', count: 0 },
     { id: 'child', name: 'Children', icon: '👶', count: 0 },
     { id: 'other', name: 'Other', icon: '📦', count: 0 },
   ];

   // Get counts
   const counts = await SafeQR.aggregate([
     { $match: { status: 'lost', 'karma.feedPostActive': true } },
     { $group: { _id: '$mode', count: { $sum: 1 } } },
   ]);

   const countMap = new Map(counts.map((c) => [c._id, c.count]));

   const modesWithCounts = modes.map((m) => ({
     ...m,
     count: countMap.get(m.id) || 0,
   }));

   res.json({
     success: true,
     data: modesWithCounts,
   });
 })
);

// Helper functions
function getTitle(mode: string, profile): string {
 switch (mode) {
   case 'pet':
     return `Lost ${profile?.species || 'Pet'}: ${profile?.name || 'Unknown'}`;
   case 'device':
     return `Lost ${profile?.deviceType || 'Device'}: ${profile?.brand || ''} ${profile?.model || ''}`;
   case 'vehicle':
     return `Lost Vehicle: ${profile?.plateDisplay || ''}`.trim();
   case 'bicycle':
     return `Lost Bicycle: ${profile?.name || 'Unknown'}`;
   case 'key':
     return 'Lost Keys';
   case 'luggage':
     return 'Lost Luggage';
   case 'child':
     return `Missing Child: ${profile?.name || 'Unknown'}`;
   default:
     return `Lost Item: ${profile?.name || 'Unknown'}`;
 }
}

function getDescription(mode: string, profile): string {
 switch (mode) {
   case 'pet':
     return profile?.description || `${profile?.breed || 'Pet'} - Last seen near ${profile?.lastSeenLocation || 'unknown location'}`;
   case 'device':
     return profile?.description || `Last used near ${profile?.lastSeenLocation || 'unknown location'}`;
   case 'child':
     return profile?.description || `Please help find this child. Contact authorities if seen.`;
   default:
     return profile?.description || 'Please help find this lost item.';
 }
}

async function getFullProfile(mode: string, profile): Promise<unknown> {
 // Return mode-specific profile fields
 switch (mode) {
   case 'pet':
     return {
       name: profile?.name,
       species: profile?.species,
       breed: profile?.breed,
       color: profile?.color,
       age: profile?.age,
       photo: profile?.photo,
       lastSeenLocation: profile?.lastSeenLocation,
       description: profile?.description,
       contactInstructions: profile?.contactInstructions,
     };
   case 'device':
     return {
       deviceType: profile?.deviceType,
       brand: profile?.brand,
       model: profile?.model,
       color: profile?.color,
       serialNumber: profile?.serialNumber ? '****' + profile.serialNumber.slice(-4) : null,
       lastSeenLocation: profile?.lastSeenLocation,
       description: profile?.description,
     };
   case 'medical':
     return {
       displayName: profile?.displayName,
       bloodType: profile?.bloodType,
       allergies: profile?.allergies,
       medicalConditions: profile?.medicalConditions,
       emergencyContact: profile?.emergencyContact,
     };
   case 'vehicle':
     return {
       vehicleType: profile?.vehicleType,
       make: profile?.make,
       model: profile?.model,
       color: profile?.color,
       plateDisplay: profile?.plateDisplay,
       lastSeenLocation: profile?.lastSeenLocation,
     };
   default:
     return profile;
 }
}

export default router;

/**
 * Get karma level based on total points
 */
function getKarmaLevel(totalPoints: number): { name: string; badge: string } {
  const levels = karmaConfig.levels;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalPoints >= levels[i].minPoints) {
      return { name: levels[i].name, badge: levels[i].badge };
    }
  }
  return { name: levels[0].name, badge: levels[0].badge };
}
