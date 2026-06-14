# REZ CONSUMER - INTEGRATION MATRIX
**Date:** May 12, 2026

---

## ALL SERVICES & CONNECTIONS

### REZ-Scan (Universal QR Scanner)

| Connects To | API | Data Flow |
|-------------|-----|-----------|
| REZ-Intent-Graph | POST /intent/track | Scan events |
| verify-qr-service | POST /api/verify | Product verification |
| REZ-Agent | POST /agent/whatsapp | Notifications |
| REZ-Intelligence | POST /intent/track | Offline behavior |

### REZ-Expense (Receipt Scanner)

| Connects To | API | Data Flow |
|-------------|-----|-----------|
| REZ-Analytics | POST /track | Spend data |
| REZ-Merchant | GET /merchants | Competitor data |
| REZ-Intelligence | POST /spend/track | External spend |

### REZ-Assistant (Consumer AI)

| Connects To | API | Data Flow |
|-------------|-----|-----------|
| REZ-Mind | POST /chat | AI responses |
| REZ-Intent-Graph | POST /intent/track | Search intent |
| REZ-Agent | POST /agent/workflow | Automations |

### REZ-Save (Wishlist)

| Connects To | API | Data Flow |
|-------------|-----|-----------|
| REZ-Intelligence | POST /intent/track | Future intent |
| REZ-Agent | POST /agent/notify | Price alerts |

### REZ-Inbox (Email Import)

| Connects To | API | Data Flow |
|-------------|-----|-----------|
| REZ-Analytics | POST /track | Spend data |
| REZ-Intelligence | POST /travel/track | Travel plans |

---

## ENVIRONMENT VARIABLES

```env
# REZ-Scan
INTENT_API=https://rez-intent-graph.onrender.com
VERIFY_API=https://rez-verify-qr.onrender.com
AGENT_API=https://REZ-agent.onrender.com

# REZ-Expense
ANALYTICS_API=https://rez-analytics.onrender.com
MERCHANT_API=https://rez-merchant.onrender.com
INTELLIGENCE_API=https://rez-intelligence.onrender.com

# REZ-Assistant
MIND_API=https://REZ-mind.onrender.com
INTENT_API=https://rez-intent-graph.onrender.com
AGENT_API=https://REZ-agent.onrender.com

# REZ-Save
INTELLIGENCE_API=https://rez-intelligence.onrender.com
AGENT_API=https://REZ-agent.onrender.com
```

---

## DATA FLOW DIAGRAM

```
REZ-Scan ──── Scan ────→ REZ-Intent-Graph
       │
       └── Verify ────→ verify-qr-service

REZ-Expense ──── Spend ────→ REZ-Analytics
              │
              └── Competitor ────→ REZ-Merchant

REZ-Assistant ──── Query ────→ REZ-Mind
              │
              └── Intent ────→ REZ-Intent-Graph

REZ-Save ──── Wish ────→ REZ-Intelligence
          │
          └── Alert ────→ REZ-Agent
```

---

## INTERNAL APIs

### REZ-Scan
```
POST /api/scan - Scan QR
GET  /api/scan/history/:userId
GET  /api/scan/stats/:userId
```

### REZ-Expense
```
POST /api/expense/add
GET  /api/expense/history/:userId
GET  /api/expense/summary/:userId
```

### REZ-Assistant
```
POST /api/assistant/chat
GET  /api/assistant/preferences/:userId
POST /api/assistant/preferences/:userId
```

### REZ-Save
```
POST /api/save
GET  /api/save/:userId
DELETE /api/save/:itemId
POST /api/save/collection
```

---

## MOBILE APPS

| App | Connects To |
|-----|-------------|
| REZ-scan-ui | REZ-scan |
| REZ-expense-ui | REZ-expense |
| REZ-assistant-ui | REZ-assistant |
| REZ-save-ui | REZ-save |
