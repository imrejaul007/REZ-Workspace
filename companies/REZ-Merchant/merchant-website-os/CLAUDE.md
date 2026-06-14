# Merchant Website OS - Platform Overview

**Version:** 1.0.0
**Created:** June 1, 2026

---

## Overview

Merchant Website OS provides everything a merchant needs to create their own professional website.

### Services Available to Merchants

| Category | Services | How to Access |
|----------|----------|---------------|
| **Authentication** | Login, Signup, OTP, Social Login | API + SDK |
| **Payments** | UPI, Cards, Wallets, BNPL | API + SDK |
| **Wallet/Coins** | Balance, Cashback, Rewards | API + SDK |
| **Orders** | Cart, Checkout, Tracking | API + SDK |
| **Catalog** | Products, Inventory, Search | API + SDK |
| **Bookings** | Appointments, Reservations | API + SDK |
| **Notifications** | Push, SMS, Email, WhatsApp | API + SDK |
| **Analytics** | Dashboard, Reports | API + SDK |
| **AI** | Recommendations, Intent, Predictions | API + SDK |
| **Reviews** | Ratings, Feedback | API + SDK |
| **Loyalty** | Points, Tiers, Rewards | API + SDK |
| **QR** | Payment QR, Menu QR, Table QR | API + SDK |

---

## API Access

### REST API

Base URL: `https://api.rez.money`

```bash
# Auth
POST /api/auth/verify

# Payments
POST /api/payments/create

# Wallet
POST /api/wallet/credit

# Orders
POST /api/orders/create

# Notifications
POST /api/notifications/send
```

### SDK Installation

```bash
# NPM
npm install @rez/merchant-sdk

# CDN
<script src="https://cdn.rez.money/merchant-sdk.js"></script>
```

---

## Widget Integration

Add services with a single script tag:

```html
<!-- Add Payment Widget -->
<script src="https://cdn.rez.money/widgets/payment.js" 
  data-merchant="YOUR_MERCHANT_ID"></script>

<!-- Add Cart Widget -->
<script src="https://cdn.rez.money/widgets/cart.js"
  data-merchant="YOUR_MERCHANT_ID"></script>

<!-- Add Booking Widget -->
<script src="https://cdn.rez.money/widgets/booking.js"
  data-merchant="YOUR_MERCHANT_ID"></script>
```

---

## Available Widgets

| Widget | Purpose | Features |
|--------|---------|----------|
| `@rez/widget-payment` | Accept payments | UPI, Cards, Wallets |
| `@rez/widget-cart` | Shopping cart | Add, update, checkout |
| `@rez/widget-booking` | Appointments | Calendar, slots, confirm |
| `@rez/widget-reviews` | Customer reviews | Stars, text, photos |
| `@rez/widget-loyalty` | Loyalty program | Points, tiers |
| `@rez/widget-qr` | QR codes | Payment, menu, table |
| `@rez/widget-analytics` | Analytics | Dashboard, charts |
| `@rez/widget-chat` | Live chat | Support, AI bot |
| `@rez/widget-referral` | Referrals | Share, track, rewards |

---

## Industry Templates

### Restaurant
- Menu with QR ordering
- Table reservations
- Online ordering
- Kitchen display
- Reviews & ratings

### Hotel
- Room booking
- Payment gateway
- Guest management
- Housekeeping
- Reviews

### Salon
- Appointment booking
- Service menu
- Stylist profiles
- Loyalty program
- Before/after photos

### Retail
- Product catalog
- Inventory sync
- Online ordering
- Delivery tracking
- Rewards

### Fitness
- Class booking
- Membership plans
- Trainer profiles
- Progress tracking
- Challenges

---

## API Reference

### Authentication
```typescript
// Verify user
POST /api/auth/verify
{ "token": "jwt_token" }

// Get merchant token
POST /api/merchant/token
{ "merchantId": "..." }
```

### Payments
```typescript
// Create payment
POST /api/payments/create
{
  "amount": 500,
  "merchantId": "...",
  "customerId": "...",
  "method": "upi"
}

// Webhook for payment status
POST /api/webhooks/payment
```

### Orders
```typescript
// Create order
POST /api/orders/create
{
  "merchantId": "...",
  "items": [...],
  "customer": {...},
  "payment": {...}
}

// Track order
GET /api/orders/:id/track
```

---

## Mobile SDK

### React Native / Expo
```bash
npx expo install @rez/merchant-sdk
```

```typescript
import { REZPayment, REZWallet, REZCart } from '@rez/merchant-sdk';

// Payment
await REZPayment.checkout({
  amount: 500,
  merchantId: 'YOUR_ID'
});

// Wallet balance
const balance = await REZWallet.getBalance(userId);

// Cart
const cart = await REZCart.getCart(cartId);
```

---

## Support

- Documentation: `https://docs.rez.money`
- Support: `support@rez.money`
- Dashboard: `https://merchant.rez.money`
