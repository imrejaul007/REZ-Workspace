import { z } from 'zod';

// ============================================================================
// INVESTOR TWIN SCHEMAS
// ============================================================================

// Enums
export const InvestorTypeSchema = z.enum(['individual', 'institutional', 'corporate', 'family_office']);
export const RiskRatingSchema = z.enum(['conservative', 'moderate', 'aggressive']);
export const TimeHorizonSchema = z.enum(['short_term', 'medium_term', 'long_term']);
export const LiquidityNeedsSchema = z.enum(['high', 'medium', 'low']);
export const KYCStatusSchema = z.enum(['pending', 'verified', 'expired', 'rejected']);
export const AMLCheckSchema = z.enum(['passed', 'pending', 'failed']);

// ============================================================================
// NAME SCHEMA
// ============================================================================

export const NameSchema = z.object({
  first: z.string().min(1, 'First name is required'),
  last: z.string().min(1, 'Last name is required'),
  middle: z.string().optional(),
});

export type Name = z.infer<typeof NameSchema>;

// ============================================================================
// PROFILE SCHEMA
// ============================================================================

export const ProfileSchema = z.object({
  name: NameSchema,
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  investor_type: InvestorTypeSchema.default('individual'),
  accredited: z.boolean().default(false),
  tax_id: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// ============================================================================
// KYC SCHEMA
// ============================================================================

export const KYCSchema = z.object({
  status: KYCStatusSchema.default('pending'),
  verification_date: z.string().datetime().optional(),
  risk_rating: RiskRatingSchema.default('moderate'),
  aml_check: AMLCheckSchema.default('pending'),
});

export type KYC = z.infer<typeof KYCSchema>;

// ============================================================================
// PREFERENCES SCHEMA
// ============================================================================

export const PreferencesSchema = z.object({
  investment_goals: z.array(z.string()).default([]),
  risk_tolerance: RiskRatingSchema.default('moderate'),
  time_horizon: TimeHorizonSchema.default('medium_term'),
  liquidity_needs: LiquidityNeedsSchema.default('medium'),
  ethical_screening: z.array(z.string()).default([]),
  preferred_asset_classes: z.array(z.string()).default([]),
  geographic_focus: z.array(z.string()).default([]),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

// ============================================================================
// FINANCIAL PROFILE SCHEMA
// ============================================================================

export const FinancialProfileSchema = z.object({
  net_worth: z.number().min(0).default(0),
  liquid_net_worth: z.number().min(0).default(0),
  annual_income: z.number().min(0).default(0),
  investment_capacity: z.number().min(0).default(0),
  debt_obligations: z.number().min(0).default(0),
});

export type FinancialProfile = z.infer<typeof FinancialProfileSchema>;

// ============================================================================
// CONNECTED ACCOUNT SCHEMA
// ============================================================================

export const ConnectedAccountSchema = z.object({
  account_id: z.string().min(1),
  institution: z.string().min(1),
  account_type: z.string().min(1),
  last_synced: z.string().datetime().optional(),
});

export type ConnectedAccount = z.infer<typeof ConnectedAccountSchema>;

// ============================================================================
// ACTIVITY SCHEMA
// ============================================================================

export const ActivitySchema = z.object({
  last_login: z.string().datetime().optional(),
  last_trade: z.string().datetime().optional(),
  total_trades: z.number().int().min(0).default(0),
  avg_session_duration: z.number().min(0).default(0),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ============================================================================
// PERMISSIONS SCHEMA
// ============================================================================

export const PermissionsSchema = z.object({
  can_trade: z.boolean().default(true),
  can_leverage: z.boolean().default(false),
  can_short: z.boolean().default(false),
  max_position_size: z.number().min(0).default(100000),
  allowed_strategies: z.array(z.string()).default([]),
});

export type Permissions = z.infer<typeof PermissionsSchema>;

// ============================================================================
// INVESTOR TWIN FULL SCHEMA
// ============================================================================

export const InvestorTwinSchema = z.object({
  investor_id: z.string().min(1, 'Investor ID is required'),
  twin_id: z.string().optional(),
  profile: ProfileSchema,
  kyc: KYCSchema.default({}),
  preferences: PreferencesSchema.default({}),
  financial_profile: FinancialProfileSchema.default({}),
  portfolios: z.array(z.string()).default([]),
  connected_accounts: z.array(ConnectedAccountSchema).default([]),
  activity: ActivitySchema.default({}),
  permissions: PermissionsSchema.default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type InvestorTwin = z.infer<typeof InvestorTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateInvestorTwinRequestSchema = InvestorTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
  portfolios: true,
  activity: true,
}).extend({
  investor_id: z.string().min(1),
});

export const UpdateInvestorTwinRequestSchema = z.object({
  profile: ProfileSchema.partial().optional(),
  kyc: KYCSchema.partial().optional(),
  preferences: PreferencesSchema.partial().optional(),
  financial_profile: FinancialProfileSchema.partial().optional(),
  permissions: PermissionsSchema.partial().optional(),
});

export const UpdatePreferencesRequestSchema = z.object({
  preferences: PreferencesSchema,
  merge: z.boolean().default(true),
});

export const UpdateKYCRequestSchema = z.object({
  status: KYCStatusSchema.optional(),
  risk_rating: RiskRatingSchema.optional(),
  aml_check: AMLCheckSchema.optional(),
});

export const LinkAccountRequestSchema = z.object({
  account_id: z.string().min(1),
  institution: z.string().min(1),
  account_type: z.string().min(1),
});

export const AddPortfolioRequestSchema = z.object({
  portfolio_id: z.string().min(1),
});

// API Response schemas
export const InvestorTwinResponseSchema = InvestorTwinSchema;
export const InvestorTwinListResponseSchema = z.object({
  twins: z.array(InvestorTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreateInvestorTwinRequest = z.infer<typeof CreateInvestorTwinRequestSchema>;
export type UpdateInvestorTwinRequest = z.infer<typeof UpdateInvestorTwinRequestSchema>;
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
export type UpdateKYCRequest = z.infer<typeof UpdateKYCRequestSchema>;
export type LinkAccountRequest = z.infer<typeof LinkAccountRequestSchema>;
export type AddPortfolioRequest = z.infer<typeof AddPortfolioRequestSchema>;
export type InvestorTwinResponse = z.infer<typeof InvestorTwinSchema>;
export type InvestorTwinListResponse = z.infer<typeof InvestorTwinListResponseSchema>;
