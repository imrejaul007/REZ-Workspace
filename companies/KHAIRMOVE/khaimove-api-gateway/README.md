# KHAIRMOVE API Gateway

Unified entry point for all KHAIRMOVE services.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4600 | Server port |
| `RIDE_SERVICE_URL` | localhost:4601 | Ride service URL |
| `FLEET_SERVICE_URL` | localhost:4602 | Fleet service URL |
| `DELIVERY_SERVICE_URL` | localhost:4603 | Delivery service URL |
| `LOGISTICS_SERVICE_URL` | localhost:4604 | Logistics service URL |
| `RENTAL_SERVICE_URL` | localhost:4605 | Rental service URL |
| `BUZZLOCAL_SERVICE_URL` | localhost:4606 | BuzzLocal service URL |

## Endpoints

| Route | Service | Description |
|-------|---------|-------------|
| `/api/rides` | Ride | Ride requests |
| `/api/fares` | Ride | Fare estimates |
| `/api/drivers` | Ride | Driver endpoints |
| `/api/fleets` | Fleet | Fleet management |
| `/api/vehicles` | Fleet | Vehicle endpoints |
| `/api/dispatch` | Fleet | Dispatch endpoint |
| `/api/deliveries` | Delivery | Delivery requests |
| `/api/delivery-drivers` | Delivery | Delivery driver endpoints |
| `/api/carriers` | Logistics | Carrier list |
| `/api/rates` | Logistics | Shipping rates |
| `/api/shipments` | Logistics | Shipment management |
| `/api/packages` | Rental | Rental packages |
| `/api/rentals` | Rental | Rental bookings |
| `/api/pools` | BuzzLocal | Community pools |
