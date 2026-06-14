// Go4Food Shared Types

// ===================
// Dish Types
// ===================

export interface Dish {
  id: string;
  name: string;
  slug: string;
  description?: string;

  // Categorization
  cuisine?: Cuisine;
  category?: DishCategory;

  // Nutrition (per 100g)
  nutrition?: DishNutrition;

  // Allergen info
  allergens: string[];
  dietaryTags: string[];

  // Additional info
  origin?: string;
  story?: string;
  ingredients: string[];
  similarDishes: string[];

  // Media
  images: string[];

  // Stats
  viewCount: number;
  searchCount: number;

  // Computed
  avgPrice?: number;
  restaurantCount?: number;
}

export interface DishNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Cuisine {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  dishCount?: number;
}

export interface DishCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  dishCount?: number;
}

// ===================
// Restaurant Types
// ===================

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;

  // Location
  address: string;
  city: string;
  lat: number;
  lng: number;

  // Media
  coverImage?: string;
  logo?: string;
  images: string[];

  // Ratings & Stats
  rating: number;
  reviewCount: number;

  // Info
  cuisines: string[];
  avgPrice: number;
  isOpen: boolean;

  // Timing
  openingTime?: string;
  closingTime?: string;

  // Contact
  phone?: string;
  email?: string;

  // Deals
  activeDeals: number;
}

export interface RestaurantDish {
  id: string;
  restaurant: Restaurant;
  dish: Dish;

  name: string;
  description?: string;
  price: number;
  image?: string;

  isAvailable: boolean;
  avgRating: number;
  reviewCount: number;
}

// ===================
// Price Types
// ===================

export interface PlatformPrice {
  id: string;

  platform: Platform;
  platformName: string;
  platformLogo: string;
  platformUrl?: string;

  basePrice: number;
  finalPrice: number;

  fees: PriceFees;
  discount: number;

  deliveryTime?: string;
  isBestPrice: boolean;
  dealCode?: string;

  validUntil?: Date;
  lastVerified?: Date;
}

export interface PriceFees {
  delivery: number;
  platform: number;
  gst: number;
  packaging: number;
}

export interface PriceComparison {
  dish: Dish;
  restaurant: Restaurant;
  prices: PlatformPrice[];
  bestDeal: {
    platform: Platform;
    finalPrice: number;
    savings: number;
    coupon?: string;
  };
}

export type Platform =
  | 'rez'
  | 'swiggy'
  | 'zomato'
  | 'magicpin'
  | 'direct'
  | 'dominos'
  | 'pizzahut'
  | 'bk';

// ===================
// Deal Types
// ===================

export interface Deal {
  id: string;
  title: string;
  slug: string;
  description?: string;

  type: DealType;
  value: number;

  applicableTo: DealApplicability;

  restaurant?: Restaurant;
  dish?: Dish;

  code?: string;
  codeType: CodeType;

  minOrder?: number;
  maxDiscount?: number;

  source: DealSource;
  bankName?: string;
  cardType?: string;

  startsAt: Date;
  endsAt: Date;

  isActive: boolean;
  isFeatured: boolean;

  usedCount: number;
}

export type DealType =
  | 'PERCENTAGE_OFF'
  | 'FLAT_OFF'
  | 'FREE_DELIVERY'
  | 'BUY_ONE_GET_ONE'
  | 'CASHBACK';

export type DealApplicability = 'ALL' | 'RESTAURANT' | 'DISH' | 'USER';

export type CodeType = 'USER_ENTRY' | 'AUTO_APPLIED';

export type DealSource = 'REZ' | 'RESTAURANT' | 'BANK' | 'PLATFORM';

// ===================
// Community Types
// ===================

export interface FoodGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;

  type: GroupType;
  city?: string;

  rules?: string;
  isPrivate: boolean;

  memberCount: number;
  postCount: number;

  coverImage?: string;

  isMember?: boolean;
}

export type GroupType = 'CITY' | 'CUISINE' | 'LIFESTYLE' | 'GENERAL';

export interface FoodPost {
  id: string;
  group: FoodGroup;
  author: UserSummary;

  type: PostType;

  title?: string;
  content: string;

  images: string[];

  restaurant?: Restaurant;
  dish?: Dish;
  deal?: Deal;

  upvotes: number;
  commentCount: number;

  isPinned: boolean;
  hasUpvoted?: boolean;

  createdAt: Date;
}

export type PostType = 'REVIEW' | 'DEAL' | 'QUESTION' | 'DISCOVERY' | 'TIP';

export interface FoodComment {
  id: string;
  post: FoodPost;
  author: UserSummary;

  content: string;

  upvotes: number;
  hasUpvoted?: boolean;

  parentId?: string;
  replies?: FoodComment[];

  createdAt: Date;
}

// ===================
// Advisor Types
// ===================

export interface AdvisorConversation {
  id: string;
  messages: AdvisorMessage[];

  context?: {
    location?: string;
    budget?: number;
    preferences?: string[];
  };

  createdAt: Date;
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;

  recommendations?: AdvisorRecommendation[];

  createdAt: Date;
}

export interface AdvisorRecommendation {
  dish: Dish;
  restaurant: Restaurant;
  price: number;
  reason: string;
  score: number;
}

// ===================
// User Types
// ===================

export interface UserSummary {
  id: string;
  name: string;
  avatar?: string;
  isInfluencer?: boolean;
}

export interface UserProfile extends UserSummary {
  email: string;
  phone: string;

  preferences: UserFoodPreference;

  stats: {
    reviewsCount: number;
    postsCount: number;
    followers: number;
    following: number;
  };
}

export interface UserFoodPreference {
  dietaryPrefs: string[];
  allergies: string[];
  favoriteCuisines: string[];
  favoriteDishes: string[];

  avgOrderValue?: number;
  orderFrequency?: 'daily' | 'weekly' | 'monthly';

  defaultLocation?: string;
}

// ===================
// Search Types
// ===================

export interface SearchResult {
  dishes: Dish[];
  restaurants: Restaurant[];

  facets: SearchFacets;
  total: number;
}

export interface SearchFacets {
  cuisines: Facet[];
  priceRanges: Facet[];
  dietary: Facet[];
}

export interface Facet {
  id: string;
  name: string;
  count: number;
}

export interface SearchFilters {
  cuisines?: string[];
  dietary?: string[];
  priceRange?: [number, number];
  rating?: number;
  isOpen?: boolean;
}

// ===================
// Pagination
// ===================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
