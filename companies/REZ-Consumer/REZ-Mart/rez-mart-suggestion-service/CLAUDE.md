# CLAUDE.md - REZ Mart Suggestion Service

## Project Overview

**Name:** REZ Mart Suggestion Service  
**Purpose:** Smart Cart Suggestions - Frequently Bought Together  
**FreshMart Story:** 11AM - "Customer adds cereal → suggests milk, honey, fresh fruit"  
**Location:** `companies/REZ-Consumer/REZ-Mart/rez-mart-suggestion-service/`  
**Port:** 4118

---

## FreshMart Story Context

### 11 AM - Smart Cart

**Story:** Customer adds cereal to cart → Genie suggests milk, honey, fresh fruit

**How it works:**
1. Customer adds product to cart
2. Service analyzes cart items
3. Returns complementary product suggestions
4. Tracks which suggestions are accepted
5. Updates product relationships over time

---

## Architecture

```
rez-mart-suggestion-service/
├── src/
│   ├── index.js              # Main entry (Port 4118)
│   ├── models/
│   │   ├── relationship.model.js   # Product relationship model
│   │   └── cartAnalysis.model.js   # Cart analysis model
│   ├── services/
│   │   └── suggestion.service.js   # Core suggestion logic
│   └── routes/
│       └── suggestion.routes.js     # API routes
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/suggestions/product/:sku` | Get suggestions for product |
| POST | `/api/suggestions/cart` | Get suggestions for cart |
| POST | `/api/suggestions/cart/personalized` | Personalized suggestions |
| POST | `/api/suggestions/purchase` | Record purchase, update relationships |
| POST | `/api/suggestions/accept` | Mark suggestion as accepted |
| GET | `/api/suggestions/analytics/:storeId` | Get performance analytics |
| GET | `/api/suggestions/popular` | Get popular product pairs |

---

## Data Models

### ProductRelationship
```javascript
{
  productSku: String,        // Primary product
  relatedSku: String,        // Related product
  type: String,             // 'frequently_bought_together' | 'substitute' | 'complementary' | 'accessory'
  confidence: Number,        // 0-1, how often bought together
  coPurchaseCount: Number,    // Times bought together
  category: String,          // 'grocery' | 'dairy' | 'produce' | etc.
  rank: Number,              // Rank among suggestions
  active: Boolean
}
```

### CartAnalysis
```javascript
{
  cartId: String,
  userId: String,
  storeId: String,
  items: [{ sku, name, quantity, price, category }],
  suggestions: [{ sku, reason, confidence, accepted }],
  totalValue: Number,
  context: { timeOfDay, dayOfWeek, weather, festival }
}
```

---

## Usage Examples

### Get suggestions for product
```bash
curl http://localhost:4118/api/suggestions/product/cereal-001
```

### Get suggestions for cart
```bash
curl -X POST http://localhost:4118/api/suggestions/cart \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "sku": "cereal-001", "name": "Corn Flakes", "quantity": 1 }
    ]
  }'
```

### Response
```json
{
  "success": true,
  "suggestions": [
    { "sku": "milk-001", "score": 85, "reason": "Frequently bought together" },
    { "sku": "honey-001", "score": 65, "reason": "Goes great with this" },
    { "sku": "banana-001", "score": 55, "reason": "Frequently bought together" }
  ],
  "totalItems": 1,
  "potentialValueIncrease": 150
}
```

---

## Integration

### With REZ-Mart Cart Service
- Cart Service calls Suggestion Service when items added
- Suggestion Service returns complementary products
- Cart Service displays suggestions to user

### With REZ-Mart Order Service
- After checkout, Order Service calls `/api/suggestions/purchase`
- Relationships are updated based on co-purchases

### With Genie
- Can be called from Genie for personalized suggestions
- Integrates with household consumption patterns

---

## FreshMart Story Integration

### 11 AM - Smart Cart Flow
```
Customer adds cereal
    ↓
REZ-Mart Cart → Suggestion Service
    ↓
"Add cereal to cart"
    ↓
GET /api/suggestions/product/cereal-001
    ↓
Response: [milk, honey, banana]
    ↓
Customer sees: "Add milk to your cereal?"
    ↓
Customer accepts → POST /api/suggestions/accept
    ↓
Basket value increases ✅
```

---

## Development

```bash
# Install dependencies
cd rez-mart-suggestion-service
npm install

# Start service
npm start  # Port 4118

# Or development mode
npm run dev
```

---

**Last Updated:** June 13, 2026
