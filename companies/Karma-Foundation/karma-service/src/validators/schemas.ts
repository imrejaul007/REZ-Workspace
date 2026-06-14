/**
 * Zod Validation Schemas for Karma Service
 * All API input validation using Zod
 */
import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// VERIFICATION SCHEMAS
// ============================================================================

export const GPSCoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const CheckInSchema = z.object({
  userId: ObjectIdSchema,
  eventId: ObjectIdSchema,
  mode: z.enum(['qr', 'gps']),
  qrCode: z.string().optional(),
  gpsCoords: GPSCoordsSchema.optional(),
}).refine(
  (data) => data.mode !== 'qr' || (data.qrCode && data.qrCode.length > 0),
  { message: 'qrCode is required when mode is qr' }
);

export const CheckOutSchema = CheckInSchema;

// ============================================================================
// KARMA SCHEMAS
// ============================================================================

export const KarmaEarnSchema = z.object({
  userId: ObjectIdSchema,
  karmaAmount: z.number().positive().max(10000),
  source: z.enum(['event', 'donation', 'micro_action', 'mission', 'bonus']),
  eventId: ObjectIdSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const KarmaHistoryQuerySchema = PaginationSchema.extend({
  userId: ObjectIdSchema.optional(),
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const CreateEventSchema = z.object({
  merchantEventId: ObjectIdSchema.optional(),
  ngoId: ObjectIdSchema.optional(),
  category: z.enum(['environment', 'food', 'health', 'education', 'community']),
  impactUnit: z.string().optional(),
  impactMultiplier: z.number().min(0).max(10).default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  expectedDurationHours: z.number().positive().max(168),
  baseKarmaPerHour: z.number().positive().max(1000),
  maxKarmaPerEvent: z.number().positive().max(10000),
  gpsRadius: z.number().positive().max(1000).default(100),
  maxVolunteers: z.number().int().positive().max(10000).default(50),
});

export const EventQuerySchema = PaginationSchema.extend({
  category: z.enum(['environment', 'food', 'health', 'education', 'community']).optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(100).optional(),
});

// ============================================================================
// BATCH SCHEMAS
// ============================================================================

export const BatchExecuteSchema = z.object({
  batchId: ObjectIdSchema,
  adminId: ObjectIdSchema,
});

export const BatchQuerySchema = PaginationSchema.extend({
  status: z.enum(['DRAFT', 'READY', 'PROCESSING', 'EXECUTED', 'PARTIAL', 'PAUSED', 'FAILED']).optional(),
});

export const BatchPauseSchema = z.object({
  reason: z.string().min(1).max(500).default('No reason provided'),
});

// ============================================================================
// CSR SCHEMAS
// ============================================================================

export const CreatePartnerSchema = z.object({
  companyName: z.string().min(1).max(200),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  creditsBudget: z.number().nonnegative().max(1_000_000_000),
});

export const AllocateKarmaSchema = z.object({
  partnerId: ObjectIdSchema,
  recipientUserId: ObjectIdSchema,
  amount: z.number().positive().max(100_000),
  eventId: ObjectIdSchema.optional(),
});

export const CSRReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
});

export const AddEmployeeSchema = z.object({
  employeeUserId: ObjectIdSchema,
});

// ============================================================================
// COMMUNITY SCHEMAS
// ============================================================================

export const CommunitySlugSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

export const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

export const CommunityFeedSchema = PaginationSchema.extend({
  slug: z.string(),
});

// ============================================================================
// LEADERBOARD SCHEMAS
// ============================================================================

export const LeaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'city', 'cause']).default('global'),
  period: z.enum(['all-time', 'monthly', 'weekly']).default('all-time'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// MICRO-ACTIONS SCHEMAS
// ============================================================================

export const MicroActionClaimSchema = z.object({
  actionKey: z.string().min(1).max(100),
});

export const MicroActionTriggerSchema = z.object({
  trigger: z.enum(['app_open', 'profile_update', 'referral_credited', 'event_completed', 'share_click']).optional(),
});

// ============================================================================
// CSR POOL SCHEMAS
// ============================================================================

export const CSRPoolSchema = z.object({
  name: z.string().min(1).max(200),
  corporatePartnerId: ObjectIdSchema,
  totalCoins: z.number().nonnegative().max(1_000_000_000),
  allocatedCoins: z.number().nonnegative().max(1_000_000_000),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CheckInInput = z.infer<typeof CheckInSchema>;
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
export type KarmaEarnInput = z.infer<typeof KarmaEarnSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>;
export type AllocateKarmaInput = z.infer<typeof AllocateKarmaSchema>;
export type CommunitySlugInput = z.infer<typeof CommunitySlugSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type LeaderboardQueryInput = z.infer<typeof LeaderboardQuerySchema>;
export type MicroActionClaimInput = z.infer<typeof MicroActionClaimSchema>;
