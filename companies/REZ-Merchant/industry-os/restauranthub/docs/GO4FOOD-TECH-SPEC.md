# GO4FOOD - TECHNICAL SPECIFICATION

**Version:** 1.0.0 (Phase 1)  
**Date:** June 1, 2026  
**Stack:** Next.js 14.x + NestJS + TypeScript + Prisma + PostgreSQL  
**Owner:** RTNM Group / REZ-Commerce

---

## OVERVIEW

Go4Food is the **Food Decision Engine** under ReZ Consumer. It helps users make smarter food decisions before ordering by providing:

- Food search & recommendations
- Price comparison across platforms
- Best deal aggregation
- AI-powered food advisor
- Community reviews & Q&A
- Redirect to ReZ or other platforms

**Positioning:** *"Before you order, check Go4Food"*

---

## ECOSYSTEM INTEGRATION

```
┌─────────────────────────────────────────────────────────────────┐
│                         GO4FOOD                                  │
│                    Food Decision Engine                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │  Consumer   │───▶│   RABTUL    │───▶│    HOJAI    │       │
│  │    App      │◀───│   Services  │◀───│     AI      │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│         │                  │                   │                │
│         ▼                  ▼                   ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ Restaurant  │    │    ReZ     │    │  BuzzLocal  │       │
│  │     OS      │    │  Platform   │    │  Community  │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### RABTUL Services (Ports)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Auth | 4002 | User authentication | ✅ Available |
| Payment | 4001 | Checkout, refunds | ✅ Available |
| Wallet | 4004 | ReZ Coins, cashback | ✅ Available |
| Notifications | 4011 | SMS, Email, Push | ✅ Available |

### Ecosystem Services

| Service | Location | Purpose |
|---------|----------|---------|
| Restaurant OS | StayOwn | Restaurant data, menus, reviews |
| ReZ Platform | REZ-Commerce | Cashback, loyalty, transactions |
| Hojai AI | HOJAI AI (4500-4610) | Food search, recommendations, NLP |
| BuzzLocal | Axom | Food communities, posts |
| RTMN Finance | RidZa | Bank offers, BNPL deals |

---

## PROJECT STRUCTURE

```
restauranthub/
├── apps/
│   ├── go4food/                    # NEW - Consumer App
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router
│   │   │   │   ├── (auth)/       # Auth pages (login, register)
│   │   │   │   ├── (main)/       # Main app pages
│   │   │   │   │   ├── search/   # Food search
│   │   │   │   │   ├── restaurant/[id]/  # Restaurant detail
│   │   │   │   │   ├── dish/[id]/        # Dish detail
│   │   │   │   │   ├── deals/    # Deals page
│   │   │   │   │   ├── community/ # Food community
│   │   │   │   │   ├── advisor/   # AI food advisor
│   │   │   │   │   └── profile/   # User profile
│   │   │   │   └── api/          # API routes
│   │   │   ├── components/       # Shared components
│   │   │   │   ├── ui/           # shadcn/ui components
│   │   │   │   ├── search/       # Search components
│   │   │   │   ├── restaurant/   # Restaurant cards
│   │   │   │   ├── dish/         # Dish components
│   │   │   │   ├── deal/         # Deal cards
│   │   │   │   └── advisor/      # AI chat components
│   │   │   ├── lib/              # Utilities
│   │   │   │   ├── api/          # API clients
│   │   │   │   ├── hooks/        # React hooks
│   │   │   │   ├── utils/        # Helpers
│   │   │   │   └── constants/    # App constants
│   │   │   ├── types/           # TypeScript types
│   │   │   └── stores/          # Zustand stores
│   │   ├── prisma/              # Database schema
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── go4food-api/              # NEW - Backend API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── search/       # Food search module
│       │   │   ├── restaurant/   # Restaurant data module
│       │   │   ├── dish/        # Dishpedia module
│       │   │   ├── deal/        # Deals module
│       │   │   ├── advisor/      # AI advisor module
│       │   │   ├── community/    # Community module
│       │   │   ├── ordering/     # Redirect module
│       │   │   └── analytics/    # Analytics module
│       │   ├── integrations/    # External integrations
│       │   │   ├── rabtul/      # RABTUL service clients
│       │   │   ├── restaurant-os/ # Restaurant OS client
│       │   │   ├── hojai/       # Hojai AI client
│       │   │   ├── buzzlocal/   # BuzzLocal client
│       │   │   └── rez/         # ReZ platform client
│       │   ├── prisma/          # Database schema
│       │   └── main.ts
│       └── package.json
│
└── packages/
    └── shared/                   # Shared types & utilities
        ├── src/
        │   ├── types/           # Shared TypeScript types
        │   ├── constants/       # Shared constants
        │   └── validators/       # Zod schemas
        └── package.json
```

---

## DATABASE SCHEMA

### New Models (Go4Food)

```prisma
// ==========================================
// FOOD DISH DATABASE
// ==========================================

model Dish {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  description   String?
  
  // Categorization
  cuisineId     String?
  cuisine       Cuisine?  @relation(fields: [cuisineId], references: [id])
  categoryId    String?
  category      DishCategory? @relation(fields: [categoryId], references: [id])
  
  // Nutrition (per 100g)
  calories      Float?
  protein       Float?
  carbs         Float?
  fat           Float?
  fiber         Float?
  
  // Allergen info
  allergens     String[]  // ['dairy', 'nuts', 'gluten']
  dietaryTags   String[]  // ['vegetarian', 'vegan', 'keto']
  
  // Additional info
  origin        String?   // Origin region/history
  description   String?   // Story about the dish
  ingredients   String[]  // Main ingredients
  similarDishes String[]  // Related dishes
  
  // Media
  images        String[]
  
  // Stats
  viewCount     Int       @default(0)
  searchCount   Int       @default(0)
  
  // Relations
  restaurantDishes RestaurantDish[]
  reviews       DishReview[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([name])
  @@index([slug])
  @@index([cuisineId])
}

model Cuisine {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?
  dishes      Dish[]
  
  @@index([slug])
}

model DishCategory {
  id       String  @id @default(cuid())
  name     String
  slug     String  @unique
  icon     String?
  dishes   Dish[]
  
  @@index([slug])
}

// ==========================================
// RESTAURANT DISH LINKING
// ==========================================

model RestaurantDish {
  id           String   @id @default(cuid())
  
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  
  dishId       String
  dish         Dish     @relation(fields: [dishId], references: [id])
  
  // Restaurant's version
  name         String   // Restaurant-specific name
  description  String?
  price        Float
  image        String?
  
  // User-contributed pricing
  userPrices   UserDishPrice[]
  
  // Aggregated ratings from reviews
  avgRating    Float    @default(0)
  reviewCount  Int      @default(0)
  
  // Availability
  isAvailable  Boolean  @default(true)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@unique([restaurantId, dishId])
  @@index([restaurantId])
  @@index([dishId])
}

// ==========================================
// PRICE COMPARISON
// ==========================================

model PlatformPrice {
  id           String   @id @default(cuid())
  
  restaurantDishId String
  restaurantDish   RestaurantDish @relation(fields: [restaurantDishId], references: [id])
  
  // Platform info
  platform     String   // 'rez', 'swiggy', 'zomato', 'magicpin', 'direct'
  platformUrl  String?  // Deep link to platform
  platformLogo String?  // Platform icon
  
  // Pricing
  basePrice    Float
  finalPrice   Float    // After all fees
  deliveryFee  Float    @default(0)
  platformFee  Float    @default(0)
  gstAmount    Float    @default(0)
  packagingFee Float    @default(0)
  discount     Float    @default(0)
  
  // Time estimate
  deliveryTime String?  // "30-40 mins"
  
  // Best deal indicator
  isBestPrice  Boolean  @default(false)
  dealCode     String?  // Best coupon code
  
  // User who contributed (if manual)
  contributedBy String?
  
  // Validity
  validUntil   DateTime?
  lastVerified DateTime?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([restaurantDishId])
  @@index([platform])
}

model UserDishPrice {
  id              String   @id @default(cuid())
  
  restaurantDishId String
  restaurantDish   RestaurantDish @relation(fields: [restaurantDishId], references: [id])
  
  userId          String
  price           Float
  notes           String?
  
  // Verification
  isVerified      Boolean  @default(false)
  verifiedCount   Int      @default(0)
  
  createdAt       DateTime @default(now())
  
  @@unique([restaurantDishId, userId])
}

// ==========================================
// DEALS & OFFERS
// ==========================================

model Deal {
  id           String    @id @default(cuid())
  
  title        String
  slug         String    @unique
  description  String?
  
  type         DealType
  value        Float     // Discount amount or percentage
  
  // Applicability
  applicableTo DealApplicability // 'all', 'restaurant', 'dish', 'user'
  
  restaurantId String?
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id])
  
  dishId       String?
  dish         Dish?     @relation(fields: [dishId], references: [id])
  
  // Deal codes
  code         String?   @unique
  codeType     CodeType  @default(AUTO_APPLIED) // 'user_entry', 'auto_applied'
  
  // Constraints
  minOrder     Float?
  maxDiscount  Float?
  
  // Offers source
  source       DealSource // 'rez', 'restaurant', 'bank', 'platform'
  
  bankName     String?   // For bank offers
  cardType     String?   // 'credit', 'debit'
  
  // Validity
  startsAt     DateTime
  endsAt       DateTime
  
  // Status
  isActive     Boolean   @default(true)
  isFeatured   Boolean   @default(false)
  
  // Stats
  usedCount    Int       @default(0)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  @@index([type])
  @@index([source])
  @@index([restaurantId])
  @@index([startsAt, endsAt])
}

enum DealType {
  PERCENTAGE_OFF
  FLAT_OFF
  FREE_DELIVERY
  BUY_ONE_GET_ONE
  CASHBACK
}

enum DealApplicability {
  ALL
  RESTAURANT
  DISH
  USER
}

enum CodeType {
  USER_ENTRY
  AUTO_APPLIED
}

enum DealSource {
  REZ
  RESTAURANT
  BANK
  PLATFORM
}

// ==========================================
// AI FOOD ADVISOR
// ==========================================

model AdvisorConversation {
  id        String   @id @default(cuid())
  
  userId    String
  messages  AdvisorMessage[]
  
  // Context
  location  String?
  budget    Float?
  preferences String[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AdvisorMessage {
  id             String   @id @default(cuid())
  
  conversationId String
  conversation  AdvisorConversation @relation(fields: [conversationId], references: [id])
  
  role          MessageRole // 'user', 'assistant'
  content       String
  
  // Recommendations made
  recommendations Json? // [{dishId, restaurantId, score}]
  
  createdAt DateTime @default(now())
}

enum MessageRole {
  USER
  ASSISTANT
}

// ==========================================
// COMMUNITY
// ==========================================

model FoodGroup {
  id          String   @id @default(cuid())
  
  name        String
  slug        String   @unique
  description String?
  
  // Type
  type        GroupType // 'city', 'cuisine', 'lifestyle', 'general'
  cityId      String?   // For city groups
  
  // Rules
  rules       String?
  isPrivate   Boolean  @default(false)
  
  // Stats
  memberCount Int      @default(0)
  postCount   Int      @default(0)
  
  // Cover
  coverImage  String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  posts       FoodPost[]
  members     FoodGroupMember[]
  
  @@index([type])
  @@index([slug])
}

enum GroupType {
  CITY
  CUISINE
  LIFESTYLE
  GENERAL
}

model FoodGroupMember {
  id        String   @id @default(cuid())
  
  groupId   String
  group     FoodGroup @relation(fields: [groupId], references: [id])
  
  userId    String
  role      MemberRole @default(MEMBER)
  
  joinedAt  DateTime @default(now())
  
  @@unique([groupId, userId])
}

enum MemberRole {
  OWNER
  MODERATOR
  MEMBER
}

model FoodPost {
  id        String   @id @default(cuid())
  
  groupId   String
  group     FoodGroup @relation(fields: [groupId], references: [id])
  
  authorId  String
  
  type      PostType // 'review', 'deal', 'question', 'discovery', 'tip'
  
  title     String?
  content   String
  
  // Media
  images    String[]
  
  // Linked entities
  restaurantId String?
  dishId       String?
  dealId       String?
  
  // Engagement
  upvotes    Int      @default(0)
  commentCount Int    @default(0)
  
  // Status
  isPinned   Boolean  @default(false)
  isHidden   Boolean  @default(false)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  comments   FoodComment[]
  upvotesRecords FoodPostUpvote[]
  
  @@index([groupId])
  @@index([authorId])
  @@index([type])
}

enum PostType {
  REVIEW
  DEAL
  QUESTION
  DISCOVERY
  TIP
}

model FoodComment {
  id        String   @id @default(cuid())
  
  postId    String
  post      FoodPost @relation(fields: [postId], references: [id])
  
  authorId  String
  parentId  String?  // For replies
  
  content   String
  
  upvotes   Int      @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  replies   FoodComment[] @relation("CommentReplies")
  upvoteRecords FoodCommentUpvote[]
  
  @@index([postId])
}

model FoodPostUpvote {
  id        String   @id @default(cuid())
  
  postId    String
  post      FoodPost @relation(fields: [postId], references: [id])
  
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}

model FoodCommentUpvote {
  id        String   @id @default(cuid())
  
  commentId String
  comment   FoodComment @relation(fields: [commentId], references: [id])
  
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId])
}

// ==========================================
// DISH REVIEWS
// ==========================================

model DishReview {
  id        String   @id @default(cuid())
  
  dishId    String
  dish      Dish     @relation(fields: [dishId], references: [id])
  
  authorId  String
  
  rating    Float    // 1-5
  title     String?
  content   String
  
  // Photos
  images    String[]
  
  // Helpful
  helpfulCount Int   @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  helpfulVotes DishReviewHelpful[]
  
  @@index([dishId])
}

model DishReviewHelpful {
  id        String   @id @default(cuid())
  
  reviewId  String
  review    DishReview @relation(fields: [reviewId], references: [id])
  
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([reviewId, userId])
}

// ==========================================
// USER PREFERENCES
// ==========================================

model UserFoodPreference {
  id        String   @id @default(cuid())
  
  userId    String   @unique
  
  // Dietary
  dietaryPrefs String[] // ['vegetarian', 'no-onion']
  allergies    String[]
  
  // Favorites
  favoriteCuisines String[]
  favoriteDishes  String[] // Dish IDs
  
  // Spending
  avgOrderValue Float?
  orderFrequency String? // 'daily', 'weekly', 'monthly'
  
  // Location
  defaultLocation String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model UserFoodJourney {
  id        String   @id @default(cuid())
  
  userId    String
  
  type      JourneyType // 'visited', 'tried', 'reviewed'
  
  restaurantId String?
  dishId       String?
  
  notes     String?
  rating    Float?
  photos    String[]
  
  createdAt DateTime @default(now())
  
  @@index([userId])
}

enum JourneyType {
  VISITED
  TRIED
  REVIEWED
}
```

---

## API CONTRACTS

### Search API

```typescript
// GET /api/search
interface SearchRequest {
  q: string;              // "biryani under 300"
  location?: string;      // "bangalore"
  lat?: number;
  lng?: number;
  filters?: {
    cuisine?: string[];
    dietary?: string[];
    priceRange?: [number, number];
    rating?: number;
  };
  page?: number;
  limit?: number;
}

interface SearchResponse {
  results: {
    dishes: Dish[];
    restaurants: RestaurantSearchResult[];
  };
  facets: {
    cuisines: Facet[];
    priceRanges: Facet[];
    dietary: Facet[];
  };
  pagination: Pagination;
}

interface RestaurantSearchResult {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisines: string[];
  avgPrice: number;
  distance?: number;
  isOpen: boolean;
  deals: DealSummary[];
}
```

### Price Comparison API

```typescript
// GET /api/dishes/:id/prices
interface PriceComparisonResponse {
  dish: {
    id: string;
    name: string;
    image: string;
  };
  restaurant: {
    id: string;
    name: string;
  };
  prices: {
    platform: string;
    platformName: string;
    platformLogo: string;
    basePrice: number;
    finalPrice: number;
    fees: {
      delivery: number;
      platform: number;
      gst: number;
      packaging: number;
    };
    discount: number;
    coupon?: string;
    deliveryTime: string;
    bestPrice: boolean;
    url: string;
  }[];
  bestDeal: {
    platform: string;
    finalPrice: number;
    savings: number;
    coupon?: string;
  };
}
```

### AI Advisor API

```typescript
// POST /api/advisor/chat
interface AdvisorRequest {
  message: string;           // "what should I eat under 300?"
  conversationId?: string;   // For continuing conversation
  context?: {
    location?: string;
    time?: string;           // "lunch", "dinner"
  };
}

interface AdvisorResponse {
  message: string;
  recommendations: {
    dish: {
      id: string;
      name: string;
      image: string;
    };
    restaurant: {
      id: string;
      name: string;
      rating: number;
    };
    price: number;
    reason: string;
    score: number;           // 0-100 match score
  }[];
  conversationId: string;
}
```

### Deals API

```typescript
// GET /api/deals
interface DealsRequest {
  type?: DealType;           // 'PERCENTAGE_OFF', 'FLAT_OFF', etc.
  source?: DealSource;       // 'REZ', 'BANK', 'RESTAURANT'
  restaurantId?: string;
  city?: string;
  sortBy?: 'popular' | 'expiring' | 'newest';
}

interface DealResponse {
  deals: {
    id: string;
    title: string;
    description: string;
    type: DealType;
    value: number;
    code?: string;
    codeType: CodeType;
    minOrder?: number;
    restaurant?: {
      id: string;
      name: string;
      image: string;
    };
    expiresAt: string;
    usedCount: number;
  }[];
  featured: DealResponse['deals'][0][];
}
```

---

## INTEGRATION CLIENTS

### RABTUL Services

```typescript
// packages/shared/src/integrations/rabtul/
// clients/auth.client.ts
export class RabtulAuthClient {
  constructor(
    private readonly baseUrl: string = 'http://localhost:4002',
    private readonly apiKey: string,
  ) {}

  async validateToken(token: string): Promise<User>
  async getUser(userId: string): Promise<User>
  async refreshToken(refreshToken: string): Promise<Tokens>
  async verifyOTP(phone: string, otp: string): Promise<Tokens>
}

// clients/wallet.client.ts
export class RabtulWalletClient {
  constructor(
    private readonly baseUrl: string = 'http://localhost:4004',
    private readonly apiKey: string,
  ) {}

  async getBalance(userId: string): Promise<number>
  async getTransactions(userId: string): Promise<Transaction[]>
  async applyCashback(userId: string, amount: number): Promise<void>
  async getCashbackBalance(userId: string): Promise<number>
}

// clients/payment.client.ts
export class RabtulPaymentClient {
  constructor(
    private readonly baseUrl: string = 'http://localhost:4001',
    private readonly apiKey: string,
  ) {}

  async createIntent(orderId: string, amount: number): Promise<PaymentIntent>
  async confirmPayment(paymentId: string): Promise<Payment>
  async refund(paymentId: string, amount?: number): Promise<Refund>
}

// clients/notification.client.ts
export class RabtulNotificationClient {
  constructor(
    private readonly baseUrl: string = 'http://localhost:4011',
    private readonly apiKey: string,
  ) {}

  async sendSMS(phone: string, message: string): Promise<void>
  async sendEmail(email: string, template: string, data: object): Promise<void>
  async sendPush(userId: string, payload: PushPayload): Promise<void>
}
```

### Hojai AI Client

```typescript
// packages/shared/src/integrations/hojai/
export class HojaiAIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  // Food Search
  async searchFood(query: string, context: SearchContext): Promise<SearchResult[]>

  // Food Advisor
  async chat(message: string, context: AdvisorContext): Promise<AdvisorResult>

  // Sentiment Analysis
  async analyzeSentiment(text: string): Promise<SentimentResult>

  // Dish Recommendations
  async recommendDishes(userId: string, context: RecommendationContext): Promise<Dish[]>

  // NLP Entity Extraction
  async extractFoodEntities(text: string): Promise<FoodEntity[]>
}
```

### Restaurant OS Client

```typescript
// packages/shared/src/integrations/restaurant-os/
export class RestaurantOSClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async getRestaurants(params: RestaurantSearchParams): Promise<Restaurant[]>
  async getRestaurant(id: string): Promise<RestaurantDetail>
  async getMenus(restaurantId: string): Promise<Menu[]>
  async getReviews(restaurantId: string): Promise<Review[]>
  async getAvailability(restaurantId: string, date: string): Promise<TimeSlot[]>
  async createReservation(data: ReservationRequest): Promise<Reservation>
}
```

---

## PAGES & ROUTES

### App Router Structure

```
src/app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
│
├── (main)/
│   ├── layout.tsx           # Main layout with navbar
│   │
│   ├── page.tsx            # Home - Search + Trending
│   ├── search/
│   │   ├── page.tsx        # Search results
│   │   └── loading.tsx
│   ├── restaurant/[id]/
│   │   ├── page.tsx        # Restaurant detail
│   │   ├── menu/page.tsx   # Full menu
│   │   └── reviews/page.tsx
│   ├── dish/[id]/
│   │   ├── page.tsx        # Dishpedia page
│   │   └── prices/page.tsx # Price comparison
│   ├── deals/
│   │   ├── page.tsx        # All deals
│   │   ├── [type]/page.tsx # Filtered deals
│   │   └── [id]/page.tsx   # Deal detail
│   ├── community/
│   │   ├── page.tsx        # Groups list
│   │   ├── [slug]/page.tsx # Group detail
│   │   └── [slug]/post/[id]/page.tsx
│   ├── advisor/
│   │   ├── page.tsx        # AI advisor chat
│   │   └── history/page.tsx
│   ├── profile/
│   │   ├── page.tsx        # User profile
│   │   ├── preferences/page.tsx
│   │   ├── journey/page.tsx
│   │   └── settings/page.tsx
│   └── compare/
│       └── [dishId]/page.tsx # Price comparison view
│
├── api/
│   ├── search/route.ts
│   ├── dishes/[id]/route.ts
│   ├── dishes/[id]/prices/route.ts
│   ├── deals/route.ts
│   ├── advisor/route.ts
│   └── community/route.ts
│
└── layout.tsx              # Root layout
```

---

## KEY COMPONENTS

### Search Components

```typescript
// components/search/
// SearchBar.tsx - Main search input with suggestions
// SearchFilters.tsx - Cuisine, price, dietary filters
// SearchResults.tsx - Mixed results (dishes + restaurants)
// DishCard.tsx - Dish search result card
// RestaurantCard.tsx - Restaurant search card
// TrendingSearches.tsx - Popular searches
// RecentSearches.tsx - User's search history
```

### Price Comparison Components

```typescript
// components/comparison/
// PriceComparison.tsx - Main comparison table
// PlatformCard.tsx - Single platform price card
// FeeBreakdown.tsx - Show fees breakdown
// BestDeal.tsx - Highlight best price
// PriceChart.tsx - Price history chart
```

### AI Advisor Components

```typescript
// components/advisor/
// AdvisorChat.tsx - Main chat interface
// AdvisorMessage.tsx - Chat bubble
// AdvisorSuggestions.tsx - Quick action chips
// AdvisorRecommendations.tsx - Food cards with scores
```

### Deal Components

```typescript
// components/deals/
// DealCard.tsx - Deal preview card
// DealFilters.tsx - Filter sidebar
// DealCountdown.tsx - Expiry timer
// BankOfferCard.tsx - Bank-specific offer
```

---

## IMPLEMENTATION PRIORITY

### Phase 1 (Month 1-2): Core
1. ✅ Project setup + Auth (RABTUL)
2. ✅ Restaurant OS integration
3. ✅ Basic food search (Hojai AI)
4. ✅ Restaurant detail page
5. ✅ Redirect to ReZ

### Phase 2 (Month 3-4): Intelligence
1. 🔲 Price comparison display
2. 🔲 Dishpedia pages
3. 🔲 Deal aggregator
4. 🔲 AI Food Advisor

### Phase 3 (Month 5-6): Community
1. 🔲 Food groups
2. 🔲 Posts & comments
3. 🔲 Gamification
4. 🔲 User food journey

---

## ENVIRONMENT VARIABLES

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# RABTUL Services
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_AUTH_API_KEY=xxx
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_WALLET_API_KEY=xxx
RABTUL_PAYMENT_URL=http://localhost:4001
RABTUL_PAYMENT_API_KEY=xxx
RABTUL_NOTIFY_URL=http://localhost:4011
RABTUL_NOTIFY_API_KEY=xxx

# Restaurant OS
RESTAURANT_OS_URL=http://localhost:4015
RESTAURANT_OS_API_KEY=xxx

# Hojai AI
HOJAI_AI_URL=http://localhost:4500
HOJAI_AI_API_KEY=xxx

# BuzzLocal
BUZZLOCAL_URL=http://localhost:4800
BUZZLOCAL_API_KEY=xxx

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## MONITORING

### Health Checks
- `GET /health` - API health
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Metrics
- Search queries per minute
- API response times (p50, p95, p99)
- AI advisor conversations
- Price lookups
- Redirect conversions

### Alerts
- API error rate > 1%
- Response time p95 > 500ms
- Hojai AI unavailable
- Database connection issues

---

## SECURITY

### Authentication
- RABTUL Auth for user auth
- JWT in httpOnly cookies
- CSRF protection
- Rate limiting on search

### Data Protection
- No PII in logs
- Encrypted at rest
- GDPR compliance

### API Security
- API key for service-to-service
- Rate limiting per user
- Input validation with Zod

---

## CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 1, 2026 | Initial Phase 1 spec |
