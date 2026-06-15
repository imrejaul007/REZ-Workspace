# CLAUDE.md - Dental Inventory Service

## Overview

**Service:** RisaCare Dental Inventory Service  
**Port:** 4752  
**Purpose:** Dental supplies inventory with auto-reorder  
**Story:** SmileCraft Dental Clinic - "clinic never runs out"

## Quick Commands

```bash
# Install and start
cd companies/RisaCare/risa-care-dental-inventory-service
npm install
npm start

# Health check
curl http://localhost:4752/health

# Initialize clinic inventory
curl -X POST http://localhost:4752/api/inventory/init \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "xxx"}'

# Get low stock items
curl http://localhost:4752/api/inventory/xxx/low-stock

# Get catalog
curl http://localhost:4752/api/inventory/catalog
```

## Architecture

```
Dental Inventory Service (4752)
├── Routes
│   ├── inventory.js      - Inventory CRUD
│   ├── reorder.js         - Reorder management
│   └── catalog.js        - Catalog routes
├── Models
│   └── inventory.js       - MongoDB schemas
│       ├── InventoryItem  - Supply item
│       ├── Order          - Order tracking
│       └── DENTAL_SUPPLIES - 40+ catalog
└── services
    └── nexha-integration.js - Nexha ProcurementOS
```

## Supply Categories

| Category | SKUs | Example |
|----------|------|---------|
| Implants | 5 | Titanium Implant |
| Anesthetics | 4 | Lidocaine 2% |
| Whitening | 3 | Professional Gel |
| Surgical | 5 | Forceps |
| Restorative | 6 | Composite Resin |
| Preventive | 4 | Sealant |
| Orthodontic | 3 | Brackets |
| Lab | 3 | Dental Stone |
| General | 8 | Gloves |

## Integration Points

| Service | Port | Purpose |
|---------|------|---------|
| Nexha | 5002/4320 | Procurement automation |
| RABTUL | 4004 | Payments |

## Story Timeline

| Time | Event | Endpoint |
|------|-------|----------|
| 1:00 PM | Inventory notice | `/api/inventory/:id/low-stock` |
| 1:00 PM | Auto-reorder | Nexha integration |
| 1:00 PM | RFQ created | Nexha ProcurementOS |

## Auto-Reorder Flow

1. Stock <= reorderPoint
2. Nexha.createRFQ()
3. Receive quotes
4. Accept best quote
5. Create order
6. Payment via RABTUL
7. Track delivery

## Testing

```bash
# Test health
curl http://localhost:4752/health

# Test init
curl -X POST http://localhost:4752/api/inventory/init \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "clinic123"}'

# Test low stock
curl http://localhost:4752/api/inventory/clinic123/low-stock

# Test catalog
curl http://localhost:4752/api/inventory/catalog

# Test category
curl http://localhost:4752/api/catalog/implant
```

## Notes

- MongoDB required (mongodb://localhost:27017/risacare-dental-inventory)
- 40+ dental supplies predefined
- Auto-reorder triggered when stock <= reorderPoint
- Nexha integration for procurement automation
