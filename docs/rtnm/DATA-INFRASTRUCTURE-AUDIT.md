# REZ ECOSYSTEM - COMPLETE DATA INFRASTRUCTURE AUDIT

**Date:** June 11, 2026  
**Auditor:** Claude Code (8 parallel agents)  
**Scope:** 958+ microservices across 14 companies

---

## 📊 EXECUTIVE SUMMARY

| Layer | Count | Status | Health |
|-------|-------|--------|--------|
| **MongoDB** | 156 services | ✅ Operational | 🟡 Inconsistent configs |
| **PostgreSQL** | 8 services | ✅ Operational | 🟡 Underutilized |
| **Neo4j** | 3 configured, 1 active | ⚠️ Needs attention | 🔴 Mixed implementations |
| **Redis** | 58 services | ✅ Operational | 🟡 No standardization |
| **Event Bus** | 5 implementations | ⚠️ Fragmented | 🔴 No Kafka |
| **Vector DB** | 3 services | ⚠️ Mock data | 🔴 Not production-ready |
| **Security** | Comprehensive | ✅ Strong | 🟡 Dev secrets |

---

## 🗄️ DATABASE LAYER

### MongoDB (156 Services)

| Metric | Value |
|--------|-------|
| Total Schemas | 6,195+ |
| Connection Patterns | 4 variants |
| Pool Sizes | 10, 20, 50 (inconsistent) |
| Write Concern | Inconsistent |

#### Connection Patterns Found

```javascript
// Standard (Recommended)
mongoose.connect(uri, { 
  maxPoolSize: 20, 
  minPoolSize: 5, 
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000 
})

// High-Traffic
mongoose.connect(uri, { 
  maxPoolSize: 50, 
  minPoolSize: 2, 
  retryWrites: true, 
  w: 'majority' 
})

// Legacy (No options) - ❌ BAD
mongoose.connect(MONGODB_URI)
```

#### Collections by Company

| Company | Services | Collections |
|---------|----------|-------------|
| RisaCare | 56 | profiles, wellness, visits, medications, etc. |
| RisnaEstate | 32 | properties, leads, deals, agreements, handovers |
| RABTUL | 40+ | orders, payments, karma, notifications |
| REZ-Consumer | 20+ | scans, warranties, bills, expenses |

#### 🔴 CRITICAL ISSUES

1. Inconsistent pool sizes (10 vs 20 vs 50)
2. Some services use in-memory Map instead of MongoDB (RisaCare elderly service)
3. No unified mongoose configuration module
4. Manual index creation vs schema-based indexes

---

### PostgreSQL (8 Services)

| Service | ORM | Tables | Special |
|---------|-----|--------|---------|
| **AssetMind** | Raw SQL | 23+ | TimescaleDB (time-series) |
| **verify-service** | Prisma | 10 | Fraud detection |
| **restauranthub** | Prisma | 90+ | Industry OS |
| **rez-now** | Prisma | 11 | Loyalty |
| **Hotel-OTA** | Prisma | 10 | Booking |

#### TimescaleDB Hypertables (AssetMind)

- `price_history` - Asset price data
- `score_history` - Scoring metrics
- `sentiment_history` - Social sentiment
- `prediction_history` - ML predictions
- `market_metrics` - Market data

#### 🔴 CRITICAL ISSUES

1. RisaCare (56 services) and RisnaEstate (32 services) use MongoDB only - missing relational integrity
2. No explicit connection pooling in Prisma configs
3. TimescaleDB retention policies not enforced in code

---

### Neo4j (Graph Databases)

| Service | Status | Nodes | Relationships |
|---------|--------|-------|---------------|
| **rider-circle-graph** | ✅ Active | 6 | 10 |
| **retail-knowledge-graph** | ⚠️ In-memory | 8 | 15 |
| **assetmind-knowledge-graph** | 📋 Schema only | 7 | 11 |
| **genie-commerce-graph** | ✅ Active | 5 | 4 |
| **workforce-graph-service** | ✅ Active | N/A | N/A |

#### Node Types

- Rider, Bike, Route, Group, Destination, ServiceCenter
- Product, Customer, Store, Supplier, Category, Brand
- Company, Person, Sector, Country, Theme, Event, Industry

#### 🔴 CRITICAL ISSUES

1. `retail-knowledge-graph` has Neo4j config but uses in-memory storage
2. Hardcoded passwords in source code
3. No connection pooling strategy
4. Missing query timeout configurations

---

## ⚡ CACHE LAYER

### Redis (58 Services)

| Metric | Value |
|--------|-------|
| Services | 58 |
| Libraries | ioredis, node-redis, BullMQ |
| Key Patterns | 35+ patterns |
| TTL Range | 5min - 90 days |

#### Key Naming Conventions

```
verify-qr:{prefix}:{hash}
idempotency:{userId}:{key}
circuit:{name}
ratelimit:{endpoint}:{identifier}
mfa:verify:{sessionToken}
cache:{entity}:{id}
```

#### TTL Strategy

| TTL | Use Case |
|-----|----------|
| 5 min | MFA verification |
| 15 min | Rate limiting |
| 1 hr | Circuit breaker, flags |
| 24 hr | Audit logs, devices |
| 90 days | Token blacklist |

#### 🔴 CRITICAL ISSUES

1. Multiple Redis client instances per service (3+ connections)
2. Some services use `redis.keys()` which blocks Redis in production
3. No centralized Redis configuration module
4. Inconsistent error handling (fail-closed vs fail-open)

---

## 🔄 EVENT BUS LAYER

### Implementations Found

| Service | Type | Technology | Port |
|---------|------|------------|------|
| **REZ-event-bus** | Primary | Redis Pub/Sub + MongoDB | 4025 |
| **REZ-dlq-service** | DLQ | BullMQ + Redis | N/A |
| **rez-webhook-service** | Webhook | Express + MongoDB | 4090 |
| **rez-websocket-hub** | Real-time | ws + Express | 4024 |
| **REZ-realtime-service** | Broadcast | ws + Redis Pub/Sub | N/A |

#### Event Categories

- `commerce.*` - orders, payments, cart
- `identity.*` - user, profile
- `loyalty.*` - points, tiers
- `intelligence.*` - intent, churn, LTV
- `notification.*` - push, email, SMS
- `whatsapp.*` - messages, sessions

#### 🔴 CRITICAL ISSUES

1. **No Kafka/RabbitMQ** - Code references "Kafka compatible" but only Redis Pub/Sub implemented
2. Duplicate event bus implementations
3. WebSocket hub lacks Redis adapter for horizontal scaling
4. Non-persistent retries (uses `setTimeout` instead of BullMQ)

---

## 🔍 SEARCH & VECTOR LAYER

### Vector Services

| Service | Provider | Dimensions | Status |
|---------|-----------|------------|--------|
| **embedding-service** | OpenAI | 1536/3072 | ✅ Production |
| **pgvector-service** | pgvector | 1536 | ⚠️ Mock in dev |
| **AssetMind Memory** | Pinecone | N/A | ⚠️ Not implemented |

### Search Patterns

1. Simple keyword matching
2. PostgreSQL full-text (tsvector, ts_rank)
3. Vector similarity (cosine distance)
4. **Hybrid Search** (BM25 + Vector with RRF)
5. MongoDB text search

### RAG Implementation

```typescript
// hojai-rag: Production RAG pipeline
- Semantic chunking
- Hybrid search (BM25 + Vector)
- Cross-encoder re-ranking
- Citation engine
- Query expansion
```

#### 🔴 CRITICAL ISSUES

1. `pgvector-service` uses mock in-memory storage in dev
2. Genie Memory Service uses in-memory DataStore - no persistence
3. AssetMind Pinecone in requirements.txt but not implemented
4. No centralized vector index management

---

## 🔐 SECURITY & COMPLIANCE

### Encryption

| Pattern | Implementation |
|---------|----------------|
| **Field-level** | AES-256-GCM (PII Vault Service) |
| **At rest** | MongoDB Client-Side Encryption |
| **In transit** | TLS/HTTPS enforced |
| **Key derivation** | SHA-256 |

### Authentication

| Mechanism | Services |
|-----------|----------|
| JWT Bearer (HS256) | 100+ services |
| OAuth 2.0 SSO | Okta, Auth0, Azure AD |
| API Keys | Service-to-service |
| OTP | MFA service |

### Authorization

| Pattern | Roles |
|---------|-------|
| RBAC | 7 roles: super_admin, admin, operator, analyst, support, merchant, viewer |
| ABAC | Policy evaluation engine |
| Service tokens | Internal auth bypass |

### PII Handling

| Function | Implementation |
|----------|----------------|
| Encryption | AES-256-GCM with IV + authTag |
| Masking | phone (***), email (***@domain), aadhaar (****XXXX) |
| Right to erasure | Full/anonymized/pseudonymized |
| Consent | Granular with expiration |

### Compliance

| Framework | Implementation |
|-----------|----------------|
| GDPR | Articles 15, 16, 17, 20 (Export, Rectify, Erase, Portability) |
| Indian PDPA | Consent management |
| IT Act 43A | Encrypted PII storage |

#### 🔴 CRITICAL ISSUES

1. JWT secret fallback in dev mode (`'dev-only-secret-do-not-use-in-production'`)
2. ENCRYPTION_KEY fallback in dev (`'default-32-char-key-for-dev!!'`)
3. bcrypt cost factor inconsistency (10 vs 12)
4. API keys stored as plain text
5. No key rotation mechanism documented

---

## 🔄 DATA PROCESSING PIPELINES

### ETL Patterns

| Pattern | Implementation |
|---------|----------------|
| Incremental ETL | Timestamp-based change detection |
| SCD Type 2 | Slowly changing dimensions |
| Aggregation | MongoDB $lookup joins |
| Batch | Cursor-based streaming |

### Scheduled Jobs

| Service | Job | Schedule |
|---------|-----|----------|
| hotel-management-master | Full ETL | Daily 2 AM |
| hotel-management-master | Incremental ETL | Hourly |
| hotel-management-master | Monthly Aggregation | 1st of month 3 AM |

### ML Pipelines

| Service | Purpose |
|---------|---------|
| Momentum Score | Price/volume/acceleration scoring |
| Prediction Service | Probability-based predictions |
| Briefing Engine | Daily briefing orchestration |
| Capital Flow Engine | Sector rotation tracking |
| Sentiment Analysis | Word-based sentiment |

#### 🔴 CRITICAL ISSUES

1. Many ML services use mock/random data instead of real inference
2. No proper observability on ETL job success rates
3. Missing data lineage tracking
4. No data retention policies defined

---

## 🚨 CRITICAL ISSUES SUMMARY

| Priority | Issue | Impact | Services |
|----------|-------|--------|----------|
| 🔴 P0 | In-memory storage instead of DB | Data loss on restart | RisaCare elderly, retail-graph |
| 🔴 P0 | Mock ML data | No real predictions | AssetMind ML services |
| 🔴 P0 | Dev secrets in code | Security vulnerability | Multiple services |
| 🟡 P1 | No Kafka (only Redis Pub/Sub) | Reliability risk | All event-driven services |
| 🟡 P1 | Inconsistent pool sizes | Performance issues | 156 MongoDB services |
| 🟡 P1 | No unified Redis config | Maintenance burden | 58 Redis services |
| 🟡 P1 | WebSocket no Redis adapter | Can't scale horizontally | rez-websocket-hub |
| 🟡 P1 | TimescaleDB policies not enforced | Data growth | AssetMind |
| 🟡 P2 | No data lineage tracking | Audit gaps | All ETL pipelines |
| 🟡 P2 | Missing key rotation | Compliance risk | Service tokens |

---

## ✅ RECOMMENDATIONS

### Immediate Actions (This Week)

1. **Create shared `@rez/mongodb` package**
   - Standardized connection config
   - Pool size: 20/5 (except high-traffic: 50/2)
   - Retry logic with exponential backoff

2. **Create shared `@rez/redis` package**
   - Standardized connection handling
   - Replace all `redis.keys()` with `redis.scan()`
   - Centralized TTL constants

3. **Fix security secrets**
   - Remove dev fallback secrets
   - Enforce JWT_SECRET and ENCRYPTION_KEY as required

### Short-term (This Month)

4. **Implement Kafka for production event bus**
   - Replace Redis Pub/Sub for critical events
   - Add circuit breakers

5. **Deploy proper vector storage**
   - Replace mock pgvector with production PostgreSQL + pgvector
   - Add Redis caching layer

6. **Add data lineage tracking**
   - Implement OpenLineage standard
   - Add Prometheus metrics for ETL jobs

### Long-term (This Quarter)

7. **Migrate RisaCare/RisnaEstate to PostgreSQL**
   - Add relational integrity for healthcare/real estate
   - Implement proper transactions

8. **Implement TimescaleDB retention enforcement**
   - Automated archival to cold storage
   - Compliance-ready data retention

9. **Create unified graph API layer**
   - Centralized Neo4j connection pooling
   - Cross-service graph queries

---

## 📁 KEY FILES TO UPDATE

| File | Action |
|------|--------|
| `REZ-Merchant/industry-os/shared/` | Create `@rez/mongodb` package |
| `hojai-ai/` | Create `@rez/redis` package |
| `RABTUL-Technologies/REZ-event-bus/` | Add Kafka integration |
| `hojai-ai/hojai-vector/` | Production pgvector setup |
| All services | Remove dev fallback secrets |
| `AssetMind/codebase/` | Enforce TimescaleDB policies |

---

## 📊 SERVICE INVENTORY BY DATABASE

### MongoDB Services (156)

```
RisaCare (56): profiles, wellness, visits, medications, consents, etc.
RisnaEstate (32): properties, leads, deals, agreements, handovers
RABTUL-Technologies (40+): orders, payments, karma, notifications
REZ-Consumer (20+): scans, warranties, bills, expenses
REZ-Merchant (15+): merchants, products, inventory
Other (20+): various services
```

### PostgreSQL Services (8)

```
AssetMind: 23 tables + 8 TimescaleDB hypertables
verify-service: 10 tables
restauranthub: 90+ tables
rez-now: 11 tables
Hotel-OTA: 10 tables
Other: 5 tables
```

### Redis Services (58)

```
RABTUL-Technologies: 30+ services
REZ-Consumer: 12+ services
hojai-ai: 10+ services
REZ-Merchant: 6+ services
```

---

**Last Updated:** June 11, 2026  
**Next Review:** June 25, 2026