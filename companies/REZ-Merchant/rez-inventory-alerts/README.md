# REZ Inventory Alerts Service

**Version:** 1.0.0  
**Service Name:** rez-inventory-alerts  
**Port:** 4625

---

## Overview

Stock level monitoring and alert management service. Monitors inventory levels, generates alerts for low/critical stock, and manages threshold configurations.

## Features

- **Threshold Management** - Configure low, critical, and reorder stock levels
- **Stock Checking** - Check stock levels and auto-generate alerts
- **Bulk Operations** - Check multiple products at once
- **Alert Management** - Create, resolve, snooze, and archive alerts
- **Product Monitoring** - Register products for continuous monitoring
- **Reports & Analytics** - Stock level reports and alert statistics

## Quick Start

```bash
cd rez-inventory-alerts
npm install
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Threshold Management
```
POST   /api/thresholds                    - Set threshold
GET    /api/thresholds/:merchantId       - List thresholds
GET    /api/thresholds/:merchantId/:pid   - Get threshold
PUT    /api/thresholds/:merchantId/:pid   - Update threshold
DELETE /api/thresholds/:merchantId/:pid  - Delete threshold
```

### Stock Checking
```
POST /api/check-stock        - Check single product
POST /api/check-stock/bulk   - Check multiple products
```

### Alert Management
```
GET    /api/alerts/:merchantId       - Get merchant alerts
GET    /api/alerts                   - Get all alerts
GET    /api/alerts/detail/:id        - Get alert details
PUT    /api/alerts/:id/resolve       - Resolve alert
PUT    /api/alerts/:id/snooze        - Snooze alert
DELETE /api/alerts/:id               - Delete alert
POST   /api/alerts/bulk/resolve      - Bulk resolve
```

### Products
```
POST /api/products           - Register product
GET  /api/products/:merchantId - Get products
PUT  /api/products/:id/stock - Update stock
```

### Reports
```
GET /api/reports/stats      - Alert statistics
GET /api/reports/low-stock   - Low stock report
```

## Environment Variables

```bash
PORT=4625                   # Service port (default: 4625)
```

## Alert Levels

| Level | Description | Threshold Comparison |
|-------|-------------|---------------------|
| critical | Immediate action required | stock <= criticalStock |
| low | Reorder recommended | stock <= lowStock |
| reorder | Reorder point reached | stock <= reorderPoint |
| none | Stock levels normal | stock > reorderPoint |

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```