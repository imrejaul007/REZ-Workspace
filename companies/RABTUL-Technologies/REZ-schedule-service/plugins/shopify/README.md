# REZ Schedule - Shopify App

Add appointment booking to your Shopify store.

## Installation

1. Go to Shopify Admin > Apps > Develop apps
2. Click "Create an app"
3. Add this app's webhook URL
4. Copy API credentials to your store settings

## Features

- Display booking widget on product pages
- Book appointments linked to products
- Sync bookings with Shopify orders
- Custom branding

## Setup

### 1. Configure API

Go to Settings > REZ Schedule and enter:
- Store URL
- API Key
- Webhook Secret

### 2. Add Widget to Products

Edit your theme's product template:

```liquid
{% if product.metafields.rez_schedule.enabled %}
  <div id="rez-booking-{{ product.id }}"></div>
  <script>
    window.REZ_SCHEDULE_CONFIG = {
      username: '{{ product.metafields.rez_schedule.username }}',
      slug: '{{ product.metafields.rez_schedule.slug }}',
      productId: '{{ product.id }}'
    };
  </script>
  <script src="https://cdn.rez.money/schedule/widget.js" defer></script>
{% endif %}
```

### 3. Add metafields to products

Create metafields:
- `rez_schedule.enabled` (boolean)
- `rez_schedule.username` (text)
- `rez_schedule.slug` (text)

## Webhook Events

The app subscribes to:
- `orders/create` - Link booking to order
- `products/update` - Sync settings

## Support

- Docs: docs.rez.money/schedule/shopify
- Support: support@rez.money
