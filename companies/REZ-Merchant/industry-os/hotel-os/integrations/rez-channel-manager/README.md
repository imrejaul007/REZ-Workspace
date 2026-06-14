# REZ Hotel Channel Integration Service

OTA Channel Management - Booking.com, MakeMyTrip, Goibibo, Expedia, Airbnb, Google Hotel Ads

**Port:** 4021

## Features

- Multi-channel inventory synchronization (real API integrations)
- Real-time availability updates
- Rate plan management
- Booking synchronization from all channels
- Channel performance analytics
- Connection management with credential validation
- Sync logging and error tracking

## Supported Channels

| Channel | Commission | API Type |
|---------|------------|----------|
| Booking.com | 15% | XML API |
| MakeMyTrip | 15% | REST API |
| Goibibo | 15% | REST API |
| Expedia | 12% | REST API |
| Airbnb | 3% | REST API |
| Google Hotel Ads | 0% | Partner API |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/channels | List available channels |
| GET | /api/channels/:channel/info | Get channel credential requirements |
| POST | /api/connections | Connect a channel |
| GET | /api/connections/:hotelId | Get hotel channel connections |
| DELETE | /api/connections/:connectionId | Disconnect a channel |
| POST | /api/connections/:connectionId/test | Test channel connection |
| POST | /api/inventory/update | Update inventory across channels |
| POST | /api/rates/update | Update rates across channels |
| POST | /api/sync/:hotelId | Trigger full sync |
| GET | /api/bookings/:hotelId | Get bookings from all channels |
| POST | /api/bookings/:hotelId/fetch | Fetch new bookings from channels |
| GET | /api/analytics/:hotelId | Channel performance analytics |

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
| PORT | 4021 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_hotel_channels | MongoDB connection string |
| INTERNAL_SERVICE_TOKEN | - | Internal service authentication token |
| BOOKING_COM_API_URL | https://supply-xml.booking.com | Booking.com API URL |
| MMT_API_URL | https://api.makemytrip.com | MakeMyTrip API URL |
| GOIBIBO_API_URL | https://api.goibibo.com | Goibibo API URL |
| EXPEDIA_API_URL | https://api.expedia.com | Expedia API URL |
| AIRBNB_API_URL | https://api.airbnb.com | Airbnb API URL |
| GOOGLE_HOTEL_API_URL | https://hotelads.googleapis.com | Google Hotel API URL |
