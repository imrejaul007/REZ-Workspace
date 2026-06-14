# REZ App - User Interface Guide

## How to Run the App

```bash
cd REZ-Consumer/REZ-App
npx expo start
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Press 'w' for Web
```

## App Structure Overview

```
REZ App (736 screens)
├── (tabs) - Bottom Navigation
│   ├── Home - Main feed with personalized content
│   ├── Play - Games and entertainment
│   ├── Categories - Browse all categories
│   ├── Earn - Rewards and referrals
│   ├── Finance - Wallet and payments
│   └── Safe QR - Privacy-safe QR codes
│
├── Shop & Products
│   ├── Product Page - Full product details
│   ├── Cart - Shopping cart
│   ├── Checkout - Payment flow
│   └── Store Pages - Merchant profiles
│
├── User Account
│   ├── Profile - User settings
│   ├── Orders - Order history
│   ├── Wishlist - Saved items
│   └── Notifications - Alerts
│
├── Special Features
│   ├── Explore - Social feed
│   ├── Bookings - Reservations
│   ├── Wallet - Payments
│   └── Support - Help center
```

## Key Screens

### 1. Home Screen (index.tsx - 75KB)

```
┌─────────────────────────────────────┐
│ ≡  🔍 Search...           👤  🛒  │  <- Header with search, profile, cart
├─────────────────────────────────────┤
│ 📍 Mumbai, Maharashtra              │  <- Location banner
├─────────────────────────────────────┤
│ 🔥 Streak: 7 days  ⭐ Score: 850   │  <- Gamification row
├─────────────────────────────────────┤
│ [🏬 Mall] [💰 Cash Store] [✨ Prive]│  <- Tab section (horizontal scroll)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │    🎁 Exclusive Offer Banner    │ │  <- Personalized banners
│ │    Flat 30% off on Electronics  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📰 Trending Stories                 │  <- Stories carousel
│ [Story1] [Story2] [Story3] ...
├─────────────────────────────────────┤
│ 🏪 Stores Near You                  │  <- Store recommendations
│ [Store Card] [Store Card] [Store]   │
├─────────────────────────────────────┤
│ 🔥 Hot Right Now                    │  <- Trending products
│ [Product] [Product] [Product] ...   │
├─────────────────────────────────────┤
│ ✨ Recommended For You              │  <- AI-powered recommendations
│ [Product] [Product] [Product] ...   │
└─────────────────────────────────────┘
         ↑ Swipe up for more content
```

### 2. Shop/Product Grid (shop.tsx)

```
┌─────────────────────────────────────┐
│ ←  Back    [Vegan 🍃]    Filter ⚙️   │
├─────────────────────────────────────┤
│ Vegan Products                       │
│ 234 items • Up to 40% off          │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐            │
│ │ [Image] │ │ [Image] │            │
│ │ Product │ │ Product │            │
│ │ ₹499    │ │ ₹299    │            │
│ │ 20% CB  │ │ 15% CB  │            │
│ │ ★4.5    │ │ ★4.2    │            │
│ └─────────┘ └─────────┘            │
│ ┌─────────┐ ┌─────────┐            │
│ │ [Image] │ │ [Image] │            │
│ │ Product │ │ Product │            │
│ │ ₹799    │ │ ₹199    │            │
│ │ 30% CB  │ │ 10% CB  │            │
│ │ ★4.8    │ │ ★4.0    │            │
│ └─────────┘ └─────────┘            │
│                                     │
│ Loading more... (infinite scroll)   │
└─────────────────────────────────────┘
```

### 3. Product Detail Page (product-page.tsx)

```
┌─────────────────────────────────────┐
│ ←  Share        ❤️  📤            │  <- Navigation bar
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      [Product Image Gallery]    │ │
│ │         Swipe for more          │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ • • • ○ ○                           │  <- Image dots
├─────────────────────────────────────┤
│ Nike Air Max 270                    │
│ Men's Running Shoes                  │
│                                     │
│ ₹4,999                    ₹6,999    │  <- Price (with original)
│ 28% OFF                    Save ₹2K │  <- Discount
│                                     │
│ ⭐ 4.5 (1,234 reviews)             │
├─────────────────────────────────────┤
│ 💰 Cashback: ₹250 (5%)             │  <- Cashback badge
├─────────────────────────────────────┤
│ 🚚 Delivery: 2-3 days              │
│ 📍 Pickup: Available                │
├─────────────────────────────────────┤
│ [  🛒 Add to Cart  ] [ ⚡ Buy Now ] │  <- Action buttons
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 💡 Why this is a good deal      │ │  <- AI analysis
│ │ • Lower than market price       │ │
│ │ • High cashback percentage      │ │
│ │ • Good seller rating            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📋 Description                     │
│ Lorem ipsum dolor sit amet...       │
├─────────────────────────────────────┤
│ 📦 Similar Products                 │
│ [Card] [Card] [Card] ...          │
├─────────────────────────────────────┤
│ 🛒 Frequently Bought Together       │
│ [Bundle] + [Add Bundle]            │
└─────────────────────────────────────┘
```

### 4. Cart Screen (cart.tsx)

```
┌─────────────────────────────────────┐
│ ←  Your Cart (3 items)      Clear  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [x] [Image]                    │ │
│ │     Product Name                │ │
│ │     Size: M | Color: Blue       │ │
│ │     ₹499 × 2 = ₹998             │ │
│ │     [-] 2 [+]    🗑️            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [x] [Image]                    │ │
│ │     Another Product             │ │
│ │     ₹299 × 1 = ₹299             │ │
│ │     [-] 1 [+]    🗑️            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 💰 Cashback: ₹65 (5%)              │
├─────────────────────────────────────┤
│ Have a promo code?                 │
│ ┌─────────────────┐ [Apply]       │
│ │ Enter code...   │               │
│ └─────────────────┘                │
├─────────────────────────────────────┤
│ Order Summary                      │
│ ─────────────────────              │
│ Subtotal:          ₹1,297          │
│ Delivery:          ₹49              │
│ Cashback:          -₹65             │
│ ─────────────────────              │
│ Total:             ₹1,281          │
│                                     │
│ ┌─────────────────────────────────┐│
│ │⚡ Express Checkout              ││
│ │   Pay ₹1,281 with UPI         ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 5. Explore Tab (explore.tsx)

```
┌─────────────────────────────────────┐
│ 🔍 Search products, stores...       │
├─────────────────────────────────────┤
│ [All] [Halal] [Vegan] [Veg] ...   │  <- Filters
├─────────────────────────────────────┤
│ 📊 Live Activity                    │
│ 🔥 234 orders in Mumbai today       │
│ 👥 1.2K shopping now               │
├─────────────────────────────────────┤
│ 📱 Trending Reels                   │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │Video│ │Video│ │Video│  ←→        │
│ │ Reel│ │ Reel│ │ Reel│           │
│ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│ ⭐ Verified Reviews                  │
│ ┌─────────────────────────────────┐ │
│ │ 👤 John D. ★★★★★               │ │
│ │ "Amazing product! Fast delivery"│ │
│ │ [Product Image] [👍 234]       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🏪 Stores Near You                  │
│ [Store] [Store] [Store] ...       │
├─────────────────────────────────────┤
│ 🎮 Play & Earn                      │
│ ┌─────────────────────────────────┐ │
│ │  🧩 Scratch & Win              │ │
│ │  [Play Now]                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6. Finance Tab (finance.tsx)

```
┌─────────────────────────────────────┐
│ 💳 My Finance                       │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │  REZ Wallet                     │ │
│ │  Balance: ₹1,250.00             │ │
│ │  [+Add Money] [₹500 Cash In]   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 💳 Payment Methods                 │
│ •••• •••• 4532 (UPI)       [Edit] │
│ + Add new payment method           │
├─────────────────────────────────────┤
│ 📊 Spending Insights               │
│ This Month: ₹12,450               │
│ │████████████████░░░│ 78% of limit│
│ ┌─────────────────────────────────┐ │
│ │ 🛒 Shopping: ₹5,000           │ │
│ │ 🍔 Food: ₹3,200               │ │
│ │ 🚕 Transport: ₹2,100           │ │
│ │ 📦 Others: ₹2,150             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🎁 Savings                         │
│ Total Saved: ₹3,450               │
│ This Month: ₹450                   │
├─────────────────────────────────────┤
│ 🏆 ReZ Score: 850                 │
│ Gold Member • Top 10%              │
└─────────────────────────────────────┘
```

### 7. Safe QR Tab (safe-qr.tsx)

```
┌─────────────────────────────────────┐
│ 🔒 Safe QR                          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │        [QR Code Display]        │ │
│ │            ┌───┐                │ │
│ │            │   │                │ │
│ │            │ ◎ │                │ │
│ │            │   │                │ │
│ │            └───┘                │ │
│ │      Your Safe QR Code          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Select Mode:                       │
│                                     │
│ 👤 Personal    [Active]            │
│ 📱 Device      [Select]            │
│ 🏥 Medical     [Select]            │
│ 🚗 Vehicle     [Select]            │
│ 🏠 Home        [Select]            │
│ 👶 Child       [Select]            │
│ ... (15 emergency modes)           │
├─────────────────────────────────────┤
│ 📤 Share QR                         │
│ [WhatsApp] [Instagram] [More]     │
├─────────────────────────────────────┤
│ ⚙️ Settings                         │
│ • Auto-expire after 24h            │
│ • Require PIN to scan              │
│ • Emergency contacts (3)           │
└─────────────────────────────────────┘
```

### 8. Categories Tab (categories.tsx)

```
┌─────────────────────────────────────┐
│ Browse Categories                   │
├─────────────────────────────────────┤
│ 🔍 Search categories...            │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🍔 Food & Dining                │ │
│ │    234 stores • 1.2K products   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👗 Fashion                      │ │
│ │    456 stores • 5.6K products   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🏠 Home & Living                │ │
│ │    189 stores • 3.4K products   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⚡ Electronics                   │ │
│ │    78 stores • 2.1K products   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💄 Beauty & Care               │ │
│ │    312 stores • 4.8K products   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🏥 Health                       │ │
│ │    156 stores • 2.3K products   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Scroll for more categories...      │
└─────────────────────────────────────┘
```

## Navigation Structure

```
Bottom Navigation (6 tabs)
│
├── Home (index)
│   ├── Mall Section
│   ├── Cash Store Section
│   ├── Prive Section
│   ├── Stories
│   └── Personalized Feed
│
├── Play
│   ├── Games
│   ├── Scratch Cards
│   └── Challenges
│
├── Categories
│   ├── Food & Dining
│   ├── Fashion
│   ├── Electronics
│   └── ... (50+ categories)
│
├── Earn
│   ├── Referrals
│   ├── Cashback
│   ├── Missions
│   └── Rewards
│
├── Finance
│   ├── Wallet
│   ├── Transactions
│   ├── Savings
│   └── ReZ Score
│
└── Safe QR
    ├── Personal QR
    ├── Emergency QR
    └── Share QR
```

## Intelligence Features in UI

### AI-Powered Personalization

```typescript
// Using the hooks we created:
// usePersonalization.ts - Real-time recommendations
// useRecommendations.ts - Product suggestions
// useMemory.ts - Conversation memory
// useContextEngine.ts - User context
```

### User Experience Flow

```
User Opens App
       ↓
┌──────────────────┐
│ Home Screen      │
│ (Personalized)   │
└──────────────────┘
       ↓
┌──────────────────┐
│ Browse/Search   │ ←── AI recommendations
└──────────────────┘
       ↓
┌──────────────────┐
│ View Product    │ ←── Fraud check, Similar products
└──────────────────┘
       ↓
┌──────────────────┐
│ Add to Cart     │ ←── Cart recommendations
└──────────────────┘
       ↓
┌──────────────────┐
│ Checkout        │ ←── Express checkout, Fraud protection
└──────────────────┘
       ↓
┌──────────────────┐
│ Order Confirmed │ ←── Loyalty points, Cashback
└──────────────────┘
```

## Key UI Components

| Component | Purpose |
|-----------|---------|
| `CachedImage` | Optimized image loading with caching |
| `FastImage` | Expo-optimized image component |
| `FlashList` | Performant list rendering |
| `ProductCard` | Reusable product display |
| `CashbackBadge` | Shows cashback percentage |
| `StreakFireIcon` | Gamification streak indicator |
| `RezScoreCard` | User loyalty score display |
| `BottomSheet` | Modal bottom sheet |
| `Skeleton` | Loading placeholders |

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#FF6B35` | Brand accent, CTAs |
| Secondary | `#6366F1` | Links, highlights |
| Success | `#10B981` | Positive states |
| Warning | `#F59E0B` | Alerts, cautions |
| Error | `#EF4444` | Errors, destructive |
| Background | `#FFFFFF` | Main background |
| Text | `#111827` | Primary text |
| Muted | `#6B7280` | Secondary text |

## Typography

| Style | Size | Weight |
|-------|------|--------|
| H1 | 28px | Bold (700) |
| H2 | 24px | SemiBold (600) |
| H3 | 20px | SemiBold (600) |
| Body | 16px | Regular (400) |
| Caption | 14px | Regular (400) |
| Small | 12px | Regular (400) |

## To Run on Device

### iOS Simulator
```bash
npx expo start
# Press 'i' to open iOS Simulator
```

### Android Emulator
```bash
npx expo start
# Press 'a' to open Android emulator
```

### Web
```bash
npx expo start
# Press 'w' to open in browser
```

### Physical Device
1. Download "Expo Go" from App Store/Play Store
2. Scan QR code shown in terminal
