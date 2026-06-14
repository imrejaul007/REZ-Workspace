# INDUSTRY AI BUILD PLAN

## Goal
Audit and build all missing industry AI services to make all 24 industries production-ready and connected.

---

## CURRENT STATUS

| Status | Industries | Count |
|--------|------------|-------|
| ✅ Complete | Restaurant, Hotel, Salon, Healthcare, Fitness, Retail, Grocery, Education, Automotive, Fashion, Spa, Travel, Finance | 13 |
| ⚠️ Partial | Legal, Government, Agriculture, Sports | 4 |
| ❌ Missing | Energy, Media | 2 |
| **Total** | | **24** |

### What Needs Building

| Industry | Action | Effort |
|----------|--------|--------|
| **Legal** | Implement skeleton legal-ai (3 agents + features) | Medium |
| **Government** | Create industry-ai/government-ai (4 agents) | Medium |
| **Agriculture** | Create industry-ai/agriculture-ai (5 agents) | Medium |
| **Sports** | Create industry-ai/sports-ai (5 agents) | Medium |
| **Energy** | Create energy-os + energy-ai (3 agents) | High |
| **Media** | Create media-os + media-ai (4 agents) | High |

---

## IMPLEMENTATION APPROACH

### Phase 1: Complete Partial Services (Medium Priority)

#### 1.1 legal-ai - Implement skeleton
```
companies/hojai-ai/industry-ai/legal-ai/
├── src/
│   ├── index.ts              # Main entry (implement from CLAUDE.md)
│   ├── routes/
│   │   ├── cases.ts         # Case management
│   │   ├── clients.ts       # Client management
│   │   ├── documents.ts      # Document handling
│   │   └── contracts.ts     # Contract lifecycle
│   ├── services/
│   │   ├── case-service.ts   # Case management logic
│   │   ├── client-service.ts # Client management
│   │   └── compliance-service.ts # Compliance checking
│   └── agents/
│       ├── case-manager-agent.ts   # Case Manager Agent
│       ├── document-assistant-agent.ts # Document Assistant
│       └── compliance-checker-agent.ts # Compliance Checker
├── employees/               # AI employee definitions
└── CLAUDE.md               # Already exists
```

**Key Features:**
- Case management (filing, deadlines, status)
- Client intake and management
- Document generation and analysis
- Contract lifecycle management
- Compliance checking (GDPR, Indian laws)
- Court date tracking
- Billing and invoicing

#### 1.2 government-ai - Create new
```
companies/hojai-ai/industry-ai/government-ai/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/
│   │   ├── citizen-services.ts
│   │   ├── permits.ts
│   │   ├── benefits.ts
│   │   └── complaints.ts
│   ├── services/
│   │   ├── citizen-service.ts
│   │   ├── permit-service.ts
│   │   └── grievance-service.ts
│   └── agents/
│       ├── citizen-services-agent.ts
│       ├── permit-agent.ts
│       ├── grievance-agent.ts
│       └── compliance-agent.ts
├── employees/
├── CLAUDE.md
├── package.json
└── Dockerfile
```

**Key Features:**
- Citizen service navigation (RTGS, DigiLocker, etc.)
- Permit/license processing (trade license, building permit)
- Benefit eligibility calculation (schemes, subsidies)
- Grievance redressal (CPGRAMS integration)
- Department directory
- Document verification

#### 1.3 agriculture-ai - Create new
```
companies/hojai-ai/industry-ai/agriculture-ai/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── farms.ts
│   │   ├── crops.ts
│   │   ├── livestock.ts
│   │   └── market-prices.ts
│   ├── services/
│   │   ├── farm-service.ts
│   │   ├── crop-service.ts
│   │   ├── livestock-service.ts
│   │   └── market-service.ts
│   └── agents/
│       ├── yield-predict-agent.ts
│       ├── irrigation-agent.ts
│       ├── pest-detect-agent.ts
│       ├── market-agent.ts
│       └── equipment-agent.ts
├── employees/
├── CLAUDE.md
├── package.json
└── Dockerfile
```

**Key Features:**
- Farm management (land records, crop planning)
- Crop health monitoring & yield prediction
- Livestock tracking & health records
- Market price intelligence (Agmarknet, eNAM)
- Irrigation optimization
- Weather-based alerts
- Government scheme eligibility

#### 1.4 sports-ai - Create new
```
companies/hojai-ai/industry-ai/sports-ai/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── teams.ts
│   │   ├── players.ts
│   │   ├── matches.ts
│   │   ├── tickets.ts
│   │   └── merchandise.ts
│   ├── services/
│   │   ├── team-service.ts
│   │   ├── player-service.ts
│   │   ├── match-service.ts
│   │   └── ticket-service.ts
│   └── agents/
│       ├── scout-agent.ts
│       ├── fan-engagement-agent.ts
│       ├── ticket-pricing-agent.ts
│       ├── schedule-optimization-agent.ts
│       └── media-agent.ts
├── employees/
├── CLAUDE.md
├── package.json
└── Dockerfile
```

**Key Features:**
- Team & player management
- Match scheduling & statistics
- Ticket pricing optimization (dynamic pricing)
- Fan engagement campaigns
- Fantasy sports integration
- Media rights management
- Merchandise recommendations

---

### Phase 2: Create Missing Industries (High Priority)

#### 2.1 energy-os - Create complete industry OS
```
industries/energy-os/
├── src/
│   ├── index.ts              # Main entry (Port 5100)
│   ├── config/
│   │   ├── mongodb.ts
│   │   ├── redis.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   ├── Meter.ts
│   │   ├── Consumer.ts
│   │   ├── Consumption.ts
│   │   ├── Bill.ts
│   │   └── GridStatus.ts
│   ├── routes/
│   │   ├── consumption.routes.ts
│   │   ├── generation.routes.ts
│   │   ├── distribution.routes.ts
│   │   ├── meters.routes.ts
│   │   ├── billing.routes.ts
│   │   └── analytics.routes.ts
│   ├── services/
│   │   ├── consumption-service.ts
│   │   ├── billing-service.ts
│   │   ├── grid-service.ts
│   │   └── analytics-service.ts
│   └── utils/
│       └── logger.ts
├── CLAUDE.md
├── INTEGRATION-SPEC.md
├── package.json
├── tsconfig.json
└── Dockerfile
```

**Key Features:**
- Smart meter management
- Energy consumption tracking
- Power generation monitoring (solar, wind)
- Grid distribution optimization
- Outage prediction
- Renewable energy credits
- Carbon footprint tracking
- Dynamic pricing

#### 2.2 energy-ai - Create AI layer
```
companies/hojai-ai/industry-ai/energy-ai/
├── src/
│   ├── index.ts
│   ├── routes/
│   ├── services/
│   └── agents/
│       ├── consumption-analyst.ts
│       ├── grid-optimization-agent.ts
│       ├── outage-prediction-agent.ts
│       └── cost-optimization-agent.ts
├── employees/
├── CLAUDE.md
├── package.json
└── Dockerfile
```

#### 2.3 media-os - Create complete industry OS
```
industries/media-os/
├── src/
│   ├── index.ts              # Main entry (Port 5600)
│   ├── config/
│   ├── middleware/
│   ├── models/
│   │   ├── Content.ts
│   │   ├── Creator.ts
│   │   ├── Platform.ts
│   │   ├── Viewer.ts
│   │   └── AdInventory.ts
│   ├── routes/
│   │   ├── content.routes.ts
│   │   ├── distribution.routes.ts
│   │   ├── monetization.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── licensing.routes.ts
│   ├── services/
│   └── utils/
├── CLAUDE.md
├── INTEGRATION-SPEC.md
├── package.json
└── Dockerfile
```

**Key Features:**
- Content management (video, audio, articles)
- Multi-platform distribution
- Ad monetization & optimization
- Viewership analytics
- Rights & licensing management
- Subscription management
- Content recommendation
- Creator payouts

#### 2.4 media-ai - Create AI layer
```
companies/hojai-ai/industry-ai/media-ai/
├── src/
│   ├── index.ts
│   ├── routes/
│   ├── services/
│   └── agents/
│       ├── content-recommendation-agent.ts
│       ├── ad-optimization-agent.ts
│       ├── trending-agent.ts
│       └── engagement-agent.ts
├── employees/
├── CLAUDE.md
├── package.json
└── Dockerfile
```

---

### Phase 3: Docker Integration

Update root `docker-compose.yml` to include all new services:

```yaml
# Add to existing docker-compose.yml
services:
  # ... existing services ...

  # Industry AI Services
  legal-ai:
    build: ./companies/hojai-ai/industry-ai/legal-ai
    ports: ["4510:4510"]

  government-ai:
    build: ./companies/hojai-ai/industry-ai/government-ai
    ports: ["4511:4511"]

  agriculture-ai:
    build: ./companies/hojai-ai/industry-ai/agriculture-ai
    ports: ["4512:4512"]

  sports-ai:
    build: ./companies/hojai-ai/industry-ai/sports-ai
    ports: ["4513:4513"]

  energy-ai:
    build: ./companies/hojai-ai/industry-ai/energy-ai
    ports: ["4514:4514"]

  media-ai:
    build: ./companies/hojai-ai/industry-ai/media-ai
    ports: ["4515:4515"]

  # Industry OS Services
  energy-os:
    build: ./industries/energy-os
    ports: ["5100:5100"]

  media-os:
    build: ./industries/media-os
    ports: ["5600:5600"]
```

---

## FILE CREATION ORDER

1. **legal-ai** - Implement existing skeleton
2. **government-ai** - Create from scratch
3. **agriculture-ai** - Create from scratch
4. **sports-ai** - Create from scratch
5. **energy-os** - Create from scratch
6. **energy-ai** - Create from scratch
7. **media-os** - Create from scratch
8. **media-ai** - Create from scratch
9. **docker-compose.yml** - Update with all new services

---

## ARCHITECTURE PATTERNS TO FOLLOW

Based on existing implementations:

### Standard File Structure
```
src/
├── index.ts              # Main entry, Express app setup
├── config/               # Database, redis, logger configs
├── middleware/           # Auth, rate limiting, error handling
├── models/              # Mongoose schemas
├── routes/               # Express routers
├── services/             # Business logic
├── agents/               # AI agents
└── utils/               # Helper utilities
```

### Required Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "winston": "^3.11.0",
  "zod": "^3.22.0",
  "uuid": "^9.0.1"
}
```

### Health Check Pattern
```typescript
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'service-name',
    timestamp: new Date().toISOString()
  });
});
```

### Connector Pattern for Integration
```typescript
class ServiceConnector {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SERVICE_URL || 'http://localhost:PORT',
      timeout: 5000
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## SUCCESS CRITERIA

1. All 6 missing industry AI services created
2. All new services have:
   - Working `/health` endpoint
   - Basic CRUD routes
   - At least 3 AI agents
   - Docker support
3. Updated docker-compose.yml with all services
4. Documentation in CLAUDE.md for each service

---

## ESTIMATED WORK

| Service | Files | Estimated Lines |
|---------|-------|-----------------|
| legal-ai | 15 | ~2,000 |
| government-ai | 18 | ~2,500 |
| agriculture-ai | 18 | ~2,500 |
| sports-ai | 18 | ~2,500 |
| energy-os | 20 | ~3,000 |
| energy-ai | 12 | ~1,500 |
| media-os | 20 | ~3,000 |
| media-ai | 12 | ~1,500 |
| docker-compose | 1 | ~100 |
| **Total** | | **~18,600** |

---

## EXECUTION

This plan will be executed in 3 phases:
1. Phase 1: Complete 4 partial services (legal, government, agriculture, sports)
2. Phase 2: Create 2 missing industries (energy, media)
3. Phase 3: Docker integration
