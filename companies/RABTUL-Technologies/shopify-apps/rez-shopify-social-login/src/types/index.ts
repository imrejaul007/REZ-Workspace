import { z } from 'zod';

export const SocialProviderSchema = z.enum(['google', 'facebook', 'apple', 'instagram', 'twitter', 'linkedin']);
export type SocialProvider = z.infer<typeof SocialProviderSchema>;

export const SocialLinkSchema = z.object({
  id: z.string().optional(),
  shopifyCustomerId: z.string(),
  provider: SocialProviderSchema,
  providerId: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  profilePicture: z.string().url().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  scope: z.array(z.string()).default([]),
  isPrimary: z.boolean().default(false),
  linkedAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  metadata: z.record(z.any()).default({})
});
export type SocialLink = z.infer<typeof SocialLinkSchema>;

export const SocialAuthRequestSchema = z.object({
  provider: SocialProviderSchema,
  authorizationCode: z.string().optional(),
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
  redirectUri: z.string().url().optional(),
  state: z.string().optional()
});
export type SocialAuthRequest = z.infer<typeof SocialAuthRequestSchema>;

export const SocialAuthResponseSchema = z.object({
  success: z.boolean(),
  customer: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  }).optional(),
  token: z.string().optional(),
  isNewCustomer: z.boolean().default(false),
  linkedProviders: z.array(SocialProviderSchema).default([]),
  error: z.string().optional()
});
export type SocialAuthResponse = z.infer<typeof SocialAuthResponseSchema>;

export const SocialLoginStatsSchema = z.object({
  totalLogins: z.number(),
  newRegistrations: z.number(),
  byProvider: z.record(z.number()),
  successRate: z.number(),
  avgSessionDuration: z.number()
});
export type SocialLoginStats = z.infer<typeof SocialLoginStatsSchema>;
