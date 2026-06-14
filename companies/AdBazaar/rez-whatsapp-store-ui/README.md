# REZ WhatsApp Store UI

**Version:** 0.1
**Date:** May 2026

---

## WHAT IT DOES

```
WhatsApp Commerce → Storefront → Catalog Browsing → Checkout
```

### Features

| Feature | Description |
|---------|-------------|
| Product Catalog | Browse products with images and details |
| Shopping Cart | Add/remove items, adjust quantities |
| Order Management | Place and track orders |
| WhatsApp Checkout | Complete purchase via WhatsApp |
| Store Customization | Branding and theme settings |

---

## PAGES

| Page | Purpose |
|------|---------|
| `/` | Store homepage with featured products |
| `/products` | Product catalog with search/filter |
| `/products/[id]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/orders` | Order history and tracking |
| `/settings` | Store settings |

---

## TECHNOLOGY STACK

| Technology | Purpose |
|------------|---------|
| Next.js 14 | Framework |
| React Hook Form | Form handling |
| Tailwind CSS | Styling |
| Heroicons | Icon library |
| Recharts | Analytics |

---

## DEPLOYMENT

### Render

```
1. Connect GitHub repo
2. Add env vars
3. Deploy
```

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.rez.money
NEXT_PUBLIC_STORE_ID=your-store-id
```

---

## INTEGRATIONS

| Service | Purpose |
|---------|---------|
| Product Service | Product catalog |
| Order Service | Order management |
| WhatsApp API | Checkout integration |
| Payment Gateway | Payment processing |

---

## STATUS

| Component | Status |
|-----------|--------|
| Product Catalog | Built |
| Shopping Cart | Built |
| WhatsApp Checkout | Built |
| Order Management | Built |
| Deployment Ready | Ready |

---

**Built for scale, designed for growth.**
