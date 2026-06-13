# Manufacturing OS API Reference

## Overview

Manufacturing OS provides digital twin services for production management and quality control.

## Base URL

```
Staging: http://localhost:3121
Production: https://manufacturing-api.rtmn.io
```

## Product Twin Service

### Create Product
```
POST /api/products
```

**Request Body:**
```json
{
  "name": "Widget A",
  "sku": "WGT-001",
  "category": "Electronics",
  "specifications": {
    "weight": 0.5,
    "dimensions": { "length": 10, "width": 5, "height": 2 }
  },
  "bom": [
    { "component": "PCB", "quantity": 1, "unit": "piece" },
    { "component": "Casing", "quantity": 1, "unit": "piece" }
  ],
  "cost": { "material": 10, "labor": 5, "overhead": 3, "total": 18 }
}
```

### Get Products
```
GET /api/products?category=Electronics&limit=50&offset=0
```

### Get Product by ID
```
GET /api/products/:id
```

### Update Product
```
PUT /api/products/:id
```

## AI Agents

### Production Scheduler Agent
**Endpoint:** `POST /agents/scheduler`

```json
{
  "action": "optimize_schedule",
  "date": "2024-06-15"
}
```

### Quality Control Agent
**Endpoint:** `POST /agents/quality`

```json
{
  "action": "analyze_defects",
  "productionId": "production_id"
}
```

## REZ CRM Integration

Connect with SAP/Oracle:

```bash
curl -X POST http://localhost:3096/api/crm/sync \
  -d '{"provider": "sap", "direction": "bidirectional"}'
```
