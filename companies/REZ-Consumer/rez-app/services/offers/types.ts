/**
 * Offers API Types
 * Extracted from realOffersApi.ts for cleaner separation
 */

// Main Offer type
export interface Offer {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  category: 'mega' | 'student' | 'new_arrival' | 'trending' | 'food' | 'fashion' | 'electronics' | 'general' | 'entertainment' | 'beauty' | 'wellness';
  type: 'cashback' | 'discount' | 'voucher' | 'combo' | 'special' | 'walk_in';
  cashbackPercentage: number;
  originalPrice?: number;
  discountedPrice?: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance?: number;
  store: {
    id: string;
    name: string;
    logo?: string;
    rating?: number;
    verified?: boolean;
  };
  validity: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  engagement: {
    likesCount: number;
    sharesCount: number;
    viewsCount: number;
    isLikedByUser?: boolean;
  };
  restrictions: {
    minOrderValue?: number;
    maxDiscountAmount?: number;
    applicableOn?: string[];
    excludedProducts?: string[];
    ageRestriction?: {
      minAge?: number;
      maxAge?: number;
    };
    userTypeRestriction?: 'student' | 'new_user' | 'premium' | 'all';
  };
  metadata: {
    isNew?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    isSpecial?: boolean;
    priority: number;
    tags: string[];
    featured?: boolean;
    flashSale?: {
      isActive: boolean;
      endTime?: string;
      originalPrice?: number;
      salePrice?: number;
    };
  };
  exclusiveZone?: 'corporate' | 'women' | 'birthday' | 'student' | 'senior' | 'defence' | 'healthcare' | 'teacher' | 'government' | 'differently-abled' | 'first-time';
  eligibilityRequirement?: string;
  createdAt: string;
  updatedAt: string;
}

// Offer category
export interface OfferCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  backgroundColor?: string;
  isActive: boolean;
  priority: number;
  offers: string[];
  metadata: {
    displayOrder: number;
    isFeatured: boolean;
    parentCategory?: string;
    subcategories?: string[];
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Hero banner
export interface HeroBanner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  ctaText: string;
  ctaAction: string;
  ctaUrl?: string;
  backgroundColor: string;
  textColor?: string;
  isActive: boolean;
  priority: number;
  validFrom: string;
  validUntil: string;
  targetAudience: {
    userTypes?: ('student' | 'new_user' | 'premium' | 'all')[];
    ageRange?: {
      min?: number;
      max?: number;
    };
    locations?: string[];
    categories?: string[];
  };
  analytics: {
    views: number;
    clicks: number;
    conversions: number;
  };
  metadata: {
    page: 'offers' | 'home' | 'category' | 'product' | 'all';
    position: 'top' | 'middle' | 'bottom';
    size: 'small' | 'medium' | 'large' | 'full';
    animation?: string;
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Offer section
export interface OfferSection {
  id: string;
  title: string;
  offers: Offer[];
  viewAllEnabled?: boolean;
}

// Offers page data
export interface OffersPageData {
  heroBanner: HeroBanner | null;
  sections: {
    mega: {
      title: string;
      offers: Offer[];
    };
    students: {
      title: string;
      offers: Offer[];
    };
    newArrivals: {
      title: string;
      offers: Offer[];
    };
    trending: {
      title: string;
      offers: Offer[];
    };
  };
  userEngagement: {
    likedOffers: string[];
    userPoints: number;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Store offers data
export interface StoreOffersData {
  deals: Offer[];
  totalCount: number;
  storeInfo: {
    id: string;
    name?: string;
  };
}

// Zone types
export interface ZoneEligibility {
  zone: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    verificationRequired: boolean;
  };
  isEligible: boolean;
  autoVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | null;
  requiresAuth: boolean;
  message: string;
}

export interface ZoneVerificationResult {
  id: string;
  status: string;
  zoneSlug: string;
  createdAt: string;
}

export interface ZoneVerificationStatus {
  hasVerification: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
}

// Redemption types
export interface RedemptionDetails {
  _id: string;
  redemptionCode: string;
  status: string;
  expiryDate: string;
  redemptionType: string;
  verificationCode?: string;
}

export interface RedemptionOffer {
  _id: string;
  title: string;
  image?: string;
  cashbackPercentage: number;
  type: string;
  restrictions: {
    minOrderValue: number;
    maxDiscountAmount: number | null;
  };
}

export interface ValidationResult {
  valid: boolean;
  redemption?: RedemptionDetails;
  offer?: RedemptionOffer;
}

// Use redemption result
export interface UseRedemptionResult {
  success: boolean;
  redemption: {
    _id: string;
    status: string;
    usedDate: string;
    usedAmount: number;
  };
  cashback: {
    amount: number;
    percentage: number;
    orderAmount: number;
  };
  wallet?: {
    balance: number;
    available: number;
  };
}

// Voucher type
export interface VoucherDetails {
  voucherCode: string;
  cashbackAmount: number;
  expiresAt: string;
}

// Offer API params
export interface GetOffersParams {
  category?: string;
  store?: string;
  type?: string;
  tags?: string;
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  minCashback?: number;
  maxCashback?: number;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface SearchOffersParams {
  q: string;
  category?: string;
  store?: string;
  minCashback?: number;
  page?: number;
  limit?: number;
}

export interface NearbyOffersParams {
  lat: number;
  lng: number;
  maxDistance?: number;
  limit?: number;
}

export interface StoreOffersParams {
  type?: 'walk_in' | 'online' | 'combo' | 'cashback' | 'flash_sale' | 'all';
  category?: string;
  active?: boolean;
  featured?: boolean;
  sortBy?: 'priority' | 'discount' | 'expiry' | 'newest';
  page?: number;
  limit?: number;
}

export interface CategoryOffersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
  lat?: number;
  lng?: number;
}

// Homepage deals
export interface HomepageDealsSection {
  section: {
    title: string;
    subtitle: string;
    icon: string;
  };
  enabledTabs: {
    key: string;
    displayName: string;
    sortOrder: number;
  }[];
  tabs: {
    offers: {
      isEnabled: boolean;
      displayName: string;
      items: Offer[];
    };
    cashback: {
      isEnabled: boolean;
      displayName: string;
      items: Offer[];
    };
    exclusive: {
      isEnabled: boolean;
      displayName: string;
      items: Offer[];
    };
  };
}

// Mock deal types (for store offers)
export interface MockDeal {
  id: string;
  storeId: string;
  title: string;
  description: string;
  type: 'walk_in' | 'online' | 'combo' | 'cashback' | 'flash_sale';
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  terms: string[];
  applicableProducts: string[];
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  priority: number;
  usageLimit: number;
  usedCount: number;
  badge: {
    text: string;
    backgroundColor: string;
    textColor: string;
  };
}
