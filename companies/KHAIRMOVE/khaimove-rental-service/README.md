# KHAIRMOVE Rental Service

Hourly vehicle rentals with multiple vehicle types and packages.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Rental Packages

### Sedan (Cab)
| Duration | Price | Included KM |
|----------|-------|-------------|
| 2 hours | ₹250 | 10 km |
| 4 hours | ₹450 | 25 km |
| 8 hours | ₹800 | 60 km |
| 12 hours | ₹1,100 | 80 km |

### SUV
| Duration | Price | Included KM |
|----------|-------|-------------|
| 2 hours | ₹400 | 10 km |
| 4 hours | ₹700 | 25 km |
| 8 hours | ₹1,200 | 60 km |
| 12 hours | ₹1,600 | 80 km |

## Extra Charges

- Extra KM: ₹3/km
- Extra Hour: ₹50/hour
- Deposit: ₹1,000 (refundable)

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List packages |
| POST | `/api/rentals` | Create rental |
| GET | `/api/rentals` | List rentals |
| GET | `/api/rentals/:id` | Get rental |
| POST | `/api/rentals/:id/cancel` | Cancel rental |
| POST | `/api/rentals/:id/complete` | Complete rental |
