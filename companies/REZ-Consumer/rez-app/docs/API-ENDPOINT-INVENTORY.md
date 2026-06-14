# ReZ Consumer App - Complete API Endpoint Inventory

**Generated:** April 26, 2026
**Version:** 1.0.0
**API Gateway:** `https://rez-api-gateway.onrender.com/api`

---

## Overview

The ReZ Consumer App connects to the backend through 220+ API endpoints across 200+ service files. All endpoints route through the central API Gateway with path-based routing to appropriate microservices.

### Base Configuration

| Environment | API Gateway URL |
|------------|----------------|
| Production | `https://rez-api-gateway.onrender.com/api` |
| Staging | `https://rez-api-gateway.onrender.com/api` |
| WebSocket | `https://rez-backend-8dfu.onrender.com` |

---

## API Services by Category

### 1. Authentication & User Management (`authApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/send-otp` | POST | Send OTP to phone/email |
| `/auth/verify-otp` | POST | Verify OTP and get tokens |
| `/auth/refresh-token` | POST | Refresh access token |
| `/auth/logout` | POST | Logout user |
| `/auth/google` | POST | Google OAuth login |
| `/auth/apple` | POST | Apple OAuth login |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/profile` | GET | Get user profile |
| `/profile` | PUT | Update user profile |
| `/profile/avatar` | POST | Upload profile avatar |
| `/profile/verify-phone` | POST | Verify phone number |
| `/profile/verify-email` | POST | Verify email address |

---

### 2. Categories (`categoriesApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/categories` | GET | Get all categories |
| `/categories/:id` | GET | Get category by ID |
| `/categories/:slug` | GET | Get category by slug |
| `/categories/tree` | GET | Get category tree structure |
| `/categories/featured` | GET | Get featured categories |
| `/categories/best-discount` | GET | Get best discount categories |
| `/categories/best-seller` | GET | Get best seller categories |
| `/categories/:slug/vibes` | GET | Get category vibes |
| `/categories/:slug/occasions` | GET | Get category occasions |
| `/categories/:slug/hashtags` | GET | Get category hashtags |
| `/categories/:slug/loyalty-stats` | GET | Get loyalty statistics |
| `/categories/:slug/recent-orders` | GET | Get recent orders for social proof |
| `/categories/:slug/ai-suggestions` | GET | Get AI suggestions |
| `/categories/:slug/page-config` | GET | Get dynamic page configuration |

---

### 3. Products (`productsApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | Get all products with filters |
| `/products/:id` | GET | Get product by ID |
| `/products/featured` | GET | Get featured products |
| `/products/search` | GET | Search products |
| `/products/suggestions` | GET | Get search suggestions |
| `/products/popular-searches` | GET | Get popular search terms |
| `/products/new-arrivals` | GET | Get new arrivals |
| `/products/category/:slug` | GET | Get products by category |
| `/products/subcategory/:slug` | GET | Get products by subcategory |
| `/products/store/:id` | GET | Get products by store |
| `/products/:id/recommendations` | GET | Get recommendations |
| `/products/:id/related` | GET | Get related products |
| `/products/:id/track-view` | POST | Track product view |
| `/products/:id/analytics` | GET | Get product analytics |
| `/products/:id/frequently-bought` | GET | Get frequently bought together |
| `/products/:id/bundles` | GET | Get bundle products |
| `/products/:id/availability` | GET | Check product availability |

---

### 4. Stores (`storesApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stores` | GET | Get all stores with filters |
| `/stores/:id` | GET | Get store by ID |
| `/stores/:slug` | GET | Get store by slug |
| `/stores/nearby` | GET | Get nearby stores |
| `/stores/search` | GET | Search stores |
| `/stores/featured` | GET | Get featured stores |
| `/stores/:id/reviews` | GET | Get store reviews |
| `/stores/:id/products` | GET | Get store products |
| `/stores/:id/follow` | POST | Follow a store |
| `/stores/:id/unfollow` | POST | Unfollow a store |
| `/stores/:id/analytics` | GET | Get store analytics |

---

### 5. Orders (`ordersApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders` | GET | Get user orders |
| `/orders` | POST | Create new order |
| `/orders/:id` | GET | Get order by ID |
| `/orders/:id` | PUT | Update order |
| `/orders/:id/cancel` | POST | Cancel order |
| `/orders/:id/track` | GET | Track order delivery |
| `/orders/:id/reorder` | POST | Reorder previous order |
| `/orders/:id/invoice` | GET | Get order invoice |
| `/orders/stats` | GET | Get order statistics |

---

### 6. Cart (`cartApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cart` | GET | Get user cart |
| `/cart` | POST | Add item to cart |
| `/cart/:itemId` | PUT | Update cart item |
| `/cart/:itemId` | DELETE | Remove from cart |
| `/cart/validate` | POST | Validate cart |
| `/cart/apply-coupon` | POST | Apply coupon code |
| `/cart/remove-coupon` | DELETE | Remove coupon |

---

### 7. Wallet (`walletApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wallet` | GET | Get wallet balance |
| `/wallet/transactions` | GET | Get transaction history |
| `/wallet/add-money` | POST | Add money to wallet |
| `/wallet/withdraw` | POST | Withdraw from wallet |
| `/wallet/transfer` | POST | Transfer to another user |
| `/wallet/redeem-coins` | POST | Redeem coins |
| `/wallet/gift-cards` | GET | Get gift cards |
| `/wallet/gift-cards/purchase` | POST | Purchase gift card |
| `/wallet/expiring-coins` | GET | Get expiring coins |
| `/wallet/coin-rules` | GET | Get coin earning rules |
| `/wallet/scheduled-drops` | GET | Get scheduled coin drops |

---

### 8. Payments (`paymentService.ts`, `razorpayService.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/create-order` | POST | Create payment order |
| `/payments/verify` | POST | Verify payment |
| `/payments/history` | GET | Get payment history |
| `/payments/methods` | GET | Get saved payment methods |
| `/payments/methods/add` | POST | Add payment method |
| `/payments/methods/remove` | DELETE | Remove payment method |
| `/razorpay/create-order` | POST | Create Razorpay order |
| `/razorpay/verify` | POST | Verify Razorpay payment |

---

### 9. Notifications (`notificationsApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | Get all notifications |
| `/notifications/:id` | GET | Get notification by ID |
| `/notifications/:id/read` | POST | Mark as read |
| `/notifications/read-all` | POST | Mark all as read |
| `/notifications/settings` | GET | Get notification settings |
| `/notifications/settings` | PUT | Update notification settings |
| `/notifications/subscribe` | POST | Subscribe to push notifications |

---

### 10. Reviews (`reviewsApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reviews` | GET | Get reviews |
| `/reviews` | POST | Create review |
| `/reviews/:id` | GET | Get review by ID |
| `/reviews/:id` | PUT | Update review |
| `/reviews/:id` | DELETE | Delete review |
| `/reviews/:id/vote` | POST | Vote on review |
| `/reviews/product/:id` | GET | Get product reviews |
| `/reviews/store/:id` | GET | Get store reviews |

---

### 11. Wishlist (`wishlistApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wishlist` | GET | Get user wishlist |
| `/wishlist` | POST | Add to wishlist |
| `/wishlist/:productId` | DELETE | Remove from wishlist |
| `/wishlist/move-to-cart` | POST | Move to cart |
| `/wishlist/share` | POST | Share wishlist |

---

### 12. Offers (`offersApi.ts`, `realOffersApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/offers` | GET | Get all offers |
| `/offers/:id` | GET | Get offer by ID |
| `/offers/featured` | GET | Get featured offers |
| `/offers/categories/:slug` | GET | Get offers by category |
| `/offers/nearby` | GET | Get nearby offers |
| `/offers/claim` | POST | Claim offer |
| `/offers/redeem` | POST | Redeem offer |
| `/offers/scratch` | POST | Scratch card |
| `/offers/streak` | GET | Get streak offers |

---

### 13. Location Services (`locationService.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/location/update` | POST | Update user location |
| `/location/current` | GET | Get current location |
| `/location/history` | GET | Get location history |
| `/location/geocode` | POST | Geocode address |
| `/location/search` | POST | Search by location |
| `/location/validate` | POST | Validate address |
| `/location/timezone` | GET | Get timezone |
| `/location/nearby-stores` | GET | Get nearby stores |
| `/location/stats` | GET | Get location stats |

---

### 14. Bookings (`bookingApi.ts`, `hotelOtaApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bookings` | GET | Get user bookings |
| `/bookings` | POST | Create booking |
| `/bookings/:id` | GET | Get booking by ID |
| `/bookings/:id` | PUT | Update booking |
| `/bookings/:id/cancel` | POST | Cancel booking |
| `/bookings/:id/reschedule` | POST | Reschedule booking |
| `/hotel/search` | GET | Search hotels |
| `/hotel/:id` | GET | Get hotel details |
| `/hotel/:id/rooms` | GET | Get hotel rooms |
| `/hotel/:id/book` | POST | Book hotel room |
| `/hotel/:id/reviews` | GET | Get hotel reviews |

---

### 15. Social Features

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/follow/:userId` | POST | followApi.ts | Follow user |
| `/follow/:userId` | DELETE | followApi.ts | Unfollow user |
| `/followers` | GET | followApi.ts | Get followers |
| `/following` | GET | followApi.ts | Get following |
| `/feed` | GET | feedApi.ts | Get social feed |
| `/activity` | GET | activityApi.ts | Get activity |
| `/share` | POST | shareApi.ts | Share content |
| `/referrals` | GET | referralApi.ts | Get referrals |
| `/referrals/invite` | POST | referralApi.ts | Invite friend |
| `/streaks` | GET | streakApi.ts | Get user streaks |
| `/streaks/checkin` | POST | streakApi.ts | Daily check-in |
| `/leaderboard` | GET | leaderboardApi.ts | Get leaderboard |

---

### 16. Gamification (`gamificationApi.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/achievements` | GET | Get achievements |
| `/achievements/:id/claim` | POST | Claim achievement |
| `/challenges` | GET | Get challenges |
| `/challenges/:id/join` | POST | Join challenge |
| `/challenges/:id/complete` | POST | Complete challenge |
| `/points` | GET | Get points balance |
| `/points/history` | GET | Get points history |
| `/scratch-cards` | GET | Get scratch cards |
| `/scratch-cards/:id/scratch` | POST | Scratch card |
| `/tournaments` | GET | Get tournaments |
| `/tournaments/:id/join` | POST | Join tournament |

---

### 17. Bill Upload & Rewards

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/bills/upload` | POST | billUploadService.ts | Upload bill |
| `/bills/:id` | GET | billUploadService.ts | Get bill status |
| `/bills/:id/verify` | POST | billUploadService.ts | Verify bill |
| `/bills/:id/rewards` | GET | billUploadService.ts | Get bill rewards |
| `/earn/projects` | GET | earningProjectsApi.ts | Get earning projects |
| `/earn/projects/:id` | GET | earningProjectsApi.ts | Get project details |
| `/earn/projects/:id/submit` | POST | earningProjectsApi.ts | Submit project |
| `/earn/social` | POST | socialMediaApi.ts | Earn from social |
| `/earn/referral` | POST | referralTierApi.ts | Referral earnings |

---

### 18. Support & Help

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/support/tickets` | GET | supportApi.ts | Get support tickets |
| `/support/tickets` | POST | supportApi.ts | Create ticket |
| `/support/tickets/:id` | GET | supportApi.ts | Get ticket details |
| `/support/tickets/:id/messages` | GET | supportChatApi.ts | Get chat messages |
| `/support/tickets/:id/reply` | POST | supportChatApi.ts | Reply to ticket |
| `/faq` | GET | supportApi.ts | Get FAQ |
| `/disputes` | GET | disputeApi.ts | Get disputes |
| `/disputes` | POST | disputeApi.ts | Create dispute |

---

### 19. Travel & Services

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/travel/flights/search` | GET | travelApi.ts | Search flights |
| `/travel/flights/:id` | GET | travelApi.ts | Get flight details |
| `/travel/flights/book` | POST | travelApi.ts | Book flight |
| `/travel/recharge` | GET | rechargeApi.ts | Get recharge options |
| `/travel/recharge` | POST | rechargeApi.ts | Make recharge |
| `/bills/pay` | POST | billPaymentApi.ts | Pay bills |
| `/insurance` | GET | insuranceApi.ts | Get insurance plans |
| `/insurance/quote` | POST | insuranceApi.ts | Get insurance quote |

---

### 20. Analytics & Telemetry

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/analytics/track` | POST | eventAnalytics.ts | Track events |
| `/analytics/page-view` | POST | analyticsService.ts | Track page view |
| `/analytics/search` | POST | searchAnalyticsService.ts | Track search |
| `/events/analytics/track` | POST | eventAnalytics.ts | Track analytics events |
| `/ads/impression` | POST | adsApi.ts | Track ad impression |
| `/ads/click` | POST | adsApi.ts | Track ad click |

---

### 21. Miscellaneous Services

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/articles` | GET | articlesApi.ts | Get articles |
| `/articles/:id` | GET | articlesApi.ts | Get article |
| `/videos` | GET | videosApi.ts | Get videos |
| `/videos/:id` | GET | videosApi.ts | Get video |
| `/creators` | GET | creatorsApi.ts | Get creators |
| `/creators/:id` | GET | creatorsApi.ts | Get creator profile |
| `/coupons` | GET | couponApi.ts | Get coupons |
| `/coupons/validate` | POST | couponApi.ts | Validate coupon |
| `/banks` | GET | bankOffersApi.ts | Get bank offers |
| `/brands` | GET | brandApi.ts | Get brands |
| `/campaigns` | GET | campaignsApi.ts | Get campaigns |
| `/flash-sales` | GET | flashSaleApi.ts | Get flash sales |
| `/quick-actions` | GET | quickActionsApi.ts | Get quick actions |

---

## WebSocket Events

### Real-Time Service (`realTimeService.ts`)

| Event | Direction | Description |
|-------|-----------|-------------|
| `order:created` | Server → Client | New order created |
| `order:updated` | Server → Client | Order status changed |
| `order:cancelled` | Server → Client | Order cancelled |
| `payment:success` | Server → Client | Payment successful |
| `payment:failed` | Server → Client | Payment failed |
| `notification:new` | Server → Client | New notification |
| `chat:message` | Server → Client | Chat message received |
| `offer:new` | Server → Client | New offer available |
| `cashback:earned` | Server → Client | Cashback credited |

---

## Connection Architecture

```
Consumer App
    │
    ▼
API Gateway (rez-api-gateway.onrender.com)
    │
    ├──► Auth Service → JWT validation, OAuth
    ├──► User Service → Profile, preferences
    ├──► Product Service → Catalog, search
    ├──► Store Service → Listings, details
    ├──► Order Service → Order management
    ├──► Payment Service → Payment processing
    ├──► Wallet Service → Coins, cashback
    ├──► Notification Service → Push, in-app
    ├──► Gamification Service → Achievements, streaks
    ├──► Support Service → Tickets, chat
    └──► Analytics Service → Events, tracking

Merchant App → /merchant/* → rez-merchant-service
Admin App → /admin/* → rez-admin-service
```

---

## Backend Microservices Inventory

| Service | Port | Description |
|---------|------|-------------|
| rez-api-gateway | 3000 | API Gateway, routing |
| rez-auth-service | 3001 | Authentication |
| rez-user-service | 3002 | User management |
| rez-product-service | 3003 | Product catalog |
| rez-store-service | 3004 | Store management |
| rez-order-service | 3005 | Order processing |
| rez-payment-service | 3006 | Payment processing |
| rez-merchant-service | 3007 | Merchant operations |
| rez-wallet-service | 3008 | Wallet, coins |
| rez-notification-service | 3009 | Notifications |
| rez-gamification-service | 3010 | Achievements |
| rez-support-service | 3011 | Help desk |
| rez-analytics-service | 3012 | Analytics |
| rez-search-service | 3013 | Search |
| rez-recommendation-service | 3014 | Recommendations |

---

## API Versioning

| Version | Base Path | Status |
|---------|-----------|--------|
| v1 | `/api/v1/*` | Current |
| v2 | `/api/v2/*` | In development |

---

## Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "data": null,
  "timestamp": "2026-04-26T10:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `FORBIDDEN` | 403 | Access forbidden |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/send-otp` | 3 | per hour |
| `/auth/verify-otp` | 5 | per hour |
| `/orders` | 10 | per minute |
| `/payments/*` | 5 | per minute |
| All others | 100 | per minute |

---

**Document Generated:** April 26, 2026
**Last Updated:** April 26, 2026
**Audited by:** Claude Code
