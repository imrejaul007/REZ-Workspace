# KHAIRMOVE Delivery Service

Hyperlocal delivery management with ML-powered ETA prediction.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deliveries` | List deliveries |
| POST | `/api/deliveries` | Create delivery |
| GET | `/api/deliveries/:id` | Get delivery |
| POST | `/api/deliveries/:id/cancel` | Cancel delivery |
| GET | `/api/delivery-drivers` | List drivers |
| PUT | `/api/delivery-drivers/:id/location` | Update location |

## Delivery Priorities

| Priority | Delivery Time | Base Price |
|----------|---------------|------------|
| Standard | 48 hours | ₹50 |
| Express | 24 hours | ₹100 |
| Instant | 4 hours | ₹200 |

## Pricing

- Per KG: ₹20
- Per KM: ₹5

## Integrations

- REZ Intelligence (Location Intel)
- RABTUL (Wallet, Notifications)
