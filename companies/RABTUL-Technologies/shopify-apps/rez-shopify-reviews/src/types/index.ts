import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().optional(),
  shopifyProductId: z.string(),
  shopifyVariantId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  rating: z.number().min(1).max(5).int(),
  title: z.string().max(200).optional(),
  content: z.string().max(2000),
  images: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).default('pending'),
  replies: z.array(z.object({
    id: z.string(),
    authorName: z.string(),
    content: z.string(),
    createdAt: z.string()
  })).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type Review = z.infer<typeof ReviewSchema>;

export const ReviewSummarySchema = z.object({
  productId: z.string(),
  averageRating: z.number(),
  totalReviews: z.number(),
  ratingDistribution: z.object({
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number()
  }),
  withPhotos: z.number(),
  verifiedPurchases: z.number()
});
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

export const ReviewStatsSchema = z.object({
  productId: z.string(),
  avgRating: z.number(),
  totalReviews: z.number(),
  reviewsThisWeek: z.number(),
  reviewsThisMonth: z.number(),
  positiveSentiment: z.number(),
  negativeSentiment: z.number()
});
export type ReviewStats = z.infer<typeof ReviewStatsSchema>;
