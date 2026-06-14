/**
 * Tenant Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Tenant, ITenant, TenantType, TenantTier, TenantStatus } from '../models/tenant';

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface CreateTenantParams {
  type: TenantType;
  tier?: TenantTier;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  password?: string;

  // REZ Internal
  rezCompanyId?: string;
  rezProducts?: string[];

  // External
  businessType?: string;
  gstin?: string;
  address?: ITenant['address'];
}

export interface ApiKeyResponse {
  key: string;
  secret?: string;
  name: string;
  permissions: string[];
  createdAt: Date;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_RATE_LIMITS: Record<TenantTier, ITenant['rateLimits']> = {
  [TenantTier.REZ_TIER_0]: {
    requestsPerMinute: 10000,
    requestsPerHour: 500000,
    requestsPerDay: 10000000,
    campaignsPerMonth: -1,
    campaignsActive: -1,
    budgetMaxMonthly: -1,
    budgetMaxCampaign: -1,
  },
  [TenantTier.EXTERNAL_TIER_0]: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    campaignsPerMonth: 200,
    campaignsActive: 50,
    budgetMaxMonthly: -1,
    budgetMaxCampaign: -1,
  },
  [TenantTier.EXTERNAL_TIER_1]: {
    requestsPerMinute: 500,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    campaignsPerMonth: 50,
    campaignsActive: 20,
    budgetMaxMonthly: 10000000,
    budgetMaxCampaign: 500000,
  },
  [TenantTier.EXTERNAL_TIER_2]: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    campaignsPerMonth: 10,
    campaignsActive: 5,
    budgetMaxMonthly: 100000,
    budgetMaxCampaign: 25000,
  },
};

const DEFAULT_FEATURE_FLAGS: Record<TenantType, ITenant['featureFlags']> = {
  [TenantType.REZ_INTERNAL]: {
    canCreateCampaigns: true,
    canUseInternalInventory: true,
    canUseCrossPlatformTargeting: true,
    canUseAdvancedAnalytics: true,
    canUseAIMOptimization: true,
    canUseMultiTouchAttribution: true,
    canUseWalletAttribution: true,
    canUseRideAttribution: true,
    canUseCommerceAttribution: true,
  },
  [TenantType.EXTERNAL]: {
    canCreateCampaigns: true,
    canUseInternalInventory: false,
    canUseCrossPlatformTargeting: false,
    canUseAdvancedAnalytics: true,
    canUseAIMOptimization: true,
    canUseMultiTouchAttribution: true,
    canUseWalletAttribution: false,
    canUseRideAttribution: false,
    canUseCommerceAttribution: true,
  },
};

const DEFAULT_PRICING: Record<TenantType, ITenant['pricing']> = {
  [TenantType.REZ_INTERNAL]: {
    commissionRate: 0.10,
    minimumBudget: 0,
    coinRewardRate: 5,
    creditTerms: 'postpaid',
  },
  [TenantType.EXTERNAL]: {
    commissionRate: 0.15,
    minimumBudget: 500,
    coinRewardRate: 2,
    creditTerms: 'prepaid',
  },
};

// ============================================================================
// TENANT SERVICE
// ============================================================================

export class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(params: CreateTenantParams): Promise<ITenant> {
    // Check for existing tenant with same email
    const existing = await Tenant.findOne({ email: params.email.toLowerCase() });
    if (existing) {
      throw new Error('TENANT_EXISTS: Email already registered');
    }

    // Determine tier
    const tier = params.tier ||
      (params.type === TenantType.REZ_INTERNAL ? TenantTier.REZ_TIER_0 : TenantTier.EXTERNAL_TIER_1);

    // Generate tenant ID
    const tenantId = params.type === TenantType.REZ_INTERNAL
      ? `rez_${params.rezCompanyId || params.name.toLowerCase().replace(/\s+/g, '_')}`
      : `ext_${uuidv4().substring(0, 12)}`;

    // Hash password if provided
    let passwordHash: string | undefined;
    if (params.password) {
      passwordHash = await bcrypt.hash(params.password, 12);
    }

    // Create tenant
    const tenant = new Tenant({
      tenantId,
      tenantType: params.type,
      tenantTier: tier,
      status: TenantStatus.ACTIVE,

      name: params.name,
      companyName: params.companyName,
      email: params.email.toLowerCase(),
      phone: params.phone,
      website: params.website,
      address: params.address,

      // REZ Internal
      rezCompanyId: params.rezCompanyId,
      rezProducts: params.rezProducts,

      // External
      businessType: params.businessType,
      gstin: params.gstin,

      // Auth
      passwordHash,

      // Configuration
      rateLimits: DEFAULT_RATE_LIMITS[tier],
      featureFlags: DEFAULT_FEATURE_FLAGS[params.type],
      pricing: DEFAULT_PRICING[params.type],

      // Billing
      paymentMethod: params.type === TenantType.REZ_INTERNAL ? 'postpaid' : 'prepaid',

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tenant.save();
    return tenant;
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<ITenant | null> {
    return Tenant.findOne({ tenantId });
  }

  /**
   * Get tenant by email
   */
  async getTenantByEmail(email: string): Promise<ITenant | null> {
    return Tenant.findOne({ email: email.toLowerCase() });
  }

  /**
   * Authenticate tenant with email/password
   */
  async authenticate(email: string, password: string): Promise<{ tenant: ITenant; token: string }> {
    const tenant = await Tenant.findOne({ email: email.toLowerCase() });

    if (!tenant) {
      throw new Error('AUTH_FAILED: Invalid credentials');
    }

    if (!tenant.passwordHash) {
      throw new Error('AUTH_FAILED: No password set');
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new Error(`AUTH_FAILED: Account ${tenant.status}`);
    }

    const isValid = await bcrypt.compare(password, tenant.passwordHash);
    if (!isValid) {
      throw new Error('AUTH_FAILED: Invalid credentials');
    }

    // Generate JWT
    const token = this.generateToken(tenant);

    // Update last activity
    tenant.lastActivityAt = new Date();
    await tenant.save();

    return { tenant, token };
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<ITenant | null> {
    const tenant = await Tenant.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true,
      status: TenantStatus.ACTIVE,
    });

    if (!tenant) {
      return null;
    }

    // Update last used
    const keyIndex = tenant.apiKeys.findIndex(k => k.key === apiKey);
    if (keyIndex !== -1) {
      tenant.apiKeys[keyIndex].lastUsedAt = new Date();
      await tenant.save();
    }

    return tenant;
  }

  /**
   * Create API key for tenant
   */
  async createApiKey(
    tenantId: string,
    name: string,
    permissions: string[] = ['read', 'write']
  ): Promise<ApiKeyResponse> {
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    const key = `adb_${uuidv4().replace(/-/g, '')}`;
    const secret = `ads_${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    const apiKeyObj = {
      key,
      name,
      permissions,
      isActive: true,
      createdAt: new Date(),
    };

    tenant.apiKeys.push(apiKeyObj);
    await tenant.save();

    return {
      key,
      secret,
      name,
      permissions,
      createdAt: apiKeyObj.createdAt,
    };
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(tenantId: string, keyName: string): Promise<void> {
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    tenant.apiKeys = tenant.apiKeys.filter(k => k.name !== keyName);
    await tenant.save();
  }

  /**
   * Get tenant context (for middleware)
   */
  async getTenantContext(tenant: ITenant) {
    return {
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
      tenantTier: tenant.tenantTier,
      tenantName: tenant.name,
      companyName: tenant.companyName,
      allowedInventory: this.getAllowedInventory(tenant),
      rateLimits: tenant.rateLimits,
      features: tenant.featureFlags,
      pricing: tenant.pricing,
      metadata: tenant.metadata,
      isActive: tenant.status === TenantStatus.ACTIVE,
      createdAt: tenant.createdAt,
      lastActivityAt: tenant.lastActivityAt || tenant.createdAt,
    };
  }

  /**
   * Get allowed inventory based on tenant type
   */
  private getAllowedInventory(tenant: ITenant): string[] {
    // All tenants get marketplace inventory
    const marketplace = [
      'dooh_public',
      'qr_public',
      'creator_public',
      'whatsapp_public',
      'event_public',
      'buzzlocal_public',
      'society_public',
      'hospitality_public',
      'retail_public',
    ];

    // Internal tenants also get internal inventory
    if (tenant.tenantType === TenantType.REZ_INTERNAL) {
      const internal = [
        'rez_app_home_feed',
        'rez_app_recommendation',
        'rez_ride_inapp',
        'rez_ride_external',
        'airzy_traveler',
        'airzy_lounge',
        'stayown_guest',
        'stayown_lobby',
        'corpperks_employee',
        'buzzlocal_community',
        'reznow_merchant',
        'risacare_health',
        'karma_loyalty',
        'rez_wallet_placement',
      ];
      return [...internal, ...marketplace];
    }

    return marketplace;
  }

  /**
   * Generate JWT token
   */
  private generateToken(tenant: ITenant): string {
    const payload = {
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
      tenantTier: tenant.tenantTier,
      email: tenant.email,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: '7d',
    });
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<Pick<ITenant, 'name' | 'companyName' | 'phone' | 'website' | 'address' | 'billingEmail'>>
  ): Promise<ITenant | null> {
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    );
    return tenant;
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string): Promise<void> {
    await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { status: TenantStatus.SUSPENDED, updatedAt: new Date() } }
    );
  }

  /**
   * Reactivate tenant
   */
  async reactivateTenant(tenantId: string): Promise<void> {
    await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { status: TenantStatus.ACTIVE, updatedAt: new Date() } }
    );
  }

  /**
   * List tenants (admin only)
   */
  async listTenants(options: {
    type?: TenantType;
    status?: TenantStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ tenants: ITenant[]; total: number; page: number; limit: number }> {
    const { type, status, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = {};
    if (type) query.tenantType = type;
    if (status) query.status = status;

    const [tenants, total] = await Promise.all([
      Tenant.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      Tenant.countDocuments(query),
    ]);

    return { tenants, total, page, limit };
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [tenants, byTypeAgg, byStatusAgg] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.aggregate([{ $group: { _id: '$tenantType', count: { $sum: 1 } } }]),
      Tenant.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const byType: Record<string, number> = {};
    byTypeAgg.forEach(a => { byType[a._id] = a.count; });

    const byStatus: Record<string, number> = {};
    byStatusAgg.forEach(a => { byStatus[a._id] = a.count; });

    return { total: tenants, byType, byStatus };
  }
}

// Export singleton
export const tenantService = new TenantService();
