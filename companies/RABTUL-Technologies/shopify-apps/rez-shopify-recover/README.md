# ReZ Recover - Cart Recovery

Automated multi-channel cart recovery.

## Features

- [x] Track abandoned carts
- [x] Multi-channel recovery (Email → SMS → WhatsApp → Voice)
- [x] Shopify webhook integration
- [x] Recovery analytics

## Installation

```bash
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/track` | POST | Track abandoned cart |
| `/webhook/shopify` | POST | Shopify webhook |
| `/recovered` | POST | Mark cart as recovered |
| `/stats/:shop` | GET | Get recovery stats |
| `/carts/:shop` | GET | List abandoned carts |

## Recovery Sequence

1. **Email** - Immediate
2. **SMS** - 2 hours later
3. **WhatsApp** - 24 hours later
4. **Voice** - 48 hours later
