# KHAIRMOVE Ride Service

Core ride-hailing engine with ML-powered surge pricing, fraud detection, and 10% cashback.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fares/estimate` | Get fare estimate |
| POST | `/api/rides` | Request a ride |
| GET | `/api/rides` | List user's rides |
| GET | `/api/rides/:id` | Get ride details |
| POST | `/api/rides/:id/cancel` | Cancel ride |
| POST | `/api/rides/:id/complete` | Complete ride |
| POST | `/api/rides/:id/rate` | Rate ride |
| GET | `/api/drivers/nearby` | Find nearby drivers |
| PUT | `/api/drivers/:id/location` | Update driver location |
| POST | `/api/drivers/accept/:rideId` | Accept ride |

## Fare Structure

| Vehicle | Base | Per KM | Per Min |
|---------|------|--------|---------|
| Bike | ₹15 | ₹6 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 |
| Cab | ₹40 | ₹14 | ₹2 |
| SUV | ₹60 | ₹18 | ₹2.5 |

**Cashback:** 10% on every ride

## Integrations

- REZ Intelligence (Intent, Fraud, Location)
- RABTUL (Auth, Wallet, Notifications)

## OpenAPI

See `src/docs/openapi.yaml`

## Tests

```bash
npm test
```
