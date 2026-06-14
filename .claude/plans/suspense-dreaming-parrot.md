# Genie AI - Complete Implementation Plan

## Context

The Genie AI codebase has significant gaps:
- **15+ services** have Dockerfiles but NO `src/` directory (cannot build)
- **6 services** have minimal implementation
- **20+ active TODOs** in existing code
- **40+ Employee AI** services are stubs
- **~200+ total services** across RTNM need implementation

The goal is to implement ALL Genie services to enterprise quality standards with isolated databases per service.

---

## Implementation Strategy

### Phase 1: Foundation & Core Services (Week 1-2)

**Goal:** Get the essential memory services running with full implementation

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-memory-service` | 4703 | P0 | Already exists - enhance with enterprise features |
| `genie-relationship-service` | 4704 | P0 | Build from scratch with graph model |
| `genie-briefing-service` | 4706 | P0 | Build from scratch with scheduling |
| `genie-sync-service` | 4707 | P0 | Build from scratch with conflict resolution |

**Enterprise Features:**
- [ ] Full Zod validation for all inputs
- [ ] Comprehensive error handling with typed errors
- [ ] Structured JSON logging (Winston/Pino)
- [ ] Health checks (liveness + readiness)
- [ ] Rate limiting (global + operation-specific)
- [ ] Security headers (Helmet.js)
- [ ] CORS configuration
- [ ] Tenant isolation middleware
- [ ] JWT authentication
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Docker multi-stage build
- [ ] Isolated MongoDB per service
- [ ] Redis caching layer
- [ ] OpenTelemetry tracing
- [ ] Prometheus metrics endpoint

---

### Phase 2: Intelligence Services (Week 2-3)

**Goal:** Build the AI-powered intelligence services

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-email-service` | 4710 | P1 | Gmail OAuth2, classification, summaries |
| `genie-document-service` | 4711 | P1 | PDF/Word/OCR, RAG queries |
| `genie-voice-service` | 4712 | P1 | Transcription, voice notes |
| `genie-meeting-service` | 4713 | P1 | Summaries, action items, decisions |
| `genie-calendar-service` | 4709 | P1 | Google/Outlook sync, briefings |
| `genie-call-service` | 4707 | P1 | AI screening, summaries |

**Features:**
- [ ] OAuth2 integration (Gmail, Google Calendar, Outlook)
- [ ] AI-powered summarization
- [ ] Action item extraction
- [ ] Multi-language support (33+ languages)
- [ ] Webhook handlers
- [ ] Background job processing (BullMQ)
- [ ] Retry logic with exponential backoff

---

### Phase 3: Integration Connectors (Week 3-4)

**Goal:** Build external platform integrations

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-slack-service` | 4710 | P2 | Workspace sync, message history |
| `genie-telegram-service` | 4711 | P2 | Bot integration, chat history |
| `genie-discord-service` | 4716 | P2 | Server sync, webhooks |
| `genie-whatsapp-service` | 4708 | P2 | AI commands, reminders |
| `genie-notion-service` | 4709 | P2 | Bidirectional sync |
| `genie-obsidian-service` | 4708 | P2 | Vault sync, graph integration |
| `genie-drive-connector` | 4717 | P2 | File access, sync |

**Features:**
- [ ] OAuth2/Bot token authentication
- [ ] Webhook handlers for all platforms
- [ ] Message parsing and classification
- [ ] Bi-directional sync logic
- [ ] Conflict resolution
- [ ] Rate limit handling per platform
- [ ] Error recovery and retry

---

### Phase 4: Supporting Services (Week 4-5)

**Goal:** Build utility and supporting services

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-privacy-service` | 4720 | P2 | Privacy controls, GDPR |
| `genie-project-service` | 4721 | P2 | Project management |
| `genie-household-service` | 4718 | P2 | Home coordination |
| `genie-browser-history-service` | 4714 | P2 | Browser insights |
| `genie-memory-review-service` | 4719 | P2 | Memory management |
| `genie-personal-os-gateway` | - | P1 | API orchestrator |
| `genie-wake-word-service` | 4722 | P2 | Wake word detection |

**Features:**
- [ ] Privacy controls (data export, deletion)
- [ ] GDPR compliance features
- [ ] Family/household multi-user context
- [ ] Browser extension integration
- [ ] Memory consolidation and cleanup
- [ ] API gateway with routing

---

### Phase 5: Voice Ecosystem (Week 5-6)

**Goal:** Complete the voice AI pipeline

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-voice` | 4760 | P1 | Unified voice assistant |
| `genie-wake-word-service` | 4580 | P1 | Wake word detection |
| `genie-tts-service` | 4761 | P2 | Text-to-speech |
| `genie-stt-service` | 4762 | P2 | Speech-to-text |

**Features:**
- [ ] Edge + Cloud STT fallback
- [ ] ElevenLabs TTS integration
- [ ] Wake word detection (DSP + Cloud)
- [ ] Intent processing pipeline
- [ ] Multi-language support
- [ ] Voice activity detection
- [ ] Noise reduction

---

### Phase 6: Business Intelligence for REZ Merchants (Week 6-8)

**Goal:** Enable business owners using REZ products to chat with Genie for insights and reports

**Use Case:** A restaurant owner using REZ Merchant can ask Genie:
- "What were my top-selling items this week?"
- "How many new customers did I get in June?"
- "Compare my sales vs last month"
- "Show me my peak hours"
- "Generate a weekly report"

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS OWNER LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────┐             │
│  │  REZ Merchant   │◄──►│  Genie Business (NEW)   │             │
│  │   Dashboard     │    │  Intelligence Service   │             │
│  └─────────────────┘    └───────────┬─────────────┘             │
│                                     │                           │
│  ┌───────────────────────────────────┼───────────────────────┐ │
│  │                    DATA CONNECTORS                        │ │
│  │  OrderTwin │ CustomerTwin │ MerchantTwin │ AnalyticsTwin │ │
│  └───────────────────────────────────┼───────────────────────┘ │
│                                     │                           │
│  ┌───────────────────────────────────┼───────────────────────┐ │
│  │                    GENIE MEMORY LAYER                     │ │
│  │         Business Context │ Preferences ? Insights          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### New Services

| Service | Port | Priority | Deliverables |
|---------|------|----------|--------------|
| `genie-business-intelligence-service` | 4725 | P0 | Query interface for business data |
| `genie-merchant-connector` | 4726 | P0 | Connect to REZ Merchant data |
| `genie-report-generator` | 4727 | P1 | Generate business reports |
| `genie-insight-engine` | 4728 | P1 | AI-powered insights |

#### API Endpoints

```
GET  /api/business/:merchantId/summary         - Business overview
GET  /api/business/:merchantId/sales           - Sales data
GET  /api/business/:merchantId/customers       - Customer analytics
GET  /api/business/:merchantId/orders          - Order insights
GET  /api/business/:merchantId/trends          - Trend analysis
GET  /api/business/:merchantId/report          - Generate report
POST /api/business/:merchantId/query           - Natural language query
GET  /api/business/:merchantId/dashboard       - Dashboard data
GET  /api/business/:merchantId/peak-hours      - Peak hours analysis
GET  /api/business/:merchantId/top-items       - Top selling items
GET  /api/business/:merchantId/customer-retention - Retention metrics
```

#### Data Connectors

| Connector | Connects To | Data Provided |
|-----------|-------------|---------------|
| `order-twin-connector` | REZ Order Service | Orders, items, amounts, trends |
| `customer-twin-connector` | REZ Customer Service | New customers, retention, LTV |
| `merchant-twin-connector` | REZ Merchant Service | Profile, settings, menu |
| `analytics-twin-connector` | REZ Analytics | Metrics, KPIs, forecasts |

#### Client Integration (DO App)

```typescript
// New hook: useGenieBusiness
interface UseGenieBusiness {
  getBusinessSummary: (merchantId: string) => Promise<BusinessSummary>;
  queryBusiness: (merchantId: string, query: string) => Promise<BusinessQueryResponse>;
  generateReport: (merchantId: string, type: ReportType) => Promise<Report>;
  getSalesInsights: (merchantId: string, period: Period) => Promise<SalesInsights>;
  getCustomerInsights: (merchantId: string) => Promise<CustomerInsights>;
  getTrends: (merchantId: string, metric: string) => Promise<TrendData>;
  getPeakHours: (merchantId: string) => Promise<PeakHours>;
  getTopItems: (merchantId: string, limit: number) => Promise<TopItems>;
}

// Usage
const { queryBusiness, generateReport } = useGenieBusiness(merchantId);

// Natural language query
const response = await queryBusiness('merchant-123', 'Show me sales this week vs last week');
// Returns: { answer: 'Your sales increased by 15% this week...', data: {...} }

// Generate report
const report = await generateReport('merchant-123', 'weekly');
// Returns: PDF/JSON report with charts and insights
```

#### UI Integration Points

| App | Integration | UI Component |
|-----|-------------|--------------|
| REZ Merchant Dashboard | Genie tab | Chat interface + quick actions |
| DO App | Business owner mode | Genie with business context |
| RisaCare | Business health | Business insights for merchants |

#### Report Types

| Report | Description | Format |
|--------|-------------|--------|
| `daily` | Daily summary | JSON, PDF |
| `weekly` | Weekly report | JSON, PDF |
| `monthly` | Monthly analysis | JSON, PDF |
| `custom` | Custom date range | JSON, PDF |
| `comparison` | Period comparison | JSON, PDF |
| `trends` | Trend analysis | JSON, PDF |

#### Quick Actions (Quick Replies)

| Action | Query | Response |
|--------|-------|----------|
| Sales today | "sales today" | Today's revenue, orders, avg order value |
| Top items | "top items" | Top 10 selling items |
| New customers | "new customers" | New customer count, growth |
| Peak hours | "peak hours" | Busiest times visualization |
| Weekly report | "weekly report" | Full weekly PDF report |
| Compare | "vs last week" | Comparison metrics |

---

## Standard Service Template

Every service will follow this structure:

```
genie-{service}/
├── src/
│   ├── index.ts              # Express app + middleware
│   ├── types.ts              # Zod schemas + TypeScript types
│   ├── config.ts             # Environment config validation
│   ├── routes/
│   │   └── {service}Routes.ts
│   ├── services/
│   │   └── {service}Service.ts
│   ├── models/
│   │   └── {service}Model.ts
│   ├── middleware/
│   │   ├── tenant.ts
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── asyncHandler.ts
│   │   └── response.ts
│   └── integrations/
│       └── externalClients.ts
├── tests/
│   ├── unit/
│   │   └── {service}.test.ts
│   └── integration/
│       └── {service}.test.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── CLAUDE.md
├── README.md
└── SECURITY.md
```

---

## Database Strategy (Isolated)

Each service gets its own MongoDB database:

| Service | Database | Collections |
|---------|----------|-------------|
| genie-memory | `genie_memory` | memories, tags, entities |
| genie-relationship | `genie_relationship` | relationships, interactions |
| genie-briefing | `genie_briefing` | briefings, schedules |
| genie-email | `genie_email` | emails, attachments, summaries |
| genie-calendar | `genie_calendar` | events, conflicts |
| genie-meeting | `genie_meeting` | meetings, transcripts, actions |
| genie-voice | `genie_voice` | voice_notes, transcriptions |
| genie-document | `genie_document` | documents, summaries |
| genie-slack | `genie_slack` | workspaces, channels, messages |
| genie-telegram | `genie_telegram` | users, chats, messages |
| genie-discord | `genie_discord` | servers, channels, messages |
| genie-whatsapp | `genie_whatsapp` | sessions, messages, commands |

---

## Enterprise Security Features

Every service will include:

1. **Authentication**
   - JWT validation
   - API key support
   - Service-to-service auth (internal token)

2. **Authorization**
   - Role-based access control
   - Tenant isolation
   - Resource-level permissions

3. **Security Headers**
   - Helmet.js
   - CORS (configurable)
   - HSTS ready

4. **Rate Limiting**
   - Global: 100 req/min
   - Write: 30 req/min
   - Read: 200 req/min

5. **Input Validation**
   - Zod schemas for all inputs
   - Sanitization
   - Type coercion

6. **Observability**
   - OpenTelemetry tracing
   - Prometheus metrics
   - Structured logging
   - Health checks

---

## Docker Compose Update

Update `docker-compose.genie.yml` to:
1. Fix build paths to point to actual service directories
2. Add health checks for all services
3. Add isolated MongoDB containers per service
4. Add Redis cluster for caching
5. Add nginx reverse proxy
6. Add monitoring stack (Prometheus + Grafana)

---

## Testing Strategy

| Level | Coverage Target | Tools |
|-------|----------------|-------|
| Unit | 80%+ | Jest/Vitest |
| Integration | 60%+ | Supertest |
| E2E | Critical paths | Playwright |

**Test Categories:**
- Happy path
- Error handling
- Validation
- Rate limiting
- Auth/Authz
- Tenant isolation
- Concurrent requests

---

## Files to Create/Modify

### New Files (~200+ services × ~10 files each)

Will create standard service templates for each missing service.

### Modify Existing Files

1. `docker/docker-compose.genie.yml` - Fix build paths
2. `deploy/start-all.sh` - Add all services
3. `companies/hojai-ai/GENIE-SERVICES.md` - Update canonical locations
4. `docker/docker-compose.full.yml` - Add monitoring stack

---

## Effort Estimate

| Phase | Services | Estimated Time |
|-------|----------|---------------|
| Phase 1 | 4 core | 2 weeks |
| Phase 2 | 6 intelligence | 2 weeks |
| Phase 3 | 7 integrations | 2 weeks |
| Phase 4 | 7 supporting | 2 weeks |
| Phase 5 | 4 voice | 2 weeks |
| Phase 6 | 4 business intelligence | 2 weeks |
| **Total** | **32 services** | **12 weeks** |

---

## Next Steps After Approval

1. Create standard service template
2. Implement Phase 1 services (genie-memory enhanced, genie-relationship, genie-briefing, genie-sync)
3. Write comprehensive tests
4. Update Docker Compose
5. Deploy to staging
6. Repeat for each phase

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP definitions per service |
| Integration complexity | Use shared integration patterns |
| Testing overhead | Automate test generation where possible |
| Database per service overhead | Use MongoDB Atlas shared tier initially |
| Long timeline | Parallelize independent services |

---

## Success Metrics

- [ ] All 32 Genie services have `src/` with implementation
- [ ] All services pass health checks
- [ ] >80% unit test coverage per service
- [ ] All services deploy via Docker Compose
- [ ] API response times < 200ms (p95)
- [ ] Zero security vulnerabilities (OWASP scan)
- [ ] All TODOs resolved
- [ ] Business owners can query Genie for reports
- [ ] Natural language business queries work
- [ ] Report generation (PDF/JSON) functional
