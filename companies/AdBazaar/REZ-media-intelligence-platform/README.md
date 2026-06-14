# REZ Media Intelligence Platform

**Scalio Competitor with Full Business Loop**

---

## What Makes Us Different

| Aspect | Scalio | REZ Media |
|--------|--------|-----------|
| Content Generation | ✅ | ✅ |
| Publishing | ✅ | ✅ |
| Leads | ❌ | ✅ |
| CRM | ❌ | ✅ |
| WhatsApp Followup | ❌ | ✅ |
| Orders | ❌ | ✅ |
| Payments | ❌ | ✅ |
| Revenue Attribution | ❌ | ✅ |
| Loyalty | ❌ | ✅ |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REZ MEDIA INTELLIGENCE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   MERCHANT TWIN (Brand Memory)                  │  │
│  │  Products • Customers • Brand • History • Winning Creatives     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   CONTENT ENGINE                             │  │
│  │  Reels • UGC • Banners • Emails • WhatsApp • Ads           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │               GROWTH INTELLIGENCE                           │  │
│  │  Analytics • Best Content • Recommendations                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   COMMERCE LOOP                             │  │
│  │  Leads → CRM → WhatsApp → Order → Payment → Loyalty       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd REZ-media-intelligence-platform
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Services
```bash
# Start all services
npm run dev

# Or individually:
npm run dev  # Port 5000 - Main platform
```

### 4. Health Check
```bash
curl http://localhost:5000/health
```

---

## Services

| Service | Port | Purpose |
|---------|------|---------|
| **Main Platform** | 5000 | Core - Merchant Twin, Content, Analytics |
| **REZ Services** | 5001 | CRM, WhatsApp, Loyalty, Notifications |
| **Platform APIs** | 5002 | Instagram, Facebook, WhatsApp, Google |

---

## API Examples

### 1. Create Merchant Twin
```bash
curl -X POST http://localhost:5000/api/merchant-twin \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "pizza_palace",
    "brand": {
      "name": "Pizza Palace",
      "industry": "restaurant",
      "tone": "fun"
    },
    "products": [
      {"name": "Margherita Pizza", "price": 299},
      {"name": "Pepperoni Pizza", "price": 349}
    ]
  }'
```

### 2. Generate Reel
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "pizza_palace",
    "type": "reel",
    "platform": "instagram",
    "goal": "Get more orders this weekend"
  }'
```

### 3. Track Payment
```bash
curl -X POST http://localhost:5000/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "pizza_palace",
    "contentId": "content_123",
    "type": "payment",
    "value": 299,
    "source": "instagram"
  }'
```

### 4. Get Full Funnel
```bash
curl http://localhost:5000/api/funnel/pizza_palace
```

---

## Environment Variables

### External AI Providers
```bash
OPENAI_API_KEY=sk-xxx          # platform.openai.com
ELEVENLABS_API_KEY=xxx          # elevenlabs.io
HEYGEN_API_KEY=xxx             # app.heygen.com
RUNWAY_API_KEY=xxx             # app.runwayml.com
```

### REZ Ecosystem
```bash
HOJAI_GATEWAY=http://localhost:4870
MIND_API=http://localhost:4990
```

### Platform APIs
```bash
META_ACCESS_TOKEN=xxx          # Meta Business
WHATSAPP_ACCESS_TOKEN=xxx     # WhatsApp Business
```

---

## Key Endpoints

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/merchant-twin` | POST | Create merchant brand memory |
| `/api/generate` | POST | Generate content |
| `/api/analytics/:id` | GET | Performance analytics |
| `/api/track` | POST | Track conversion |
| `/api/funnel/:id` | GET | Full funnel report |
| `/api/recommend` | POST | AI recommendations |
| `/api/publish` | POST | Publish to platform |

---

## Files

```
REZ-media-intelligence-platform/
├── src/
│   ├── index.ts              # Main platform (Port 5000)
│   ├── ai-providers.ts       # OpenAI, ElevenLabs, HeyGen, Runway, Flux
│   ├── rez-services.ts        # CRM, WhatsApp, Loyalty, Notifications (Port 5001)
│   └── platform-integrations.ts # Instagram, Facebook, WhatsApp, Google (Port 5002)
├── .env.example              # Environment template
├── package.json
└── README.md
```

---

## Status

| Component | Status |
|-----------|--------|
| Merchant Twin | ✅ Ready |
| Content Generation | ✅ Ready (needs AI keys) |
| Analytics | ✅ Ready |
| Attribution | ✅ Ready |
| Commerce Loop | ✅ Ready |
| WhatsApp Integration | ✅ Ready |
| Platform APIs | ✅ Ready (needs credentials) |

---

## Support

For questions, check:
- `MEDIA-INTELLIGENCE-WHATS-NEEDED.md`
- `SCALIO-COMPETITOR-ANALYSIS.md`
