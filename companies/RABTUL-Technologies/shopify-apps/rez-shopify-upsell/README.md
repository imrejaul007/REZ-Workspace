# ReZ Upsell - Shopify App

AI-powered checkout upsell for Shopify stores.

## Features

- [x] Checkout upsell blocks
- [x] Cart upsell
- [x] Thank you page upsell
- [x] AI-matched product recommendations
- [x] Custom discount codes
- [x] Analytics tracking
- [x] Mobile responsive

## Installation

```bash
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upsell/configure` | POST | Configure upsell for store |
| `/upsell/config/:shop` | GET | Get upsell config |
| `/upsell/get-offer` | POST | Get upsell offer for cart |
| `/upsell/track` | POST | Track upsell events |
| `/upsell/stats/:shop` | GET | Get upsell statistics |

## Configuration

```javascript
{
  shop: 'store.myshopify.com',
  tenantId: 'tenant_xxx',
  brandId: 'brand_xxx',
  products: [
    { productId: '123', variantId: '456', title: 'Product', price: 999 }
  ],
  discountPercentage: 10,
  position: 'checkout' | 'cart' | 'thank_you'
}
```

## Stats Tracked

- Total offers shown
- Total clicks
- Total accepted
- Total declined
- Conversion rate
- Revenue from upsells
