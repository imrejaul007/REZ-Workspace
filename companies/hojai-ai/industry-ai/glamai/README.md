# GlamAI - Salon Intelligence OS

**Status:** ✅ Implemented
**Category:** Commerce / Beauty
**Type:** Industry AI Vertical
**Port:** 3000
**Tagline:** "The brain that makes the salon know you better than you know yourself."

---

## Overview

GlamAI is the unified AI orchestration layer for salon operations that connects:
- **Beauty Memory** - Hair color formulas, stylist notes, product reactions
- **REZ Mind Salon AI** - Recommendations, pricing, churn prediction
- **REZ Salon Ecosystem** - CRM, Booking, POS, Inventory
- **Genie services** - Personal AI memory and briefings
- **Nexha** - Supplier/procurement network

---

## Services Built

| Service | Purpose |
|---------|---------|
| **BeautyMemoryService** | Beauty-specific memory (hair color, notes, reactions) |
| **ServicePlanService** | AI service plan generation |
| **CustomerService** | Unified customer intelligence |
| **StylistService** | Stylist-facing APIs |
| **InventoryService** | Inventory intelligence |
| **RecommendationService** | Personalized recommendations |
| **BeautyGenieService** | Beauty-specific Genie |
| **TrainingAcademyService** | Stylist certification |

---

## Beauty Memory Schema

```typescript
interface BeautyMemory {
  hairType: 'straight' | 'wavy' | 'curly' | 'coily'
  hairTexture: 'fine' | 'medium' | 'coarse'
  scalpCondition: 'normal' | 'oily' | 'dry' | 'sensitive'
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
  hairColorHistory: HairColorFormula[]
  currentColorFormula: HairColorFormula
  stylistNotes: StylistNote[]
  productReactions: ProductReaction[]
  allergies: string[]
}
```

---

## API Endpoints

### Customer Profile
- `GET /api/customers/:id/profile` - Get beauty profile
- `PUT /api/customers/:id/profile` - Update beauty profile

### Service Plan
- `POST /api/customers/:id/service-plan` - Generate service plan

### Beauty Memory
- `POST /api/memory/hair-color` - Record hair color formula
- `POST /api/memory/stylist-note` - Add stylist note
- `POST /api/memory/product-reaction` - Record product reaction
- `GET /api/memory/:id/history` - Get memory history

### Stylist Operations
- `GET /api/stylists/:id/customers` - Get stylist's customers
- `GET /api/stylists/:id/today` - Today's appointments
- `GET /api/stylists/:id/customer/:cid` - Customer context
- `POST /api/stylists/note` - Add note during service
- `POST /api/stylists/service-complete` - Record service completion
- `POST /api/stylists/color` - Record hair color
- `POST /api/stylists/product-reaction` - Record reaction

### Customer Intelligence
- `GET /api/customers/:id/intelligence` - Full customer context
- `GET /api/customers/:id/recommendations` - Personalized recommendations

### Inventory
- `GET /api/inventory/alerts` - Get inventory alerts
- `GET /api/inventory/reorder` - Reorder recommendations
- `POST /api/inventory/reorder` - Trigger reorder

### Salon
- `GET /api/salon/:id/dashboard` - Salon dashboard
- `POST /api/session/checkin` - Customer check-in

---

## Bridges

| Bridge | Connects To |
|--------|-------------|
| **SalonBridge** | REZ Salon CRM (4012), Booking (4201), POS (4902), Inventory (4906) |
| **MindSalonBridge** | REZ Mind Salon AI (4010) |
| **GenieBridge** | Genie Memory (4703), Genie Briefing (4704) |
| **NexhaBridge** | Nexha Procurement (B2B commerce) |

---

## Related Services

### Salon AI Agents
- **Treatment Advisor** (Port 4813) - Bundle suggestions, upsells
- **Inventory Alert Agent** (Port 4814) - Stock alerts, forecasting

### GlamAI Stylist Tablet App
- **Location:** `glamai-stylist-app/`
- React tablet app for stylists

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Docker

```bash
docker-compose up
```

---

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/glamai
REDIS_URL=redis://localhost:6379
SALON_CRM_URL=http://localhost:4012
SALON_BOOKING_URL=http://localhost:4201
SALON_POS_URL=http://localhost:4902
SALON_INVENTORY_URL=http://localhost:4906
MIND_SALON_URL=http://localhost:4010
GENIE_MEMORY_URL=http://localhost:4703
NEXHA_URL=http://localhost:5000
```

---

## File Structure

```
glamai/
├── src/
│   ├── index.ts                # Main API server
│   ├── services/
│   │   ├── beautyMemoryService.ts
│   │   ├── servicePlanService.ts
│   │   ├── customerService.ts
│   │   ├── stylistService.ts
│   │   ├── inventoryService.ts
│   │   ├── recommendationService.ts
│   │   ├── beautyGenieService.ts
│   │   └── trainingAcademyService.ts
│   ├── bridges/
│   │   ├── salonBridge.ts
│   │   ├── mindSalonBridge.ts
│   │   ├── genieBridge.ts
│   │   └── nexhaBridge.ts
│   └── utils/logger.ts
├── glamai-stylist-app/         # Stylist Tablet App
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

**Last Updated:** 2026-06-14
