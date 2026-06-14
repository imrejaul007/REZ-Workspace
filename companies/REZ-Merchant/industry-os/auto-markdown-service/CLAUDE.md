# CLAUDE.md - Auto Markdown Service

## Project Overview

**Name:** Auto Markdown Service  
**Purpose:** Prevent spoilage waste with automatic discount campaigns  
**FreshMart Story:** 3PM - "Tomatoes Expiry Risk: 24 Hours → Quick Sale Campaign"  
**Location:** `companies/REZ-Merchant/industry-os/auto-markdown-service/`  
**Port:** 4653

---

## FreshMart Story Context

### 3 PM - Spoilage Prevention

**Story:** Vegetable Twin notices tomatoes expiring in 24 hours → CoPilot recommends Quick Sale → AdBazaar launches promotion → BuzzLocal promotes to nearby residents

**How it works:**
1. At 3PM, scan inventory for items expiring within 24-72 hours
2. Calculate optimal markdown percentage based on hours remaining
3. Auto-create campaigns for high-risk items
4. Launch on AdBazaar with BuzzLocal targeting
5. Track recovery rate and prevent waste

---

## Markdown Rules

| Hours Until Expiry | Markdown % | Label |
|-------------------|------------|-------|
| < 24 hours | 20% off | Same day |
| < 48 hours | 15% off | 2 days left |
| < 72 hours | 10% off | 3 days left |
| < 1 week | 5% off | 1 week left |

---

## Architecture

```
auto-markdown-service/
├── src/
│   ├── index.js              # Main entry (Port 4653)
│   ├── models/
│   │   └── markdown.model.js  # ExpiringItem, MarkdownCampaign
│   ├── services/
│   │   └── markdown.service.js  # Core logic
│   └── routes/
│       └── markdown.routes.js    # API routes
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/markdown/dashboard/:storeId` | Spoilage dashboard |
| POST | `/api/markdown/scan/:storeId` | Scan for expiring items |
| POST | `/api/markdown/expiring` | Add expiring item |
| POST | `/api/markdown/approve/:itemId` | Approve markdown |
| POST | `/api/markdown/campaign/:id/launch` | Launch AdBazaar |
| GET | `/api/markdown/campaign/:id` | Get campaign details |
| GET | `/api/markdown/expiring/:storeId` | List expiring items |

---

## Data Models

### ExpiringItem
```javascript
{
  store_id: String,
  product_sku: String,
  product_name: String,
  category: 'produce' | 'dairy' | 'bakery' | 'meat',
  current_stock: Number,
  original_price: Number,
  expiry_date: Date,
  hours_until_expiry: Number,
  expiry_risk: 'low' | 'medium' | 'high' | 'critical',
  markdown_price: Number,
  markdown_percentage: Number,
  value_at_risk: Number,
  status: 'detected' | 'evaluating' | 'approved' | 'published' | 'sold_out' | 'expired'
}
```

### MarkdownCampaign
```javascript
{
  store_id: String,
  name: String,
  items: [{
    product_sku: String,
    original_price: Number,
    markdown_price: Number,
    markdown_percentage: Number,
    stock: Number,
    sold: Number
  }],
  starts_at: Date,
  ends_at: Date,
  status: 'draft' | 'active' | 'paused' | 'completed',
  adbazaar_campaign_id: String,
  total_recovery: Number,
  waste_prevented: Number  // kg/liters saved
}
```

---

## Usage Examples

### Scan for expiring items
```bash
curl -X POST http://localhost:4653/api/markdown/scan/freshmart-hsr \
  -H "Content-Type: application/json" \
  -d '{"hoursThreshold": 72, "categories": ["produce", "dairy"]}'
```

### Approve and launch campaign
```bash
curl -X POST http://localhost:4653/api/markdown/approve/ITEM_ID
curl -X POST http://localhost:4653/api/markdown/campaign/CAMPAIGN_ID/launch
```

### Response
```json
{
  "success": true,
  "message": "Campaign launched",
  "adbazaarCampaignId": "ADB-1234567890",
  "notifications": {
    "push": {
      "title": "🎉 Quick Sale!",
      "message": "3 items at up to 20% off!"
    },
    "buzzlocal": {
      "message": "🍅 Fresh items at discount prices at FreshMart!",
      "radius": 2000
    }
  }
}
```

---

## FreshMart 3PM Flow

```
3:00 PM - Vegetable Twin Scan
    ↓
GET /api/markdown/scan/freshmart-hsr
    ↓
Response: [
  { name: "Tomatoes", hours_left: 24, risk: "critical", value_at_risk: 2500 },
  { name: "Bananas", hours_left: 48, risk: "high", value_at_risk: 1200 }
]
    ↓
Auto-approve critical items
    ↓
POST /api/markdown/campaign/CAMPAIGN_ID/launch
    ↓
AdBazaar Campaign Created ✅
BuzzLocal Notifies Nearby ✅
    ↓
Inventory sold at discount ✅
Waste prevented ✅
```

---

## Integration

### With REZ-Grocery Inventory
- Receives inventory data with expiry dates
- Detects items approaching expiry

### With AdBazaar
- Creates local deal campaigns
- Targets nearby residents

### With BuzzLocal
- Sends neighborhood notifications
- Targets apartment societies

### With RIDZA
- Reports waste prevention savings
- Tracks financial recovery

---

## Development

```bash
# Install dependencies
cd auto-markdown-service
npm install

# Start service
npm start  # Port 4653

# Or development mode
npm run dev
```

---

**Last Updated:** June 13, 2026
