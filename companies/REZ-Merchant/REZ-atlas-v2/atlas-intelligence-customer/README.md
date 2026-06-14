# Atlas Intelligence Customer

**Port:** 5340 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

360° customer profiles with behavior analysis, segmentation, and lifetime value prediction.

## Features

- **Customer Profiles** - Complete customer view
- **Behavior Analysis** - Understand customer actions
- **Segmentation** - Group by characteristics
- **Lifetime Value** - Predict customer value
- **Churn Prediction** - Identify at-risk customers

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/:id` | Get customer profile |
| GET | `/api/customers/:id/segments` | Get customer segments |
| GET | `/api/segments` | List all segments |

## Quick Start

```bash
cd atlas-intelligence-customer
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5340/health
```

## Response Example

```json
{
  "id": "cust-123",
  "name": "Sample Merchant",
  "segment": "premium",
  "lifetimeValue": 250000,
  "engagement": 85,
  "churnRisk": "low"
}
```
