import { z } from 'zod';

// Create invite request schema
export const createInviteSchema = z.object({
  publisherId: z.string().min(1, 'Publisher ID is required'),
  advertiserId: z.string().optional(),
  dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed'], {
    errorMap: () => ({ message: 'Deal type must be preferred_deal, private_marketplace, or programmatic_guaranteed' }),
  }),
  dealDetails: z.object({
    name: z.string().min(1, 'Deal name is required').max(255),
    floorPrice: z.number().positive('Floor price must be positive'),
    currency: z.string().length(3).default('USD'),
    targeting: z.object({
      geo: z.array(z.string()).optional(),
      deviceTypes: z.array(z.string()).optional(),
      contentCategories: z.array(z.string()).optional(),
    }).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine(
    (data) => data.endDate > data.startDate,
    { message: 'End date must be after start date', path: ['endDate'] }
  ),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

// Update invite status schema
export const updateInviteStatusSchema = z.object({
  status: z.enum(['accepted', 'declined'], {
    errorMap: () => ({ message: 'Status must be accepted or declined' }),
  }),
  message: z.string().max(1000).optional(),
});

// List invites query schema
export const listInvitesQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).optional(),
  publisherId: z.string().optional(),
  advertiserId: z.string().optional(),
  dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// List deals query schema
export const listDealsQuerySchema = z.object({
  publisherId: z.string().optional(),
  advertiserId: z.string().optional(),
  dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Invite ID parameter schema
export const inviteIdParamSchema = z.object({
  id: z.string().min(1, 'Invite ID is required'),
});

// JWT token schema
export const jwtPayloadSchema = z.object({
  userId: z.string(),
  role: z.enum(['publisher', 'advertiser', 'admin']),
  companyId: z.string(),
  companyType: z.enum(['publisher', 'advertiser']),
  iat: z.number().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateInviteStatusInput = z.infer<typeof updateInviteStatusSchema>;
export type ListInvitesQueryInput = z.infer<typeof listInvitesQuerySchema>;
export type ListDealsQueryInput = z.infer<typeof listDealsQuerySchema>;
export type JWTPayloadInput = z.infer<typeof jwtPayloadSchema>;