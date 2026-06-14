# Influencer Performance Service

**Port:** 5069

## Overview
Track influencer ROI, performance metrics, and attribution analysis.

## Features
- Performance metrics tracking
- ROI calculation
- Attribution modeling
- Dashboard analytics
- Trend analysis

## Models

### Performance
Performance metrics for influencer content.

### ROI
Return on investment calculations.

### Attribution
Multi-touch attribution tracking.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/performance | Record performance |
| GET | /api/performance/:id | Get influencer performance |
| GET | /api/performance/campaign/:id | Get campaign performance |
| GET | /api/performance/dashboard | Get dashboard |
| GET | /api/performance/roi | Get ROI report |
| POST | /api/performance/:id/roi | Calculate ROI |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-performance-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5069/health
```