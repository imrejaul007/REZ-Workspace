# REZ Hotel Analytics Service

Hotel Analytics Dashboard - RevPAR, ADR, Occupancy & Channel Performance

**Port:** 4023

## Features

- RevPAR (Revenue Per Available Room) tracking
- ADR (Average Daily Rate) analytics
- Occupancy rate monitoring
- Channel performance analysis
- Booking trends and forecasting
- Guest analytics and segmentation
- Competitive intelligence
- Data export (JSON, CSV)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/analytics/dashboard/:hotelId | Main dashboard data |
| GET | /api/analytics/revpar/:hotelId | RevPAR trend analysis |
| GET | /api/analytics/bookings/:hotelId | Booking trends |
| GET | /api/analytics/channels/:hotelId | Channel performance |
| GET | /api/analytics/guests/:hotelId | Guest analytics |
| GET | /api/analytics/competitors/:hotelId | Competitive intelligence |
| GET | /api/analytics/forecast/:hotelId | Demand forecast |
| GET | /api/analytics/export/:hotelId | Export analytics data |

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
| PORT | 4023 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_hotel_analytics | MongoDB connection string |
