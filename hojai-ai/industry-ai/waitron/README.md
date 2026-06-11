# WAITRON - Restaurant AI

> "AI That Serves Better"

**Autonomous Restaurant Management System**

---

## What is Waitron?

Waitron is an AI-powered operating system for restaurants, cafes, and food service establishments. It combines AI agents, automated workers, voice agents, and complete backend to manage restaurant operations.

### Key Features

- **AI Waiter** - Take orders, answer questions, dietary accommodations
- **Kitchen Manager AI** - Order coordination, quality control
- **Reservation Manager AI** - Table bookings, seating, waitlist
- **Catering Manager AI** - Event orders, bulk bookings, quotes

### AI Capabilities (Claude-Powered)

- Natural language order understanding
- Smart menu recommendations
- Drink/food pairing suggestions
- Sentiment analysis
- Intelligent upsell recommendations
- Customer preference learning

---

## Quick Start

```bash
# Install and start
cd hojai-ai/industry-ai/waitron
npm install
npm run dev

# Health check
curl http://localhost:4820/health
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WAITRON LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     AI AGENTS                              │  │
│  │  • AI Waiter        • Kitchen Manager                   │  │
│  │  • Reservation Mgr  • Catering Manager                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│        ┌──────────────────┼──────────────────┐                │
│        ▼                  ▼                  ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Kitchen    │  │  Inventory   │  │   Finance    │     │
│  │    Agent     │  │    Agent     │  │    Agent     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               SUTAR INTEGRATION                          │  │
│  │  • Intent Bus (procurement intents)                       │  │
│  │  • Trust Score (supplier validation)                    │  │
│  │  • Discovery (find suppliers)                            │  │
│  │  • Contract (supplier agreements)                       │  │
│  │  • Negotiation (price optimization)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## SUTAR Integration (Key Feature)

Waitron connects to SUTAR for autonomous procurement:

### The Tomato Story

```
1. Customer orders pasta
   └── Waitron receives order

2. Kitchen prepares food
   └── Uses tomatoes

3. Inventory Agent detects low stock
   └── Publishes intent to SUTAR Intent Bus

4. SUTAR Discovery finds suppliers
   └── Fresh Farms (Trust: 92)
   └── AgriCorp (Trust: 78)

5. SUTAR Negotiation agrees terms
   └── ₹35/kg for 200kg

6. SUTAR Contract signs agreement
   └── Digital contract created

7. Delivery arrives next morning
   └── Kitchen continues operations
```

### API: SUTAR Integration

```bash
# Check procurement status
GET /api/sutar/procurement/status

# Get active contracts
GET /api/sutar/contracts

# Manual procurement trigger
POST /api/sutar/procurement
{
  "items": ["tomatoes", "basil"],
  "urgency": "high"
}
```

---

## AI APIs (Claude-Powered)

```bash
# Parse natural language orders
POST /api/ai/waiter/understand
{"text": "I want a vegetarian pasta with extra cheese"}

# Get recommendations
POST /api/ai/waiter/recommend
{"restaurantId": "rest-123", "preferences": {"dietary": ["vegetarian"]}}

# Drink pairing
POST /api/ai/waiter/suggest-pairing
{"items": ["Pasta", "Pizza"]}

# Sentiment analysis
POST /api/ai/waiter/analyze-sentiment
{"review": "Great food, slow service"}

# Intelligent upsell
POST /api/ai/waiter/upsell
{"items": ["Burger"], "budget": 500}
```

---

## Kitchen Display System

```
┌─────────────────────────────────────────────┐
│           WAITRON KITCHEN DISPLAY            │
├─────────────────────────────────────────────┤
│                                              │
│  #104  Table 5    12:34   ⏱️ 3:45       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  2x Butter Chicken                         │
│  1x Garlic Naan                            │
│  1x Dal Makhani                           │
│                                              │
│  Status: 🔥 Rush   │   Avg: 8 min         │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Inventory Management

```bash
# Get inventory
GET /api/inventory

# Response
{
  "items": [
    {"name": "Tomatoes", "quantity": "15kg", "reorder": "30kg", "status": "low"},
    {"name": "Chicken", "quantity": "25kg", "reorder": "20kg", "status": "ok"},
    {"name": "Basil", "quantity": "2kg", "reorder": "5kg", "status": "critical"}
  ]
}

# Auto-reorder trigger
POST /api/inventory/reorder
{"items": ["tomatoes", "basil"]}
```

---

## Karim's Restaurant (SpiceRoute)

```
12:00 PM - Lunch rush begins
└── KDS shows 15 active orders
    └── AI Waiter taking phone orders
        └── Reservation Manager handling bookings

12:30 PM - Tomatoes running low
└── Inventory Agent alerts
    └── SUTAR Intent Bus publishes
        └── Nexha finds supplier
            └── ₹35/kg negotiated
                └── Contract signed
                    └── Delivery 6 AM tomorrow

1:00 PM - Peak hour
└── AI Waiter suggests upsells
    └── "Add garlic bread? Customers love it"
        └── 30% order increase

6:00 PM - Review comes in
└── Sentiment analysis: "Amazing biryani!"
    └── Learning: Remember preference
        └── Next visit: Highlight biryani
```

---

## Integration with RTMN

```
Waitron ──→ SUTAR Intent Bus (procurement)
       ──→ SUTAR Discovery (suppliers)
       ──→ SUTAR Trust (validation)
       ──→ SUTAR Contract (agreements)
       ──→ Nexha (supplier network)
       ──→ RIDZA (payment processing)
       ──→ Genie (customer preferences)
       ──→ CorpPerks (staff management)
```

---

## API Reference

### Orders

```bash
# Create order
POST /api/orders
{"table": 5, "items": [{"name": "Butter Chicken", "qty": 2}]}

# Get active orders
GET /api/orders/active

# Update status
PATCH /api/orders/:id/status
{"status": "served"}
```

### Inventory

```bash
# Get inventory
GET /api/inventory

# Update stock
PATCH /api/inventory/tomatoes
{"quantity": 25, "unit": "kg"}

# Get alerts
GET /api/inventory/alerts
```

### Kitchen

```bash
# Get display
GET /api/kitchen/display

# Mark ready
POST /api/kitchen/:orderId/ready
{"item": "Butter Chicken"}
```

---

## Voice Agents

| Agent | Purpose |
|-------|---------|
| Phone Receptionist | Answer calls 24/7 |
| WhatsApp AI | Text/voice orders |
| IVR System | Auto-attendant |

---

## Environment Variables

```bash
PORT=4820
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100

# SUTAR Integration
SUTAR_INTENT_BUS=http://localhost:4154
SUTAR_DISCOVERY=http://localhost:4149
SUTAR_TRUST=http://localhost:4148

# AI (Claude)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Port

- **Main Service:** 4820
- **Voice Agents:** 4850-4860

---

## Status

| Component | Status |
|-----------|--------|
| AI Waiter | ✅ |
| Kitchen Manager | ✅ |
| Reservation Manager | ✅ |
| KDS Worker | ✅ |
| Inventory Tracking | ✅ |
| SUTAR Integration | ✅ |
| Voice Agents | ✅ |

---

## License

Proprietary - HOJAI AI
