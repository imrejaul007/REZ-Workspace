# Airzy Flight Service

**Port:** 4501  
**Company:** KHAIRMOVE  
**Purpose:** Flight search, booking, and management

## Overview

The Airzy Flight Service handles all flight-related operations including search, booking, cancellation, and price alerts.

## Features

- Flight search with filters (airlines, stops, price, time)
- Booking management (create, view, cancel)
- Real-time flight status
- Price alerts with notifications
- Multi-city search support

## API Endpoints

### Flight Search
- `GET /api/v1/flights/search` - Search flights
- `GET /api/v1/flights/:flightId` - Get flight details
- `GET /api/v1/flights/status/:flightNumber` - Get flight status

### Booking
- `POST /api/v1/flights/book` - Create booking
- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/:bookingId` - Get booking details
- `GET /api/v1/bookings/pnr/:pnr` - Get by PNR
- `POST /api/v1/bookings/:bookingId/cancel` - Cancel booking

### Price Alerts
- `POST /api/v1/flights/price-alerts` - Create alert
- `GET /api/v1/flights/price-alerts` - List alerts
- `DELETE /api/v1/flights/price-alerts/:alertId` - Delete alert

## Running

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/KHAIRMOVE/airzy/airzy-flight-service
npm run dev
curl http://localhost:4501/health
```

## Configuration

See `src/config/index.ts` for all configuration options. Key environment variables:
- `MONGODB_URI` - MongoDB connection
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `PORT` - Server port (default 4501)