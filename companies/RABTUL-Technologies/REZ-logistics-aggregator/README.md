# REZ Logistics Aggregator

Multi-carrier shipping and tracking.

## Quick Start

```bash
npm install
npm run dev
```

## Supported Carriers

- DHL
- FedEx
- Delhivery
- BlueDart

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rates | Get shipping rates |
| POST | /api/book | Book shipment |
| GET | /api/track/:id | Track shipment |
