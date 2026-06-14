# REZ Loyalty Consolidation - Implementation Plan

**Date:** June 11, 2026
**Goal:** Consolidate coins, wallet, and loyalty systems with federated gateway approach

---

## Context

The REZ ecosystem has multiple parallel loyalty systems:
- **REZ-unified-loyalty** (RABTUL) - Central platform loyalty
- **Restaurant Loyalty** (REZ-Merchant) - Restaurant-specific
- **Prive Premium** (RABTUL) - Elite 6-pillar system
- **Referral OS** (RABTUL) - Campaign-based referrals
- **Cashback Service** (RABTUL) - Cashback campaigns

**Decisions made:**
- ✅ Federated Gateway (unified API over existing systems)
- ✅ Hybrid Tier (REZ tiers + Prive as premium overlay)
- ✅ Event-Driven Sync (Redis pub/sub real-time)
- ✅ Full Legacy Support (all aliases normalized)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ CONSUMER APP                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              REZ LOYALTY GATEWAY (New Service - Port 4601)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Unified Balance │  │  Tier Manager   │  │  Event-Driven Sync Engine  │  │
│  │    Aggregator   │  │  (Hybrid REZ +  │  │  (Redis pub/sub consumer)  │  │
│  │                 │  │    Prive)       │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Service Registry (In-Memory)                        │   │
│  │  wallet-service:4004 | unified-loyalty:4602 | restaurant-loyalty:*   │   │
│  │  prive-service:4070 | referral-os:* | cashback-service:* │   │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ REZ-unified-    │  │   Restaurant │  │   Prive Service  │
│ loyalty         │  │   Loyalty        │  │   (Premium)      │
│  (Port 4602)     │  │   (REZ-Merchant) │  │   (Port 4070)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Implementation Phases

### Phase 1: Federated Loyalty Gateway Service

**Location:** `/RABTUL-Technologies/rez-loyalty-gateway/`
**Port:** 4601

#### 1.1 Service Structure

```
rez-loyalty-gateway/
├── src/
│   ├── index.ts                    # Express app entry
│   ├── config/
│   │   ├── services.ts             # Service registry config
│   │   └── redis.ts                # Redis pub/sub config
│   ├── routes/
│   │   ├── balance.ts              # GET /balance - unified balance
│   │   ├── earn.ts                 # POST /earn - unified earning
│   │   ├── redeem.ts               # POST /redeem - unified redemption
│   │   ├── tiers.ts                # GET /tiers - hybrid tier info
│   │   └── events.ts               # Event subscription endpoints
│   ├── services/
│   │   ├── BalanceAggregator.ts    # Aggregate from all sources
│   │   ├── TierManager.ts          # Hybrid tier logic
│   │   ├── CoinSyncEngine.ts       # Event-driven sync
│   │   └── ServiceRouter.ts        # Route to appropriate backend
│   ├── consumers/
│   │   ├── WalletConsumer.ts       # Listen to wallet events
│   │   ├── LoyaltyConsumer.ts # Listen to loyalty events
│   │   └── PriveConsumer.ts        # Listen to prive events
│   ├── types/
│   │   └── index.ts                # Unified types
│   └── utils/
│       ├── apiClient.ts            # HTTP client with circuit breaker
│       └── aliasNormalizer.ts      # Legacy alias normalization
├── package.json
└── tsconfig.json
```

#### 1.2 Unified Balance Endpoint

```typescript
// GET /api/v1/loyalty/balance/:userId
interface UnifiedBalance {
  userId: string;
  balances: {
    REZ: { available: number; locked: number; lifetime: number };
    PROMO: { available: number; locked: number; expiresAt?: Date };
    BRANDED: { available: number; byMerchant: Record<string, number> };
    PRIVE: { available: number; score: number; tier: string };
    CASHBACK: { available: number; lifetime: number };
    REFERRAL: { available: number; lifetime: number };
  };
  totalValueUSD: number;
  conversionRate: number;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'partial' | 'stale';
}
```

####1.3 Tier Manager (Hybrid)

```typescript
interface HybridTierInfo {
  userId: string;
  rezTier: TierLevel;           // Bronze/Silver/Gold/Platinum
  priveTier?: PriveTier;       // Entry/Signature/Elite (if active)
  priveScore?: number;         // 0-100 (if active)
  privePillars?: PillarScore[]; // 6 pillars (if active)
  combinedMultiplier: number;  // REZ mult * Prive mult
  benefits: TierBenefits;
}
```

---

### Phase 2: Event-Driven Coin Sync Engine

**Purpose:** Real-time sync of coin balances across all loyalty systems

#### 2.1 Event Schema

```typescript
interface CoinSyncEvent {
  eventId: string;
  eventType: 'coin.earned' | 'coin.redeemed' | 'coin.expired' | 'coin.transferred';
  userId: string;
  sourceApp: string;           // 'wallet-service' | 'restaurant-loyalty' | 'prive'
  coinType: CoinType;
  amount: number;
  transactionId: string;
  referenceId: string;         // Idempotency key
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

#### 2.2 Redis Channel Structure

| Channel | Publisher | Subscribers |
|---------|-----------|-------------|
| `loyalty:coin:earned` | All coin-earning services | Gateway, analytics |
| `loyalty:coin:redeemed` | All coin-redemption services | Gateway, analytics |
| `loyalty:tier:changed` | Tier services | Gateway, profile |
| `loyalty:sync:request` | Gateway | Specific service |
| `loyalty:sync:response` | Backend services | Gateway |

#### 2.3 Sync Flow

```
1. Service credits coins → MongoDB transaction commits
2. Service publishes to 'loyalty:coin:earned' channel
3. Gateway consumer receives event
4. Gateway updates local cache (Redis)
5. Gateway validates idempotency (referenceId)
6. If valid, forward to other services for sync
7. Other services update their local state
```

---

### Phase 3: Extend REZ-unified-hub (Alternative)

**Option B:** Instead of new service, extend existing `REZ-unified-hub` (port 4600)

**Changes needed:**
1. Add loyalty routes at `/src/routes/loyalty.ts`
2. Add loyalty service to ApiClient
3. Add coin sync consumer

**Pros:** Reuses existing infrastructure
**Cons:** Adds more complexity to existing service

**Recommendation:** Create new service for clean separation

---

### Phase 4: Service Router Implementation

**Purpose:** Route requests to appropriate backend based on context

```typescript
class ServiceRouter {
  // Route earning to appropriate service
  async routeEarn(params: EarnParams): Promise<EarnResult> {
    switch (params.context) {
      case 'restaurant':
        return this.restaurantLoyalty.earn(params);
      case 'prive':
        return this.priveService.earn(params);
      case 'referral':
        return this.referralOS.earn(params);
      default:
        return this.unifiedLoyalty.earn(params);
    }
  }

  // Aggregate balance from all services
  async aggregateBalance(userId: string): Promise<UnifiedBalance> {
    const [wallet, unified, restaurant, prive] = await Promise.allSettled([
      this.walletService.getBalance(userId),
      this.unifiedLoyalty.getBalance(userId),
      this.restaurantLoyalty.getBalance(userId),
      this.priveService.getBalance(userId),
    ]);
    return this.mergeBalances(wallet, unified, restaurant, prive);
  }
}
```

---

### Phase 5: Legacy Alias Support

**Existing normalizer:** `/REZ-Merchant/rez-app-merchant/packages/shared-types/src/enums/coinType.ts`

**Enhancements:**
1. Add more aliases to `COIN_TYPE_ALIASES` map
2. Create shared package `@rez/coin-types` for universal use
3. Document all aliases with migration timeline

```typescript
// New canonical aliases to support
const ADDITIONAL_ALIASES = {
  'wallet_coins': 'REZ',
  'platform_coins': 'REZ',
  'stayown_coins': 'BRANDED',
  'risnacare_coins': 'BRANDED',
  'khairmove_coins': 'BRANDED',
};
```

---

## API Specification

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loyalty/balance/:userId` | Get unified balance from all systems |
| GET | `/api/v1/loyalty/balance/:userId/:coinType` | Get specific coin type balance |
| POST | `/api/v1/loyalty/earn` | Earn coins (auto-routes to correct service) |
| POST | `/api/v1/loyalty/redeem` | Redeem coins (auto-routes to correct service) |
| GET | `/api/v1/loyalty/tiers/:userId` | Get hybrid tier info (REZ + Prive) |
| GET | `/api/v1/loyalty/transactions/:userId` | Get unified transaction history |
| POST | `/api/v1/loyalty/sync` | Force sync from all services |
| GET | `/api/v1/loyalty/health` | Health check all connected services |

### Internal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/loyalty/credit` | Service-to-service credit |
| POST | `/internal/loyalty/debit` | Service-to-service debit |
| GET | `/internal/loyalty/balance/:userId` | Internal balance check |

---

## Data Flow Diagrams

### Earn Coins Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ Consumer │────▶│ Loyalty │────▶│ Service Router  │
│   App    │     │ Gateway      │     │ │
└──────────┘     └──────────────┘     └────────┬────────┘
                           │                     │
                           │ ┌──────┴──────┐
                           │              ▼             ▼
                           │ ┌────────────┐ ┌────────────┐
                           │     │ Restaurant │ │   Prive    │
                           │     │  Loyalty   │ │  Service   │
                           │     └────────────┘ └────────────┘
                           │
                           ▼
 ┌──────────────┐
                    │ Redis Pub/Sub │
                    │   Channel │
                    └──────┬───────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              Event-Driven Sync                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │  Wallet │ │ Analytics │ │  Profile Svc   │  │
│  │  Consumer  │ │  Consumer  │ │  (tier update) │  │
│  └────────────┘ └────────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Unified Balance Flow

```
┌──────────┐
│ Consumer │ GET /balance
│   App    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────┐
│           Loyalty Gateway                │
│  ┌─────────────────────────────────┐   │
│  │      Balance Aggregator          │   │
│  │  Promise.allSettled([           │   │
│  │    wallet.getBalance(),          │   │
│  │    unified.getBalance(),        │   │
│  │    restaurant.getBalance(),      │   │
│  │    prive.getBalance()           │   │
│  │  ]) │   │
│  └─────────────────────────────────┘   │
└────────────────┬───────────────────────┘
                 │
     ┌───────────┼───────────┬───────────────┐
     ▼           ▼           ▼ ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐
│  Wallet │ │ Unified │ │Restaurant│ │ Prive    │
│ Service │ │ Loyalty │ │ Loyalty  │ │   Service   │
│ (4004)  │ │ (4602)  │ │          │ │   (4070)    │
└─────────┘ └─────────┘ └─────────┘ └─────────────┘
```

---

## Tier Mapping Logic

### REZ Tiers (Standard)

| Tier | Threshold | Earning Mult | Birthday Bonus |
|------|-----------|--------------|---------------|
| Bronze | 0 | 1.0x | 50 |
| Silver | 1,000 | 1.25x | 100 |
| Gold | 5,000 | 1.5x | 250 |
| Platinum | 20,000 | 2.0x | 500 |

### Prive Tiers (Premium Overlay)

| Tier | Score Range | Coin Mult | Monthly Bonus |
|------|------------|-----------|--------------|
| Entry | 50-69 | 1.0x | 0 |
| Signature | 70-84 | 1.25x | 500 |
| Elite | 85-100 | 1.5x | 1,000 |

### Combined Multiplier

```typescript
function getCombinedMultiplier(rezTier: TierLevel, priveTier?: PriveTier): number {
  const rezMult = TIER_BENEFITS[rezTier].earningMultiplier;
  const priveMult = priveTier ? PRIVE_TIER_MULTIPLIERS[priveTier] : 1.0;
  return rezMult * priveMult;
}
```

### Prive → REZ Tier Mapping (for unified display)

| Prive Score | Mapped REZ Tier |
|-------------|-----------------|
| 85-100 | Platinum |
| 70-84 | Gold |
| 50-69 | Silver |
| 0-49 | Bronze |

---

## Testing Strategy

### Unit Tests
- `BalanceAggregator` - merge logic
- `TierManager` - hybrid tier calculation
- `CoinSyncEngine` - event processing
- `ServiceRouter` - routing logic
- `AliasNormalizer` - legacy alias mapping

### Integration Tests
- End-to-end earn/redeem flow
- Cross-service sync verification
- Tier calculation accuracy
- Legacy alias backward compatibility

### Load Tests
- Balance aggregation under load
- Event pub/sub throughput
- Circuit breaker behavior

---

## Environment Variables

```bash
# Service
PORT=4601
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_loyalty_gateway

# Redis
REDIS_URL=redis://localhost:6379

# Internal Auth
INTERNAL_SERVICE_TOKEN=<secret>

# Service URLs
WALLET_SERVICE_URL=http://localhost:4004
UNIFIED_LOYALTY_URL=http://localhost:4602
PRIVE_SERVICE_URL=http://localhost:4070
RESTAURANT_LOYALTY_URL=http://localhost:<port>

# Sync Settings
SYNC_CACHE_TTL=300 # 5 minutes
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=1000     # ms
```

---

## Rollout Plan

### Phase 1 (Week 1-2): Gateway Service
- [ ] Create service structure
- [ ] Implement balance aggregation
- [ ] Add service registry
- [ ] Basic circuit breaker

### Phase 2 (Week 3-4): Tier Management
- [ ] Implement TierManager
- [ ] Add Prive integration
- [ ] Create hybrid tier logic
- [ ] Add tier change events

### Phase 3 (Week 5-6): Event Sync
- [ ] Implement CoinSyncEngine
- [ ] Add Redis consumers
- [ ] Test cross-service sync
- [ ] Add DLQ handling

### Phase 4 (Week 7-8): Production Ready
- [ ] Load testing
- [ ] Documentation
- [ ] Monitoring dashboard
- [ ] Runbook

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Balance aggregation latency | < 500ms p95 |
| Event sync latency | < 100ms |
| Service uptime |99.9% |
| Circuit breaker accuracy | < 1% false positives |
| Legacy alias coverage | 100% of known aliases |

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `RABTUL-Technologies/rez-loyalty-gateway/` | New gateway service |
| `RABTUL-Technologies/rez-loyalty-gateway/src/types/index.ts` | Unified types |
| `RABTUL-Technologies/rez-loyalty-gateway/src/services/BalanceAggregator.ts` | Balance merge logic |
| `RABTUL-Technologies/rez-loyalty-gateway/src/services/TierManager.ts` | Hybrid tier logic |
| `RABTUL-Technologies/rez-loyalty-gateway/src/services/CoinSyncEngine.ts` | Event sync |
| `RABTUL-Technologies/rez-loyalty-gateway/src/consumers/*.ts` | Redis consumers |

### Modify Existing
| File | Change |
|------|--------|
| `RABTUL-Technologies/REZ-unified-hub/src/services/apiClient.ts` | Add loyalty services |
| `RABTUL-Technologies/REZ-unified-loyalty/src/types/index.ts` | Export canonical types |
| `REZ-Merchant/rez-app-merchant/packages/shared-types/src/enums/coinType.ts` | Add more aliases |

---

## Risks& Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale balance from failed service | Medium | Show syncStatus, partial data warning |
| Event duplication | Medium | Idempotency via referenceId |
| Circular sync events | High | Track sourceApp, ignore self-events |
| Service timeout | Low | Circuit breaker, graceful degradation |
| Redis pub/sub failure | Medium | Fallback to polling, DLQ for retry |

---

## Final Decisions

| Decision | Choice |
|----------|--------|
| Gateway Location | **New Service (Port 4601)** - Clean separation |
| Include Referrals/Cashback | **Yes - Include Both** - Complete picture |
| Source of Truth | **Per-coin-type routing** - Each service owns its coin |

### Coin Type → Service Mapping

| Coin Type | Source of Truth | Service | Port |
|-----------|-----------------|---------|------|
| REZ | wallet-service | RABTUL Technologies | 4004 |
| PROMO | wallet-service | RABTUL Technologies | 4004 |
| BRANDED | restaurant-loyalty | REZ-Merchant | dynamic |
| PRIVE | prive-service | RABTUL Technologies | 4070 |
| CASHBACK | cashback-service | RABTUL Technologies | dynamic |
| REFERRAL | referral-os | RABTUL Technologies | dynamic |

### Gateway Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/loyalty/balance/:userId` | **Unified balance** from all 6 coin types |
| POST | `/api/v1/loyalty/earn` | **Auto-route** to correct service by context |
| POST | `/api/v1/loyalty/redeem` | **Auto-route** to correct service |
| GET | `/api/v1/loyalty/tiers/:userId` | **Hybrid tier** (REZ + Prive overlay) |
| GET | `/api/v1/loyalty/transactions/:userId` | **Unified history** with source attribution |
