import logger from './utils/logger';

/**
 * REZ Real-Time Profile Service
 *
 * Ultra-fast profile serving (< 50ms)
 *
 * Purpose:
 * - Sub-50ms profile retrieval for feeds, QR, ads, recommendations, DOOH
 * - Real-time updates without cache invalidation
 * - Horizontal scaling with consistent hashing
 * - TTL-based automatic expiration
 *
 * This becomes the USER PROFILE CACHE LAYER
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  userId: string;

  // Identity
  identity: {
    phone?: string;
    email?: string;
    name?: string;
    avatar?: string;
    verified: boolean;
    createdAt: string;
  };

  // Commerce
  commerce: {
    tier: 'new' | 'standard' | 'silver' | 'gold' | 'platinum';
    totalOrders: number;
    totalSpend: number;
    avgOrderValue: number;
    lastOrderAt?: string;
    favoriteCategories: string[];
    preferredPriceRange: { min: number; max: number };
  };

  // Loyalty
  loyalty: {
    pointsBalance: number;
    pointsLifetime: number;
    coinsBalance: number;
    cashbackEarned: number;
    referralCount: number;
  };

  // Engagement
  engagement: {
    appOpenFrequency: number;    // Per week
    avgSessionDuration: number;  // Seconds
    notificationOpenRate: number;
    lastActiveAt: string;
    pushEnabled: boolean;
    emailVerified: boolean;
  };

  // Location
  location: {
    homeCity?: string;
    homeLocation?: { lat: number; lng: number };
    workCity?: string;
    workLocation?: { lat: number; lng: number };
    currentLocation?: { lat: number; lng: number };
  };

  // Behavioral
  behavioral: {
    diningFrequency: number;
    premiumAffinity: number;      // 0-1
    discountSensitivity: number;  // 0-1
    wellnessAffinity: number;
    nightlifeScore: number;
    travelAffinity: number;
  };

  // Predictive
  predictive: {
    churnRisk: number;           // 0-1
    purchaseLikelihood: number;  // 0-1
    engagementScore: number;     // 0-100
    ltvTier: 'low' | 'medium' | 'high' | 'vip';
    npsScore?: number;
  };

  // Real-time signals
  signals: {
    currentIntent?: string;
    intentConfidence: number;
    activeCart?: { merchantId: string; value: number; age: number };
    recentSearches: string[];
    recentViews: { entityId: string; type: string; timestamp: string }[];
  };

  // Metadata
  version: string;
  lastUpdated: string;
  source: 'cache' | 'database' | 'computed';
}

export interface MerchantProfile {
  merchantId: string;

  identity: {
    name: string;
    logo?: string;
    category: string;
    subcategory?: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
  };

  commerce: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgDeliveryTime: number;    // Minutes
    fulfillmentRate: number;     // 0-1
    refundRate: number;          // 0-1
  };

  engagement: {
    followerCount: number;
    saveCount: number;
    shareCount: number;
    viewCount: number;
  };

  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
    serviceRadius: number;      // KM
    zones: string[];
  };

  operations: {
    openTime: string;
    closeTime: string;
    isOpen: boolean;
    minOrderValue: number;
    deliveryFee: number;
    avgPrepTime: number;
  };

  // Predictive
  predictive: {
    popularityScore: number;
    growthRate: number;
    riskScore: number;
    qualityScore: number;
  };

  version: string;
  lastUpdated: string;
}

export interface SegmentProfile {
  segmentId: string;
  name: string;
  description: string;

  criteria: {
    conditions: {
      field: string;
      operator: string;
      value;
    }[];
    logic: 'AND' | 'OR';
  };

  statistics: {
    memberCount: number;
    avgOrderValue: number;
    avgFrequency: number;
    topCategories: string[];
    topMerchants: string[];
  };

  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isActive: boolean;
  };
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hitCount: number;
  lastHit: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  totalKeys: number;
}

class RealtimeCache {
  private userCache: Map<string, CacheEntry<UserProfile>> = new Map();
  private merchantCache: Map<string, CacheEntry<MerchantProfile>> = new Map();
  private segmentCache: Map<string, CacheEntry<SegmentProfile[]>> = new Map();

  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    totalKeys: 0
  };

  // Default TTLs in milliseconds
  private readonly DEFAULT_USER_TTL = 5 * 60 * 1000;      // 5 minutes
  private readonly DEFAULT_MERCHANT_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly DEFAULT_SEGMENT_TTL = 60 * 1000;        // 1 minute

  // ============================================
  // User Profile Operations
  // ============================================

  setUser(userId: string, profile: UserProfile, ttlMs?: number): void {
    const entry: CacheEntry<UserProfile> = {
      data: profile,
      expiresAt: Date.now() + (ttlMs || this.DEFAULT_USER_TTL),
      hitCount: 0,
      lastHit: new Date().toISOString()
    };

    this.userCache.set(userId, entry);
    this.stats.sets++;
    this.stats.totalKeys = this.userCache.size + this.merchantCache.size + this.segmentCache.size;
  }

  getUser(userId: string): UserProfile | null {
    const entry = this.userCache.get(userId);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.userCache.delete(userId);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    // Update hit stats
    entry.hitCount++;
    entry.lastHit = new Date().toISOString();
    this.stats.hits++;

    return entry.data;
  }

  deleteUser(userId: string): boolean {
    return this.userCache.delete(userId);
  }

  updateUser(userId: string, updates: Partial<UserProfile>): boolean {
    const existing = this.getUser(userId);
    if (!existing) return false;

    const updated: UserProfile = {
      ...existing,
      ...updates,
      version: this.incrementVersion(existing.version),
      lastUpdated: new Date().toISOString(),
      source: 'cache'
    };

    this.setUser(userId, updated);
    return true;
  }

  // Real-time signal updates (without full profile refresh)
  updateUserSignal(userId: string, signal: Partial<UserProfile['signals']>): boolean {
    const existing = this.getUser(userId);
    if (!existing) return false;

    existing.signals = { ...existing.signals, ...signal };
    existing.lastUpdated = new Date().toISOString();

    this.setUser(userId, existing);
    return true;
  }

  // ============================================
  // Merchant Profile Operations
  // ============================================

  setMerchant(merchantId: string, profile: MerchantProfile, ttlMs?: number): void {
    const entry: CacheEntry<MerchantProfile> = {
      data: profile,
      expiresAt: Date.now() + (ttlMs || this.DEFAULT_MERCHANT_TTL),
      hitCount: 0,
      lastHit: new Date().toISOString()
    };

    this.merchantCache.set(merchantId, entry);
    this.stats.sets++;
  }

  getMerchant(merchantId: string): MerchantProfile | null {
    const entry = this.merchantCache.get(merchantId);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.merchantCache.delete(merchantId);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    entry.hitCount++;
    entry.lastHit = new Date().toISOString();
    this.stats.hits++;

    return entry.data;
  }

  deleteMerchant(merchantId: string): boolean {
    return this.merchantCache.delete(merchantId);
  }

  // ============================================
  // Segment Operations
  // ============================================

  setSegments(segmentId: string, segments: SegmentProfile[], ttlMs?: number): void {
    const entry: CacheEntry<SegmentProfile[]> = {
      data: segments,
      expiresAt: Date.now() + (ttlMs || this.DEFAULT_SEGMENT_TTL),
      hitCount: 0,
      lastHit: new Date().toISOString()
    };

    this.segmentCache.set(segmentId, entry);
    this.stats.sets++;
  }

  getSegments(segmentId: string): SegmentProfile[] | null {
    const entry = this.segmentCache.get(segmentId);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.segmentCache.delete(segmentId);
      this.stats.misses++;
      return null;
    }

    entry.hitCount++;
    entry.lastHit = new Date().toISOString();
    this.stats.hits++;

    return entry.data;
  }

  // ============================================
  // Bulk Operations
  // ============================================

  getUsers(userIds: string[]): Map<string, UserProfile | null> {
    const results = new Map<string, UserProfile | null>();
    for (const id of userIds) {
      results.set(id, this.getUser(id));
    }
    return results;
  }

  getMerchants(merchantIds: string[]): Map<string, MerchantProfile | null> {
    const results = new Map<string, MerchantProfile | null>();
    for (const id of merchantIds) {
      results.set(id, this.getMerchant(id));
    }
    return results;
  }

  // ============================================
  // Maintenance
  // ============================================

  evictExpired(): number {
    let evicted = 0;
    const now = Date.now();

    for (const [key, entry] of this.userCache) {
      if (now > entry.expiresAt) {
        this.userCache.delete(key);
        evicted++;
      }
    }

    for (const [key, entry] of this.merchantCache) {
      if (now > entry.expiresAt) {
        this.merchantCache.delete(key);
        evicted++;
      }
    }

    for (const [key, entry] of this.segmentCache) {
      if (now > entry.expiresAt) {
        this.segmentCache.delete(key);
        evicted++;
      }
    }

    this.stats.evictions += evicted;
    this.stats.totalKeys = this.userCache.size + this.merchantCache.size + this.segmentCache.size;

    return evicted;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      totalKeys: this.userCache.size + this.merchantCache.size + this.segmentCache.size
    };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  clear(): void {
    this.userCache.clear();
    this.merchantCache.clear();
    this.segmentCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalKeys: 0
    };
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
}

// ============================================================================
// Real-Time Profile Service
// ============================================================================

class RealtimeProfileService {
  private cache: RealtimeCache;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new RealtimeCache();
    this.startMaintenance();
  }

  private startMaintenance(): void {
    // Evict expired entries every 30 seconds
    this.maintenanceInterval = setInterval(() => {
      this.cache.evictExpired();
    }, 30000);
  }

  // ============================================
  // User Profile API
  // ============================================

  /**
   * Get user profile (cache-first, < 50ms)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const startTime = Date.now();

    // Try cache first
    let profile = this.cache.getUser(userId);

    if (!profile) {
      // In production: fetch from database
      profile = await this.fetchUserFromDatabase(userId);

      if (profile) {
        this.cache.setUser(userId, profile);
      }
    }

    const latency = Date.now() - startTime;

    if (latency > 50) {
      logger.warn(`[ProfileService] Slow profile fetch: ${latency}ms for user ${userId}`);
    }

    return profile;
  }

  /**
   * Get multiple user profiles
   */
  async getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile | null>> {
    return this.cache.getUsers(userIds);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const success = this.cache.updateUser(userId, updates);

    if (success) {
      return this.cache.getUser(userId);
    }

    // Fetch and update
    let profile = await this.fetchUserFromDatabase(userId);
    if (!profile) return null;

    profile = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this.cache.setUser(userId, profile);

    // In production: persist to database
    await this.persistUserToDatabase(userId, profile);

    return profile;
  }

  /**
   * Update real-time signal (lightweight update)
   */
  async updateUserSignal(userId: string, signal: Partial<UserProfile['signals']>): Promise<boolean> {
    return this.cache.updateUserSignal(userId, signal);
  }

  /**
   * Invalidate user profile cache
   */
  async invalidateUser(userId: string): Promise<void> {
    this.cache.deleteUser(userId);
  }

  // ============================================
  // Merchant Profile API
  // ============================================

  /**
   * Get merchant profile (cache-first)
   */
  async getMerchantProfile(merchantId: string): Promise<MerchantProfile | null> {
    let profile = this.cache.getMerchant(merchantId);

    if (!profile) {
      profile = await this.fetchMerchantFromDatabase(merchantId);

      if (profile) {
        this.cache.setMerchant(merchantId, profile);
      }
    }

    return profile;
  }

  /**
   * Get multiple merchant profiles
   */
  async getMerchantProfiles(merchantIds: string[]): Promise<Map<string, MerchantProfile | null>> {
    return this.cache.getMerchants(merchantIds);
  }

  /**
   * Update merchant profile
   */
  async updateMerchantProfile(merchantId: string, updates: Partial<MerchantProfile>): Promise<MerchantProfile | null> {
    let profile = await this.fetchMerchantFromDatabase(merchantId);
    if (!profile) return null;

    profile = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this.cache.setMerchant(merchantId, profile);
    return profile;
  }

  // ============================================
  // Segment API
  // ============================================

  /**
   * Get user segments
   */
  async getUserSegments(userId: string): Promise<SegmentProfile[]> {
    // In production: compute segments based on user profile
    const profile = await this.getUserProfile(userId);
    if (!profile) return [];

    // Compute segments based on profile
    const segments: SegmentProfile[] = [];

    // Tier segment
    if (profile.commerce.tier !== 'new') {
      segments.push({
        segmentId: `tier_${profile.commerce.tier}`,
        name: `${profile.commerce.tier} Members`,
        description: `${profile.commerce.tier} tier customers`,
        criteria: {
          conditions: [{ field: 'commerce.tier', operator: 'eq', value: profile.commerce.tier }],
          logic: 'AND'
        },
        statistics: {
          memberCount: 1000, // Would be computed
          avgOrderValue: profile.commerce.avgOrderValue,
          avgFrequency: profile.engagement.appOpenFrequency,
          topCategories: profile.commerce.favoriteCategories,
          topMerchants: []
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          isActive: true
        }
      });
    }

    // Churn risk segment
    if (profile.predictive.churnRisk > 0.6) {
      segments.push({
        segmentId: 'churn_risk_high',
        name: 'High Churn Risk',
        description: 'Users at high risk of churning',
        criteria: {
          conditions: [{ field: 'predictive.churnRisk', operator: 'gte', value: 0.6 }],
          logic: 'AND'
        },
        statistics: {
          memberCount: 500,
          avgOrderValue: profile.commerce.avgOrderValue,
          avgFrequency: 1.5,
          topCategories: [],
          topMerchants: []
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          isActive: true
        }
      });
    }

    return segments;
  }

  // ============================================
  // Recommendations (using profile data)
  // ============================================

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(userId: string, slot: string, count = 10): Promise<{
    recommendations: { id: string; type: string; score: number; reason: string }[];
    latencyMs: number;
  }> {
    const startTime = Date.now();
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return { recommendations: [], latencyMs: Date.now() - startTime };
    }

    // Generate recommendations based on profile
    const recommendations: { id: string; type: string; score: number; reason: string }[] = [];

    // Category-based recommendations
    for (const category of profile.commerce.favoriteCategories.slice(0, 5)) {
      recommendations.push({
        id: `cat_${category}`,
        type: 'category',
        score: 0.9,
        reason: `Favorite category: ${category}`
      });
    }

    // Price-based recommendations
    if (profile.commerce.preferredPriceRange.max > 0) {
      recommendations.push({
        id: 'price_match',
        type: 'filter',
        score: 0.85,
        reason: `Budget: ${profile.commerce.preferredPriceRange.min}-${profile.commerce.preferredPriceRange.max}`
      });
    }

    // Engagement-based recommendations
    if (profile.signals.recentSearches.length > 0) {
      recommendations.push({
        id: 'search_based',
        type: 'search',
        score: 0.8,
        reason: `Recent search: ${profile.signals.recentSearches[0]}`
      });
    }

    return {
      recommendations: recommendations.slice(0, count),
      latencyMs: Date.now() - startTime
    };
  }

  // ============================================
  // DOOH Targeting
  // ============================================

  /**
   * Get DOOH targeting segments for user
   */
  async getDOOHSegments(userId: string): Promise<{
    segments: string[];
    scores: Record<string, number>;
    locationContext?: { city: string; zone: string };
  }> {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return { segments: ['general'], scores: { general: 1.0 } };
    }

    const segments: string[] = [];
    const scores: Record<string, number> = {};

    // Location-based segments
    if (profile.location.currentLocation || profile.location.homeCity) {
      const city = profile.location.homeCity || 'Mumbai';
      segments.push(city.toLowerCase(), `${city.toLowerCase()}_commuter`);
      scores[city.toLowerCase()] = 0.9;
      scores[`${city.toLowerCase()}_commuter`] = 0.7;
    }

    // Behavioral segments
    if (profile.behavioral.nightlifeScore > 0.6) {
      segments.push('nightlife_enthusiast');
      scores['nightlife_enthusiast'] = profile.behavioral.nightlifeScore;
    }

    if (profile.behavioral.travelAffinity > 0.6) {
      segments.push('travel_interested');
      scores['travel_interested'] = profile.behavioral.travelAffinity;
    }

    // Commerce segments
    if (profile.commerce.tier === 'platinum' || profile.commerce.tier === 'gold') {
      segments.push('premium_customer');
      scores['premium_customer'] = 0.95;
    }

    // Default
    if (segments.length === 0) {
      segments.push('general');
      scores['general'] = 1.0;
    }

    return {
      segments,
      scores,
      locationContext: profile.location.homeCity ? {
        city: profile.location.homeCity,
        zone: profile.location.workCity || 'residential'
      } : undefined
    };
  }

  // ============================================
  // Statistics
  // ============================================

  getCacheStats() {
    return this.cache.getStats();
  }

  getCacheHitRate(): number {
    return this.cache.getHitRate();
  }

  // ============================================
  // Database Operations (Stubs for production)
  // ============================================

  private async fetchUserFromDatabase(userId: string): Promise<UserProfile | null> {
    // In production: query MongoDB/DynamoDB
    // For now, return a sample profile
    return {
      userId,
      identity: {
        name: 'Sample User',
        verified: true,
        createdAt: new Date().toISOString()
      },
      commerce: {
        tier: 'gold',
        totalOrders: 25,
        totalSpend: 15000,
        avgOrderValue: 600,
        lastOrderAt: new Date().toISOString(),
        favoriteCategories: ['pizza', 'biryani', 'chinese'],
        preferredPriceRange: { min: 200, max: 800 }
      },
      loyalty: {
        pointsBalance: 5000,
        pointsLifetime: 15000,
        coinsBalance: 250,
        cashbackEarned: 750,
        referralCount: 3
      },
      engagement: {
        appOpenFrequency: 8,
        avgSessionDuration: 300,
        notificationOpenRate: 0.65,
        lastActiveAt: new Date().toISOString(),
        pushEnabled: true,
        emailVerified: true
      },
      location: {
        homeCity: 'Mumbai',
        homeLocation: { lat: 19.076, lng: 72.877 }
      },
      behavioral: {
        diningFrequency: 3,
        premiumAffinity: 0.6,
        discountSensitivity: 0.4,
        wellnessAffinity: 0.5,
        nightlifeScore: 0.3,
        travelAffinity: 0.7
      },
      predictive: {
        churnRisk: 0.15,
        purchaseLikelihood: 0.75,
        engagementScore: 72,
        ltvTier: 'high'
      },
      signals: {
        intentConfidence: 0.8,
        recentSearches: ['pizza near me', 'biryani'],
        recentViews: []
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      source: 'database'
    };
  }

  private async fetchMerchantFromDatabase(merchantId: string): Promise<MerchantProfile | null> {
    // In production: query database
    return {
      merchantId,
      identity: {
        name: 'Sample Merchant',
        category: 'restaurant',
        verified: true,
        rating: 4.5,
        reviewCount: 250
      },
      commerce: {
        totalOrders: 1000,
        totalRevenue: 500000,
        avgOrderValue: 500,
        avgDeliveryTime: 35,
        fulfillmentRate: 0.95,
        refundRate: 0.02
      },
      engagement: {
        followerCount: 5000,
        saveCount: 800,
        shareCount: 200,
        viewCount: 50000
      },
      location: {
        address: '123 Main Street',
        city: 'Mumbai',
        lat: 19.076,
        lng: 72.877,
        serviceRadius: 5,
        zones: ['south_mumbai', 'bandra', 'juhu']
      },
      operations: {
        openTime: '09:00',
        closeTime: '23:00',
        isOpen: true,
        minOrderValue: 200,
        deliveryFee: 40,
        avgPrepTime: 25
      },
      predictive: {
        popularityScore: 85,
        growthRate: 0.15,
        riskScore: 0.1,
        qualityScore: 92
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  private async persistUserToDatabase(userId: string, profile: UserProfile): Promise<void> {
    // In production: persist to MongoDB/DynamoDB
    logger.info(`[ProfileService] Persisting user ${userId} to database`);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const realtimeProfileService = new RealtimeProfileService();
export default realtimeProfileService;

// ============================================================================
// Fast Access Hooks (for hot paths)
// ============================================================================

/**
 * Get user profile synchronously from cache (for hot paths like QR scanning)
 * Returns null if not in cache - caller should fall back to async
 */
export function getUserProfileSync(userId: string): UserProfile | null {
  return realtimeProfileService['cache'].getUser(userId);
}

/**
 * Get merchant profile synchronously from cache
 */
export function getMerchantProfileSync(merchantId: string): MerchantProfile | null {
  return realtimeProfileService['cache'].getMerchant(merchantId);
}
