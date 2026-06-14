# Price Optimization Service

Dynamic pricing strategies for AdBazaar.

## Overview

Complete price optimization with:
- Dynamic pricing rules
- Competitor-based pricing
- Demand-based adjustments
- Time-based pricing
- Segment-based pricing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pricing` | Create pricing |
| GET | `/api/pricing/:id` | Get pricing |
| PUT | `/api/pricing/:id` | Update pricing |
| POST | `/api/pricing/:id/optimize` | Optimize price |
| GET | `/api/pricing/:id/history` | Get history |
| GET | `/api/pricing/:id/stats` | Get stats |
| POST | `/api/pricing/:id/revert` | Revert optimization |

## Port

**5109**