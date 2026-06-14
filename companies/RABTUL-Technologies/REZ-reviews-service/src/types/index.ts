import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().optional(),
  entityType: z.enum(['product', 'merchant', 'service', 'order']),
  entityId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5).int(),
  title: z.string().max(200).optional(),
  content: z.string().max(2000),
  images: z.array(z.string()).optional(),
  verified: z.boolean().default(false),
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),
  replies: z.array(z.object({ userId: z.string(), content: z.string(), createdAt: z.string() })).default([]),
  createdAt: z.string().optional()
});
export type Review = z.infer<typeof ReviewSchema>;
