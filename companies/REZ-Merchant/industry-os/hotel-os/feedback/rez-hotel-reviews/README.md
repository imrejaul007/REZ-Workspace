# REZ Hotel Reviews Service

**Port: 4026**

Review aggregation and sentiment analysis for REZ Hotel Ecosystem - collects, analyzes, and surfaces guest feedback.

## Overview

REZ Hotel Reviews Service provides:
- Review collection from multiple platforms
- Sentiment analysis
- Response management
- Rating aggregation
- Trend analysis

## Features

### Review Sources
- Google Reviews
- TripAdvisor
- Booking.com
- Direct guest feedback
- Internal surveys

### Sentiment Analysis
- Positive/Negative/Neutral classification
- Aspect-based analysis (cleanliness, service, etc.)
- Trend detection
- Alert generation

### Response Management
- Draft AI responses
- Manager review
- Publish responses
- Track response rate

### Analytics
- Overall rating calculation
- Rating breakdown by category
- Review velocity tracking
- Comparison benchmarks

## Quick Start

```bash
cd industry-os/rez-hotel-reviews-service
npm install
npm run dev
```

Service runs on **port 4026**.

## API Endpoints

### Reviews
```
GET  /api/reviews/:hotelId             - List reviews (filters)
GET  /api/reviews/:hotelId/:reviewId - Get review
POST /api/reviews                     - Add review
POST /api/reviews/bulk               - Bulk import
PUT  /api/reviews/:id/respond        - Add response
POST /api/reviews/:id/helpful         - Mark helpful
```

### Analytics
```
GET  /api/reviews/:hotelId/sentiment  - Sentiment analysis
GET  /api/reviews/:hotelId/ratings   - Rating breakdown
GET  /api/reviews/:hotelId/trends    - Rating trends
GET  /api/reviews/:hotelId/stats     - Review statistics
```

### Responses
```
GET  /api/responses/:hotelId          - List responses
POST /api/responses/draft            - Generate AI draft
PUT  /api/responses/:id/publish      - Publish response
```

## Usage Examples

### Add Review
```bash
curl -X POST http://localhost:4026/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "source": "google",
    "author": "John D.",
    "rating": 4,
    "title": "Great stay!",
    "content": "Beautiful rooms and excellent service",
    "visitDate": "2026-05-15",
    "roomType": "deluxe"
  }'
```

### Get Sentiment Analysis
```bash
curl "http://localhost:4026/api/reviews/hotel-123/sentiment?period=30days"
```

### Get Rating Trends
```bash
curl "http://localhost:4026/api/reviews/hotel-123/trends?period=6months"
```

### Generate Response Draft
```bash
curl -X POST http://localhost:4026/api/responses/draft \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "reviewId": "rev-456",
    "tone": "professional"
  }'
```

## Rating Categories

| Category | Description |
|----------|-------------|
| overall | Overall rating |
| cleanliness | Room/facility cleanliness |
| service | Staff service quality |
| location | Hotel location |
| amenities | Available amenities |
| value | Value for money |
| comfort | Room comfort |

## Architecture

```
rez-hotel-reviews-service/
├── src/
│   ├── index.ts                # Express server
│   ├── reviews.test.ts         # Tests
│   └── services/
│       └── reviews.service.ts  # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- Google Reviews API
- TripAdvisor API
- REZ PMS Service
- REZ Guest Mobile App
- REZ Notifications

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4026 | Service port |

## License

Proprietary - RTNM Group
