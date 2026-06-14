# REZ Inventory Sync Service

Real-time Inventory Sync for Multi-OTA Channel Manager

**Port:** 4027

## Features

- Real-time availability updates
- Channel-specific inventory management
- Price parity enforcement
- Booking ingestion from OTAs
- Conflict resolution
- Rate plan management
- Inventory locking for temporary holds
- Sync logging and analytics
- Automated sync via cron jobs

## Supported Channels

| Channel | ID |
|---------|-----|
| Booking.com | booking_com |
| MakeMyTrip | makemytrip |
| Goibibo | goibibo |
| Expedia | expedia |
| Airbnb | airbnb |
| Google Hotels | google_hotels |
| Hotels.com | hotels_com |
| Direct | direct |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/channels/:hotelId | Get hotel channels |
| POST | /api/channels | Register hotel channel |
| PUT | /api/channels/:channelId | Update channel settings |
| DELETE | /api/channels/:channelId | Remove channel |
| POST | /api/sync/inventory | Push inventory update to channels |
| POST | /api/sync/rates | Push rate updates |
| POST | /api/sync/full | Full sync for hotel |
| GET | /api/inventory/:hotelId | Get inventory snapshot |
| POST | /api/bookings/ingest | Receive booking from OTA |
| POST | /api/bookings/modify | Handle booking modification |
| POST | /api/bookings/cancel | Handle booking cancellation |
| GET | /api/bookings/:hotelId | Get ingested bookings |
| GET | /api/sync-logs/:hotelId | Get sync logs |
| GET | /api/rate-plans/:hotelId | Get rate plans |
| POST | /api/rate-plans | Create rate plan |
| GET | /api/stats/:hotelId | Get inventory sync stats |
| POST | /api/locks | Create inventory lock |
| DELETE | /api/locks/:lockId | Release inventory lock |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4027 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_inventory_sync | MongoDB connection string |
| BOOKING_COM_URL | https://supply-api.booking.com | Booking.com API URL |
| MMT_URL | https://api.makemytrip.com | MakeMyTrip API URL |
| GOIBIBO_URL | https://api.goibibo.com | Goibibo API URL |
| EXPEDIA_URL | https://api.expedia.com | Expedia API URL |
| AIRBNB_URL | https://api.airbnb.com | Airbnb API URL |
