# REZ Referral OS

Unified referral infrastructure for the REZ ecosystem.

**Port:** 4019  
**Location:** `RABTUL-Technologies/rez-referral-os/`

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Build
npm run build

# Start
npm run dev
```

---

## Architecture

```
src/
├── config/          # Environment, MongoDB, Redis
├── events/           # 14 typed event schemas
├── integrations/     # QR Cloud, RABTUL SaaS, REZ Prive
├── middleware/       # Auth, rate limiting
├── models/           # 7 MongoDB models
├── routes/           # 50+ API endpoints
├── services/         # 9 core engines
├── types/            # TypeScript definitions
└── utils/            # Logger, response helpers
```

---

## Three Referral Economies

| Economy | Default Reward | Commission |
|---------|--------------|------------|
| **Consumer** | 100 coins | - |
| **Merchant** | 10% fee discount | - |
| **Creator** | - | 5-15% |

---

## API Endpoints

### Consumer Routes (`/api/consumer`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/code` | ✅ | Get user's referral code |
| POST | `/code` | ✅ | Create referral code |
| GET | `/stats` | ✅ | Get referral statistics |
| GET | `/referrals` | ✅ | List user's referrals |
| GET | `/leaderboard` | ✅ | Top referrers |

### Creator Routes (`/api/creator`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | ✅ | Get creator profile |
| POST | `/profile` | ✅ | Create creator profile |
| GET | `/collections` | ✅ | List collections |
| POST | `/collections` | ✅ | Create collection |
| GET | `/qr/:slug` | - | Get QR code |
| GET | `/stats` | ✅ | Get creator analytics |

### Campaign Routes (`/api/campaigns`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | - | List campaigns |
| GET | `/:id` | - | Campaign details |
| POST | `/` | Internal | Create campaign |
| POST | `/:id/enroll` | ✅ | Enroll in campaign |

### Analytics Routes (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/overview` | ✅ | Referral dashboard |
| GET | `/funnel` | ✅ | Conversion funnel |
| GET | `/performance` | ✅ | Performance metrics |
| GET | `/insights` | ✅ | AI insights |

### Fraud Routes (`/api/fraud`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/score` | Internal | Calculate risk score |
| GET | `/suspicious` | Internal | List suspicious referrals |

### AI Routes (`/api/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ask` | ✅ | Ask referral questions |
| GET | `/insights` | ✅ | Get AI insights |
| GET | `/tips` | ✅ | Get tips |
| GET | `/campaign-recommendations` | ✅ | Campaign suggestions |

### Internal Routes (`/internal`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/referral/register` | Register new referral |
| POST | `/referral/qualify` | Qualify referral |
| POST | `/referral/reward` | Issue reward |

---

## Services

| Service | Purpose |
|---------|---------|
| `referralEngine` | Code generation, tracking |
| `fraudEngine` | 12 fraud checks |
| `rewardEngine` | Auto-issuance |
| `attributionEngine` | First/last/multi-touch |
| `creatorEngine` | Profiles, collections |
| `campaignEngine` | Campaign management |
| `ambassadorEngine` | Tier management |
| `teamEngine` | Multi-level referrals |
| `eventPublisher` | Event Bus publishing |

---

## Integrations

### QR Cloud (`QR_CLOUD_SERVICE_URL`)
- Creator QR code generation
- Scan tracking with geo
- Analytics

### RABTUL SaaS (`RESTAURANT_OS_URL` etc.)
- Cross-vertical referrals
- Loyalty points
- Campaign sync

### REZ Prive (`PRIVE_SERVICE_URL`)
- Eligibility scoring
- Engagement signals
- Coin bonuses

---

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/rez-referral-os
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-secret-token

# Services
WALLET_SERVICE_URL=http://localhost:4004
AUTH_SERVICE_URL=http://localhost:4002
EVENT_BUS_URL=http://localhost:4025
QR_CLOUD_SERVICE_URL=http://localhost:4300
PRIVE_SERVICE_URL=http://localhost:4070

# RABTUL SaaS
RESTAURANT_OS_URL=http://localhost:4010
SALON_OS_URL=http://localhost:4011
HOTEL_OS_URL=http://localhost:4012
FITNESS_OS_URL=http://localhost:4013
RETAIL_OS_URL=http://localhost:4014
HEALTHCARE_OS_URL=http://localhost:4015
```

---

## Testing

```bash
# Run tests
npm test

# Test specific endpoint
curl http://localhost:4019/health

# Test with internal token
curl -X POST http://localhost:4019/api/fraud/score \
  -H "X-Internal-Token: your-internal-token" \
  -H "Content-Type: application/json" \
  -d '{"referrerId":"u1","refereeId":"u2","referralCode":"ABC123"}'
```

---

## Related Apps

| App | Port | Location |
|-----|------|----------|
| Creator Dashboard | 4019 | `REZ-Referral-Dashboard/` |
| Admin Dashboard | 4020 | `REZ-Referral-Admin/` |
| Merchant Portal | 4021 | `REZ-Merchant/merchant-referral-portal/` |
| Mobile Screens | - | `REZ-Consumer/REZ-App/app/referral/` |

---

## License

Proprietary - RTNM Group
