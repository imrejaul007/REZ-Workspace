# KHAIRMOVE Logistics Aggregator

Multi-carrier shipping aggregator with rate comparison.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Supported Carriers

| Carrier | API | Features |
|---------|-----|----------|
| Delhivery | REST | Rates, Track, Create, Cancel |
| BlueDart | REST | Rates, Track, Create, Cancel |
| DTDC | REST | Rates, Track, Create, Cancel |
| FedEx | REST + OAuth | Rates, Track, Create, Cancel |
| DHL | REST | Rates, Track, Cancel |

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/carriers` | List carriers |
| POST | `/api/rates` | Get shipping rates |
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments` | List shipments |
| GET | `/api/shipments/:id` | Get shipment |
| GET | `/api/shipments/:id/track` | Track shipment |
| POST | `/api/shipments/:id/cancel` | Cancel shipment |

## Environment Variables

```bash
DELHIVERY_API_KEY=your-key
BLUEDART_API_KEY=your-key
DTDC_API_KEY=your-key
DTDC_CUSTOMER_ID=your-id
FEDEX_CLIENT_ID=your-id
FEDEX_CLIENT_SECRET=your-secret
DHL_API_KEY=your-key
```
