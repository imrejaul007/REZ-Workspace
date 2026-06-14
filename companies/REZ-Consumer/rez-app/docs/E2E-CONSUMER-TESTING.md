# E2E Consumer App Testing Documentation

**Document Version:** 1.0.0
**Last Updated:** 2026-04-29
**App Package ID:** money.rez.app

---

## Table of Contents

1. [Overview](#overview)
2. [Critical User Journeys](#critical-user-journeys)
   - [Journey 1: Browse → Add to Cart → Checkout](#journey-1-browse--add-to-cart--checkout)
   - [Journey 2: Store Search and Selection](#journey-2-store-search-and-selection)
   - [Journey 3: Order Tracking](#journey-3-order-tracking)
   - [Journey 4: Wallet Payment](#journey-4-wallet-payment)
   - [Journey 5: Loyalty Points Redemption](#journey-5-loyalty-points-redemption)
3. [Test Scenarios Matrix](#test-scenarios-matrix)
4. [Required TestIDs](#required-testids)
5. [Loading States & Error Handling](#loading-states--error-handling)
6. [Potential Missing Screens](#potential-missing-screens)
7. [Maestro Test Reference](#maestro-test-reference)
8. [Detox Test Reference](#detox-test-reference)

---

## Overview

This document outlines end-to-end testing requirements for the ReZ Consumer App. Testing is performed using:
- **Maestro** (primary for mobile flows) - YAML-based tests in `.maestro/`
- **Detox** (backup) - TypeScript tests in `e2e/`

### Testing Prerequisites

```bash
# Install Maestro CLI
brew install maestro

# Install Detox (if needed)
npm install detox --save-dev

# Build iOS app for Detox
npx detox build --configuration ios.sim.debug

# Run Maestro tests
maestro test .maestro/

# Run Detox tests
npx detox test
```

---

## Critical User Journeys

### Journey 1: Browse → Add to Cart → Checkout

#### Flow Diagram

```
Home → Categories/Explore → Product Page → Add to Cart → Cart → Checkout → Payment → Confirmation
```

#### Detailed Steps

| Step | Screen | Action | TestID/Element |
|------|--------|--------|----------------|
| 1 | Home | Launch app, verify home screen loads | `home-screen` |
| 2 | Home | Verify search bar is visible | `search-header` |
| 3 | Home | Tap cart icon to verify badge | `cart-icon`, `cart-badge` |
| 4 | Categories | Navigate to Categories tab | `tab-categories` |
| 5 | Categories | Verify categories list loads | `categories-screen` |
| 6 | Categories | Tap first category | `category-item-0` |
| 7 | Product List | Verify products load | `product-list`, `product-card-{index}` |
| 8 | Product List | Tap first product | `product-card-0` |
| 9 | Product Detail | Verify product page loads | `product-detail-screen` |
| 10 | Product Detail | Verify price displays | `product-price` |
| 11 | Product Detail | Tap Add to Cart | `add-to-cart-button` |
| 12 | Modal | Verify modal appears | `added-to-cart-modal` |
| 13 | Modal | Tap "View Cart" | `view-cart-button` |
| 14 | Cart | Verify cart screen | `cart-screen` |
| 15 | Cart | Verify item in cart | `cart-item-0` |
| 16 | Cart | Tap "Buy Now" | `buy-now-button` |
| 17 | Checkout | Verify checkout screen | `checkout-screen` |
| 18 | Checkout | Select delivery address | `address-section`, `address-item-0` |
| 19 | Checkout | Apply promo code (optional) | `promo-code-input`, `apply-promo-button` |
| 20 | Checkout | Select payment method | `payment-methods` |
| 21 | Checkout | Tap "Place Order" | `confirm-pay-button` |
| 22 | Confirmation | Verify success | `order-confirmation-screen`, `order-success-icon` |

#### Test Scenarios

**Scenario 1.1: Happy Path - Add to Cart and Checkout**
```
Preconditions: User logged in, cart empty
Steps: Complete flow steps 1-22
Expected: Order placed successfully, confirmation shown
```

**Scenario 1.2: Add Multiple Items to Cart**
```
Preconditions: User logged in, cart empty
Steps:
  1. Add first product (steps 4-11)
  2. Continue shopping
  3. Add second product
  4. Verify cart badge shows "2"
  5. Proceed to checkout
Expected: Both items visible in cart, total calculated correctly
```

**Scenario 1.3: Apply Promo Code**
```
Preconditions: Valid promo code "FIRST10" available
Steps:
  1. Complete steps 1-17
  2. Enter promo code "FIRST10"
  3. Tap Apply
  4. Verify discount applied
  5. Complete order
Expected: Discount reflected in total, order placed with discount
```

**Scenario 1.4: Empty Cart Handling**
```
Preconditions: Cart is empty
Steps: Navigate to cart screen
Expected: Empty state displayed with "Start Shopping" CTA
```

**Scenario 1.5: Quantity Adjustment in Cart**
```
Preconditions: Item in cart
Steps:
  1. Navigate to cart
  2. Tap increment (+) button
  3. Verify quantity updates
  4. Tap decrement (-) button
  5. Verify quantity updates
Expected: Quantity changes correctly, total recalculates
```

#### Loading States to Verify

| Screen | Loading Indicator | Timeout |
|--------|-------------------|---------|
| Home | Category cards skeleton | 3s |
| Categories | Grid skeleton | 2s |
| Product List | Card skeletons | 3s |
| Product Detail | Image placeholder, shimmer | 2s |
| Cart | Item skeletons | 2s |
| Checkout | Loading overlay on payment | 10s |

---

### Journey 2: Store Search and Selection

#### Flow Diagram

```
Home → Search → Store Results → Store Detail → View Products
```

#### Detailed Steps

| Step | Screen | Action | TestID/Element |
|------|--------|--------|----------------|
| 1 | Home | Tap search bar | `search-header` |
| 2 | Search | Enter store name in search | Search input |
| 3 | Search | Verify search results appear | `search-results` |
| 4 | Search | View store results section | `stores-list` |
| 5 | Search | Tap store card | `store-card-{index}` |
| 6 | Store Detail | Verify store page loads | `store-detail-screen` |
| 7 | Store Detail | View store info (name, rating, distance) | - |
| 8 | Store Detail | Tap "Book Now" or view products | `book-now-button` |
| 9 | Products | View store products | `product-list` |
| 10 | Products | Add product to cart | `add-to-cart-button` |

#### Test Scenarios

**Scenario 2.1: Search by Store Name**
```
Preconditions: User on home screen
Steps:
  1. Tap search bar
  2. Type store name (e.g., "Starbucks")
  3. Wait for suggestions
  4. Select from results
Expected: Matching stores displayed
```

**Scenario 2.2: Search by Category**
```
Preconditions: User on search screen
Steps:
  1. Type category name (e.g., "coffee shops")
  2. View results
Expected: Stores matching category shown
```

**Scenario 2.3: Filter Store Results**
```
Preconditions: Search results displayed
Steps:
  1. Tap filter icon
  2. Select rating filter (4+ stars)
  3. Apply filter
Expected: Only filtered stores shown
```

**Scenario 2.4: Sort Store Results**
```
Preconditions: Search results displayed
Steps:
  1. Tap sort button
  2. Select "Distance" or "Rating"
Expected: Stores sorted accordingly
```

**Scenario 2.5: View Store Details**
```
Preconditions: Store card visible
Steps:
  1. Tap store card
  2. Verify store name, rating, reviews
  3. Verify address/distance
  4. Verify operating hours
Expected: All store info displayed correctly
```

#### Loading States to Verify

| Screen | Loading Indicator | Timeout |
|--------|-------------------|---------|
| Search Input | Keyboard shows | Immediate |
| Search Results | Shimmer skeletons | 2s |
| Store List | Card placeholders | 3s |
| Store Detail | Hero image placeholder | 2s |

---

### Journey 3: Order Tracking

#### Flow Diagram

```
Order Placed → Order History → Order Detail → Live Tracking
```

#### Detailed Steps

| Step | Screen | Action | TestID/Element |
|------|--------|--------|----------------|
| 1 | Any | After order placed, verify confirmation | `order-confirmation-screen` |
| 2 | Home | Navigate to profile/orders | Profile tab or menu |
| 3 | Orders | View order history | `orders-list` |
| 4 | Orders | View order item | `order-item-{index}` |
| 5 | Order Detail | Verify order status | `order-status` |
| 6 | Order Detail | View tracking timeline | `tracking-timeline` |
| 7 | Order Detail | Verify ETA | Estimated delivery time |
| 8 | Order Detail | View delivery person (if applicable) | `delivery-person-info` |

#### Test Scenarios

**Scenario 3.1: View Active Orders**
```
Preconditions: User has active orders
Steps:
  1. Navigate to "My Orders"
  2. Verify "Active" tab selected by default
  3. View list of active orders
Expected: All active orders displayed with status
```

**Scenario 3.2: Track Order in Real-Time**
```
Preconditions: Order in "Preparing" or "On the Way" status
Steps:
  1. Tap on active order
  2. View tracking timeline
  3. Verify current status highlighted
  4. Wait for status update
Expected: Timeline updates in real-time
```

**Scenario 3.3: View Order Details**
```
Preconditions: Order exists
Steps:
  1. Tap order from list
  2. View order number, date, items
  3. View delivery address
  4. View payment summary
Expected: All order details visible
```

**Scenario 3.4: View Past Orders**
```
Preconditions: User has completed orders
Steps:
  1. Navigate to "My Orders"
  2. Tap "Past" tab
  3. View completed orders
Expected: Past orders listed with "Delivered" status
```

**Scenario 3.5: Reorder from Past Order**
```
Preconditions: Completed order exists
Steps:
  1. Open past order
  2. Tap "Reorder" button
  3. Verify items added to cart
Expected: Same items in cart, can proceed to checkout
```

#### Loading States to Verify

| Screen | Loading Indicator | Timeout |
|--------|-------------------|---------|
| Order List | Skeleton cards | 2s |
| Order Detail | Full page skeleton | 3s |
| Tracking Timeline | Step skeletons | 2s |
| Real-time Updates | Pull-to-refresh | 1s |

---

### Journey 4: Wallet Payment

#### Flow Diagram

```
Wallet Screen → Add Money → Select Amount → Payment → Success → Balance Updated
```

#### Detailed Steps

| Step | Screen | Action | TestID/Element |
|------|--------|--------|----------------|
| 1 | Home | Tap wallet balance chip | `wallet-balance-chip` |
| 2 | Wallet | Verify wallet screen | `wallet-screen` |
| 3 | Wallet | View current balance | `wallet-balance-display` |
| 4 | Wallet | Tap "Add Money" | `add-money-button` |
| 5 | Recharge | Verify recharge screen | `recharge-screen` |
| 6 | Recharge | Select preset amount | `amount-option-500` |
| 7 | Recharge | Select payment method | `payment-method-upi` |
| 8 | Recharge | Tap "Pay" | `pay-button` |
| 9 | Success | Verify payment success | `payment-success` |
| 10 | Wallet | Verify balance updated | `wallet-balance-display` |

#### Test Scenarios

**Scenario 4.1: Add Money with Preset Amount**
```
Preconditions: User on wallet screen with balance visible
Steps:
  1. Tap "Add Money"
  2. Select preset amount (e.g., 500)
  3. Select UPI payment
  4. Complete payment
Expected: Balance increases by 500, transaction recorded
```

**Scenario 4.2: Add Money with Custom Amount**
```
Preconditions: User on wallet screen
Steps:
  1. Tap "Add Money"
  2. Tap "Custom Amount"
  3. Enter amount (e.g., 750)
  4. Complete payment
Expected: Balance increases by 750
```

**Scenario 4.3: Use Wallet Balance for Purchase**
```
Preconditions: Sufficient wallet balance
Steps:
  1. Add item to cart
  2. Proceed to checkout
  3. Select "Wallet" payment method
  4. Complete order
Expected: Balance deducted, order placed
```

**Scenario 4.4: View Transaction History**
```
Preconditions: User has transactions
Steps:
  1. On wallet screen, scroll to transactions
  2. View recent transactions
  3. Tap transaction for details
Expected: Transaction details displayed
```

**Scenario 4.5: Insufficient Balance Handling**
```
Preconditions: Low wallet balance
Steps:
  1. Attempt purchase exceeding balance
  2. Select wallet payment
Expected: Error shown, prompt to add money
```

#### Loading States to Verify

| Screen | Loading Indicator | Timeout |
|--------|-------------------|---------|
| Wallet Home | Balance skeleton | 1s |
| Transaction List | Skeleton rows | 2s |
| Payment Processing | Loading spinner | 10s |
| Balance Update | Refresh animation | 1s |

---

### Journey 5: Loyalty Points Redemption

#### Flow Diagram

```
Loyalty Page → View Points → Browse Rewards → Redeem → Confirmation
```

#### Detailed Steps

| Step | Screen | Action | TestID/Element |
|------|--------|--------|----------------|
| 1 | Home | Navigate to Loyalty/Coins | Profile or Rewards tab |
| 2 | Loyalty | View current points/coins | `loyalty-points-display` |
| 3 | Loyalty | View tier status | Tier benefits section |
| 4 | Loyalty | Tap "Rewards" tab | `rewards-tab` |
| 5 | Rewards | Browse available rewards | `reward-catalog` |
| 6 | Rewards | Tap reward to redeem | `reward-item-{index}` |
| 7 | Redemption | Confirm redemption | `confirm-redemption-button` |
| 8 | Confirmation | Verify success | Success modal |

#### Test Scenarios

**Scenario 5.1: View Loyalty Points Balance**
```
Preconditions: User logged in
Steps:
  1. Navigate to loyalty page
  2. View current points balance
  3. View points breakdown (available, pending, expired)
Expected: Accurate point balance displayed
```

**Scenario 5.2: View Tier Progress**
```
Preconditions: User has loyalty tier
Steps:
  1. View tier card
  2. View progress to next tier
  3. View current tier benefits
Expected: Correct tier info, accurate progress
```

**Scenario 5.3: Daily Check-in**
```
Preconditions: User not checked in today
Steps:
  1. Tap "Daily Check-in" button
  2. Confirm check-in
  3. View points earned
Expected: Points added, streak incremented
```

**Scenario 5.4: Redeem Reward with Points**
```
Preconditions: Sufficient points balance
Steps:
  1. Browse rewards catalog
  2. Select reward
  3. View point cost
  4. Confirm redemption
  5. Receive voucher/confirmation
Expected: Points deducted, reward received
```

**Scenario 5.5: Redeem Reward - Insufficient Points**
```
Preconditions: Low points balance
Steps:
  1. Select reward requiring more points
  2. Attempt to redeem
Expected: Error shown, "Earn More" prompt
```

**Scenario 5.6: View Redemption History**
```
Preconditions: Past redemptions exist
Steps:
  1. Tap "History" tab
  2. View past redemptions
  3. Tap redemption for details
Expected: All redemptions listed with dates
```

#### Loading States to Verify

| Screen | Loading Indicator | Timeout |
|--------|-------------------|---------|
| Loyalty Page | Points skeleton | 1s |
| Rewards Catalog | Card skeletons | 2s |
| Redemption | Processing indicator | 3s |
| History | List skeletons | 2s |

---

## Test Scenarios Matrix

| Journey | Scenario | Priority | Tags | Estimated Duration |
|---------|----------|----------|------|-------------------|
| 1. Browse→Cart→Checkout | Happy path checkout | P0 | critical, payment | 2 min |
| 1. Browse→Cart→Checkout | Multiple items in cart | P1 | shopping | 2.5 min |
| 1. Browse→Cart→Checkout | Apply promo code | P1 | discount | 2 min |
| 1. Browse→Cart→Checkout | Empty cart handling | P2 | edge-case | 30s |
| 2. Store Search | Search by name | P0 | search | 1 min |
| 2. Store Search | Filter results | P1 | search, filter | 1.5 min |
| 2. Store Search | View store details | P1 | store-info | 1 min |
| 3. Order Tracking | View active orders | P0 | orders | 1 min |
| 3. Order Tracking | Real-time tracking | P1 | tracking | 3 min |
| 3. Order Tracking | Reorder | P2 | convenience | 1.5 min |
| 4. Wallet Payment | Add money preset | P0 | wallet, payment | 1.5 min |
| 4. Wallet Payment | Add money custom | P1 | wallet | 1.5 min |
| 4. Wallet Payment | Use for purchase | P0 | wallet | 2 min |
| 4. Wallet Payment | Insufficient balance | P2 | error-handling | 30s |
| 5. Loyalty | View points | P1 | loyalty | 30s |
| 5. Loyalty | Daily check-in | P1 | loyalty | 1 min |
| 5. Loyalty | Redeem reward | P0 | loyalty, redemption | 2 min |
| 5. Loyalty | Insufficient points | P2 | edge-case | 30s |

**Priority Levels:**
- **P0**: Must pass before release
- **P1**: Should pass before release
- **P2**: Nice to have, can be post-release

---

## Required TestIDs

### Navigation

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `tab-home` | Home tab | Required |
| `tab-categories` | Categories tab | Required |
| `tab-explore` | Explore tab | Required |
| `tab-earn` | Earn tab | Required |
| `tab-pay-in-store` | Pay-in-store center button | Required |
| `cart-icon` | Cart icon in header | Required |
| `cart-badge` | Cart item count badge | Required |
| `wallet-balance-chip` | Wallet balance on home | Required |

### Authentication

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `phone-input` | Phone number input | Required |
| `send-otp-button` | Send OTP button | Required |
| `otp-input-0` to `otp-input-5` | OTP digit inputs | Required |
| `verify-otp-button` | Verify OTP button | Required |
| `resend-otp-button` | Resend OTP link | Required |

### Home & Categories

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `home-screen` | Home screen root | Required |
| `search-header` | Search bar | Required |
| `categories-screen` | Categories screen | Required |
| `category-item-{index}` | Category cards | Required |
| `category-{slug}` | Category by slug | Optional |

### Products

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `product-list` | Product list container | Required |
| `product-card-{index}` | Product cards | Required |
| `product-detail-screen` | Product detail root | Required |
| `product-price` | Product price | Required |
| `add-to-cart-button` | Add to cart button | Required |
| `quantity-increment` | Quantity + button | Required |
| `quantity-decrement` | Quantity - button | Required |

### Cart

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `cart-screen` | Cart screen root | Required |
| `cart-item-{index}` | Cart items | Required |
| `buy-now-button` | Buy Now CTA | Required |
| `cart-empty-state` | Empty cart view | Required |
| `added-to-cart-modal` | Added to cart modal | Required |
| `view-cart-button` | View cart button | Required |
| `continue-shopping-button` | Continue shopping button | Required |

### Checkout

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `checkout-screen` | Checkout screen root | Required |
| `address-section` | Address section | Required |
| `address-list` | Address selection list | Required |
| `address-item-{index}` | Address options | Required |
| `promo-code-input` | Promo code input | Required |
| `apply-promo-button` | Apply promo button | Required |
| `promo-applied-badge` | Applied promo indicator | Required |
| `payment-methods` | Payment methods section | Required |
| `payment-method-wallet` | Wallet payment | Required |
| `payment-method-cod` | COD payment | Required |
| `payment-method-upi` | UPI payment | Required |
| `confirm-pay-button` | Place order button | Required |
| `order-confirmation-screen` | Confirmation screen | Required |
| `order-success-icon` | Success icon | Required |

### Store

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `store-detail-screen` | Store detail root | Required |
| `store-card-{index}` | Store cards in list | Required |
| `stores-list` | Store list container | Required |
| `book-now-button` | Book now CTA | Required |

### Booking

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `booking-screen` | Booking screen root | Required |
| `date-option-{index}` | Date picker items | Required |
| `time-slot-{index}` | Time slot options | Required |
| `confirm-booking-button` | Confirm booking | Required |
| `booking-confirmation-screen` | Booking confirmation | Required |
| `booking-success-icon` | Booking success icon | Required |

### Wallet

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `wallet-screen` | Wallet screen root | Required |
| `wallet-balance-display` | Balance display | Required |
| `add-money-button` | Add money button | Required |
| `recharge-screen` | Recharge screen | Required |
| `amount-option-{value}` | Preset amounts | Required |
| `custom-amount-input` | Custom amount input | Required |
| `pay-button` | Pay button | Required |
| `payment-success` | Payment success | Required |

### Loyalty

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `loyalty-screen` | Loyalty screen root | Required |
| `loyalty-points-display` | Points balance | Required |
| `rewards-tab` | Rewards tab | Required |
| `history-tab` | History tab | Required |
| `reward-catalog` | Rewards list | Required |
| `reward-item-{index}` | Reward items | Required |
| `confirm-redemption-button` | Confirm redemption | Required |

### Orders

| testID | Screen/Component | Status |
|--------|------------------|--------|
| `orders-list` | Orders list | Required |
| `order-item-{index}` | Order items | Required |
| `order-details` | Order details screen | Required |
| `order-status` | Order status | Required |
| `tracking-timeline` | Tracking timeline | Required |
| `delivery-person-info` | Delivery info | Optional |

---

## Loading States & Error Handling

### Loading States Checklist

For each screen, verify these loading indicators exist:

1. **Initial Load Skeletons**
   - Home screen: Category cards, featured products
   - Categories: Grid of category cards
   - Product list: Card skeletons
   - Product detail: Image placeholder, info skeleton
   - Cart: Item skeletons
   - Checkout: Full page skeleton
   - Wallet: Balance skeleton, transaction skeletons
   - Loyalty: Points skeleton, reward skeletons

2. **Action Loading States**
   - Add to cart: Button loading spinner
   - Apply promo: Loading indicator
   - Payment: Processing overlay
   - Order placement: Confirmation loading

3. **Refresh States**
   - Pull-to-refresh on all list screens
   - Refresh indicator animations

### Error States Checklist

1. **Network Errors**
   - Offline banner/message
   - Retry button
   - Cached data fallback (if available)

2. **API Errors**
   - Toast notifications for transient errors
   - Error modals for critical failures
   - Fallback UI with error message

3. **Validation Errors**
   - Inline error messages
   - Field highlighting
   - Clear error descriptions

4. **Empty States**
   - Empty cart message with CTA
   - No search results with suggestions
   - No orders with shop CTA

---

## Potential Missing Screens

Based on the codebase analysis, the following screens exist and should be tested:

### Existing Screens (to verify)

| Screen | Path | Notes |
|--------|------|-------|
| Home | `app/(tabs)/index.tsx` | Main landing page |
| Categories | `app/(tabs)/categories.tsx` | Category browsing |
| Cart | `app/cart.tsx` | Shopping cart |
| Checkout | `app/checkout.tsx` | Checkout flow |
| Wallet | `app/wallet-screen.tsx` | Wallet/coins |
| Loyalty | `app/loyalty.tsx` | Loyalty rewards |
| Order Tracking | `app/tracking.tsx` | Order tracking |
| Search | `app/search.tsx` | Global search |
| Store | `app/Store.tsx` | Store detail |
| Store Products | `app/StoreProductsPage.tsx` | Store products |

### Screens Potentially Missing (verify exists)

| Screen | Expected Path | Check |
|--------|---------------|-------|
| Product Detail | `app/product-page.tsx` | Verify testIDs |
| Order History | `app/order-history.tsx` | Verify testIDs |
| Address Selection | In checkout | Verify modal |
| Payment Selection | In checkout | Verify testIDs |
| Promo Code Modal | In checkout | Verify testIDs |

### Screens to Request (if missing)

| Screen | Purpose | Priority |
|--------|---------|----------|
| Wishlist | Save products for later | P1 |
| Recent Orders | Quick reorder | P1 |
| Store Reviews | View store ratings | P2 |
| Payment Methods Management | Add/remove payment | P1 |

---

## Maestro Test Reference

### Existing Tests

| File | Journey | Status |
|------|---------|--------|
| `.maestro/onboarding.yaml` | Authentication | Complete |
| `.maestro/add_to_cart.yaml` | Browse → Cart | Complete |
| `.maestro/checkout.yaml` | Checkout flow | Complete |
| `.maestro/wallet.yaml` | Wallet recharge | Complete |
| `.maestro/booking.yaml` | Service booking | Complete |

### Test Structure

```yaml
appId: money.rez.app
name: "Test Name"
tags:
  - critical
  - journey-name

---

# Launch and authenticate
- launchApp
- waitForAnimationToEnd

# Login if needed
- runFlow:
    when:
      visible: "Mobile number"
    file: helpers/login.yaml

# Main test flow
- tapOn:
    id: "element-id"

# Assertions
- assertVisible: "Expected text"
- extendedWaitUntil:
    visible:
      id: "element-id"
    timeout: 10000

# Screenshots for debugging
- takeScreenshot: "test_step_name"
```

### Helper Flows

Create `helpers/login.yaml` for reusable authentication:

```yaml
# helpers/login.yaml
---
- tapOn:
    id: "phone-input"
- inputText: "501234567"
- tapOn:
    id: "send-otp-button"
- extendedWaitUntil:
    visible:
      id: "otp-input-0"
    timeout: 10000
- tapOn:
    id: "otp-input-0"
- inputText: "123456"
```

---

## Detox Test Reference

### Existing Tests

| File | Journey | Status |
|------|---------|--------|
| `e2e/userJourney.test.ts` | All major journeys | Templates only |
| `e2e/purchaseFlow.test.ts` | Purchase flow | Templates only |
| `e2e/socialFeatures.test.ts` | Social features | Templates only |

### Test Structure

```typescript
describe('Journey Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete happy path', async () => {
    // Navigate to screen
    await element(by.id('tab-home')).tap();

    // Verify element
    await expect(element(by.id('home-screen'))).toBeVisible();

    // Interact
    await element(by.id('search-header')).tap();

    // Wait for element
    await waitFor(element(by.id('search-screen'))).toBeVisible().withTimeout(5000);

    // Take screenshot
    await device.takeScreenshot('test_step');
  });
});
```

---

## Appendix: Test Data

### Mock Data Files

| File | Purpose |
|------|---------|
| `data/checkoutData.ts` | Checkout items, promo codes, payment methods |
| `data/walletData.ts` | Wallet balance, transactions |
| `data/searchData.ts` | Search suggestions, mock results |
| `data/categoryData.ts` | Category listings |
| `data/homepageData.ts` | Featured products, banners |

### Test Credentials

```
Phone: 501234567
OTP: 123456 (test OTP)
```

### Test Promo Codes

| Code | Discount | Min Order |
|------|----------|-----------|
| FIRST10 | 10 | 50 |
| SAVE15 | 15% (max 20) | 80 |
| CASHBACK5 | 5 cashback | 100 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-29 | E2E Test Team | Initial documentation |

---

*End of Document*
