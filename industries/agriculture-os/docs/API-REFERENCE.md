# Agriculture OS API Reference

## Overview

Agriculture OS provides digital twin services for farms, crops, and equipment management.

## Base URL

```
Staging: http://localhost:3201
Production: https://agriculture-api.rtmn.io
```

## Farm Twin Service

### Create Farm
```
POST /api/farms
```

**Request Body:**
```json
{
  "name": "Green Valley Farm",
  "owner": {
    "name": "John Smith",
    "phone": "+1-555-0123",
    "email": "john@greenvalley.com"
  },
  "location": {
    "address": "123 Farm Road",
    "city": "Sacramento",
    "state": "CA",
    "country": "USA",
    "coordinates": { "lat": 38.5816, "lng": -121.4944 }
  },
  "totalArea": { "value": 500, "unit": "hectares" },
  "certifications": ["organic", "gap"]
}
```

### Get Farms
```
GET /api/farms?status=active&region=CA
```

### Get Farm by ID
```
GET /api/farms/:id
```

### Update Farm
```
PUT /api/farms/:id
```

### Get Farm Crops
```
GET /api/farms/:id/crops
```

### Get Farm Equipment
```
GET /api/farms/:id/equipment
```

## AI Agents

### Yield Predictor Agent

**Endpoint:** `POST /agents/yield-predictor`

#### Predict Yield
```json
{
  "action": "predict_yield",
  "cropId": "crop_id_here"
}
```

#### Analyze Crop Health
```json
{
  "action": "analyze_crop_health",
  "cropId": "crop_id_here"
}
```

#### Recommend Harvest
```json
{
  "action": "recommend_harvest",
  "farmId": "farm_id_here"
}
```

#### Market Advice
```json
{
  "action": "market_advice",
  "cropId": "crop_id_here"
}
```

## REZ CRM Integration

Connect with SAP Agriculture for ERP sync:

```bash
curl -X POST http://localhost:3091/api/crm/sync \
  -d '{"provider": "sap", "direction": "bidirectional"}'
```
