# Karma Foundation - Technical Specification
**Version:** 1.0.0 | **Date:** May 27, 2026 | **Company:** Karma Foundation

---

## 1. Vision & Mission

### Vision
To create India's most comprehensive social impact ecosystem where every good deed is recognized, every volunteer is empowered, and every NGO has the tools to drive meaningful change.

### Mission
Build the infrastructure for social good by connecting volunteers with causes, tracking impact transparently, and rewarding community engagement through a unified karma system.

### Tagline
**"Impact, Trust & Community Good"**

---

## 2. Company Identity

### Company Name
**Karma Foundation**

### Positioning
India's Premier Social Impact & NGO Ecosystem

### Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#22C55E` | Impact/Growth - represents environmental and organic growth |
| Secondary | `#FACC15` | Reward/Value - represents earned karma and gold stars |
| Trust | `#3B82F6` | Trust elements - verification badges, trust scores |
| Background | `#F9FAFB` | Clean, light backgrounds |
| Text | `#111827` | Primary text |

### Brand Voice
- **Tone:** Encouraging, transparent, community-focused
- **Language:** Simple, inclusive, action-oriented
- **Imagery:** Real volunteers, actual impact, diverse communities

---

## 3. Social Programs (13.1)

### 3.1 Education
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| School Support | Tutoring, mentoring, school supplies | 1.5x |
| Scholarships | Financial support for students | 2.0x |
| Skill Development | Vocational training | 1.5x |
| Digital Literacy | Tech education for underserved | 1.5x |

### 3.2 Healthcare
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Medical Camps | Free health checkups | 1.5x |
| Blood Donation | Blood donation drives | 2.0x |
| Health Awareness | Education campaigns | 1.0x |
| Mental Health | Support programs | 1.5x |

### 3.3 Environment
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Tree Planting | Reforestation drives | 2.0x |
| Beach Cleanup | Coastal cleaning | 1.5x |
| Waste Management | Segregation awareness | 1.5x |
| Renewable Energy | Solar/wind advocacy | 1.5x |

### 3.4 Community Welfare
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Senior Care | Elder support programs | 1.5x |
| Animal Welfare | Stray animal care | 1.5x |
| Housing Support | Home repairs for needy | 2.0x |
| Refugee Support | Displaced person aid | 2.0x |

### 3.5 Disaster Relief
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Emergency Response | First responder support | 2.5x |
| Relief Distribution | Essential supplies | 1.5x |
| Rehabilitation | Long-term recovery | 1.5x |
| Preparedness | Disaster training | 1.5x |

### 3.6 Women Empowerment
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Skills Training | Vocational programs | 1.5x |
| Safety Programs | Self-defense, awareness | 1.5x |
| Entrepreneurship | Women-owned businesses | 1.5x |
| Education Support | Girls' education | 2.0x |

### 3.7 Food Donation
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Meal Programs | Serving meals | 1.5x |
| Food Drives | Collection events | 1.5x |
| Surplus Recovery | Restaurant partnerships | 1.5x |
| Community Kitchens | Feeding programs | 2.0x |

### 3.8 Sustainability
| Program | Description | Karma Multiplier |
|---------|-------------|------------------|
| Zero Waste | Waste reduction | 1.5x |
| Water Conservation | Rainwater harvesting | 1.5x |
| Sustainable Transport | Cycling, walking campaigns | 1.5x |
| Eco Products | Sustainable alternatives | 1.0x |

---

## 4. Karma Systems (13.2)

### 4.1 Karma Points

| Metric | Value |
|--------|-------|
| **Base Unit** | Karma Point (KP) |
| **Max Per Event** | Configurable per event |
| **Weekly Cap** | 300 Karma |
| **Decay Rate** | 20% (30d), 40% (45d), 70% (60d) |

#### Earning Actions
| Action | Base Karma | Bonus |
|--------|-----------|-------|
| Event participation | 10 KP/hour | Program multiplier |
| Check-in verification | +5 KP | QR bonus |
| Check-out verification | +5 KP | GPS bonus |
| NGO approval | +10 KP | Trust bonus |
| Review posted | +5 KP | - |
| Referral credited | +50 KP | - |

#### Conversion to REZ Coins
| Level | Threshold | Rate | Weekly Cap |
|-------|-----------|------|-----------|
| L1 | 0-999 | 25% | 75 coins |
| L2 | 1000-2999 | 50% | 150 coins |
| L3 | 3000-5999 | 75% | 225 coins |
| L4 | 6000+ | 100% | 300 coins |

### 4.2 Volunteer Systems

#### Engagement Tiers
| Tier | Events/Month | Karma Required |
|------|--------------|----------------|
| Bronze | 1-2 | 0+ |
| Silver | 3-5 | 500+ |
| Gold | 6-10 | 2000+ |
| Platinum | 11+ | 5000+ |

#### Hours Tracked
- Total lifetime hours
- Hours by category (education, health, etc.)
- Hours this month/year
- Average per event

### 4.3 Mission Systems

#### Mission Types
| Type | Duration | Karma Bonus |
|------|----------|-------------|
| Daily | 1 day | 25 KP |
| Weekly | 7 days | 100 KP |
| Monthly | 30 days | 500 KP |
| Challenge | Variable | 200-1000 KP |

#### Categories
- First Timer (complete first event)
- Consistency (3/7/30 day streaks)
- Social Butterfly (attend 5 different categories)
- Impact Leader (top 10% monthly)
- Category Expert (10+ in one category)

### 4.4 NGO Partnerships

#### Partnership Tiers
| Tier | Min Events/Year | Min Volunteers | CSR Credits |
|------|----------------|---------------|-------------|
| Associate | 12 | 50 | ₹50,000 |
| Partner | 24 | 200 | ₹2,00,000 |
| Champion | 48 | 500 | ₹5,00,000 |
| Apex | 100+ | 1000+ | ₹10,00,000+ |

#### NGO Features
- Event management dashboard
- Volunteer verification tools
- Impact reporting
- CSR allocation tracking
- Partner badge on profile

### 4.5 Social Trust Systems

#### Trust Score Components
| Component | Weight | Description |
|-----------|--------|-------------|
| Completion Rate | 30% | Events completed vs joined |
| Approval Rate | 25% | NGO-verified vs checked-in |
| Consistency | 20% | Regular participation |
| Impact Quality | 15% | Avg event difficulty |
| Verification | 10% | Confidence score |

#### Trust Grades
| Grade | Score | Badge |
|-------|-------|-------|
| S | 90-100 | Platinum Trust |
| A | 80-89 | Gold Trust |
| B | 60-79 | Silver Trust |
| C | 40-59 | Bronze Trust |
| D | 0-39 | Pending |

### 4.6 ESG Programs

#### Environmental Metrics
- Carbon offset tracking
- Trees planted equivalent
- Waste diverted from landfill
- Water saved

#### Social Metrics
- Lives impacted count
- Volunteer hours contributed
- Donations facilitated
- Meals served

#### Governance Metrics
- Donation transparency
- NGO verification rate
- Audit compliance
- Data privacy score

---

## 5. User Journey

### 5.1 New User Flow
```
Sign Up → Profile Setup → Onboarding → First Event → Earn Karma → Level Up
```

### 5.2 Engagement Loop
```
Event Discovery → Join Event → Check-in → Participate → Check-out → Earn Karma
        ↓                                                           ↓
    Explore More ← Leaderboard ← Level Up ← Badges ← Badges ← Share Impact
```

### 5.3 Conversion Flow
```
Karma Earned → Weekly Batch → Preview → Admin Approve → Convert → REZ Coins
                     ↑                                              ↓
               Earn Record                                  Wallet Credit
```

---

## 6. Features Specification

### 6.1 Core Features

| Feature | Priority | Status |
|---------|----------|--------|
| Karma points | P0 | ✅ |
| QR verification | P0 | ✅ |
| GPS verification | P0 | ✅ |
| Level system | P0 | ✅ |
| Weekly batch conversion | P0 | ✅ |
| Leaderboard | P1 | ✅ |
| Communities | P1 | ✅ |
| Missions | P1 | ✅ |
| Micro-actions | P2 | ✅ |
| Impact resume | P1 | ✅ |
| CSR dashboard | P2 | ✅ |
| Streaks | P2 | ✅ |
| Badges | P2 | ✅ |

### 6.2 Future Features

| Feature | Priority | Timeline |
|---------|----------|----------|
| AI event recommendations | P2 | Q3 2026 |
| Blockchain verification | P3 | Q4 2026 |
| NFT badges | P3 | Q4 2026 |
| Social graph | P2 | Q3 2026 |
| Corporate matching | P2 | Q3 2026 |

---

## 7. Technical Architecture

### 7.1 Service Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     KARMA FOUNDATION PLATFORM                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ karma-web    │  │ karma-mobile│  │ External Consumers      │ │
│  │ (Next.js)   │  │ (Expo)      │  │ (REZ App, Merchant)    │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
│         └────────────────┼─────────────────────┘                │
│                          │                                       │
│  ┌──────────────────────▼────────────────────────────────────┐ │
│  │              karma-service (Port 3009)                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ API      │  │ Karma    │  │ Verify   │  │ Batch    │  │ │
│  │  │ Gateway  │  │ Engine   │  │ Engine   │  │ Service  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ Leader-  │  │ Community│  │ Mission  │  │ CSR      │  │ │
│  │  │ board    │  │ Service  │  │ Engine   │  │ Service  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌──────────────────────▼────────────────────────────────────┐ │
│  │              karma-loyalty-bridge (Port 4098)               │ │
│  │         Karma → REZ Coins Conversion Service                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐            │
│  │   MongoDB   │  │    Redis    │  │  RABTUL     │            │
│  │   karma_*   │  │   Cache     │  │  Services   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Data Models

#### KarmaProfile
```typescript
interface IKarmaProfile {
  userId: ObjectId;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  badges: IBadge[];
  levelHistory: ILevelHistoryEntry[];
  conversionHistory: IConversionHistoryEntry[];
  currentStreak: number;
  longestStreak: number;
  // Category counts
  environmentEvents: number;
  healthEvents: number;
  educationEvents: number;
  // ...
}
```

#### EarnRecord
```typescript
interface IEarnRecord {
  userId: ObjectId;
  eventId: ObjectId;
  karmaEarned: number;
  status: 'PENDING' | 'APPROVED_PENDING_CONVERSION' | 'CONVERTED' | 'REJECTED';
  verificationSignals: IVerificationSignals;
  confidenceScore: number;
  batchId?: ObjectId;
  convertedAt?: Date;
  rezCoinsEarned?: number;
}
```

### 7.3 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/karma/user/:userId` | Get karma profile |
| GET | `/api/karma/user/:userId/level` | Get level info |
| GET | `/api/karma/user/:userId/history` | Get conversion history |
| POST | `/api/karma/verify/checkin` | Check-in |
| POST | `/api/karma/verify/checkout` | Check-out |
| GET | `/api/karma/batch` | List batches (admin) |
| POST | `/api/karma/batch/:id/execute` | Execute batch (admin) |
| GET | `/api/karma/communities` | List communities |
| POST | `/api/karma/communities/:slug/posts` | Create post |
| GET | `/api/karma/leaderboard` | Get leaderboard |
| GET | `/api/karma/report` | Generate impact PDF |
| GET | `/api/karma/resume` | Generate impact resume |

---

## 8. Security Requirements

### 8.1 Authentication
- JWT tokens via RABTUL Auth
- Token expiry: 7 days
- Refresh token support

### 8.2 Authorization
- Role-based: user, ngo, admin
- Resource-based: own profile only for reads

### 8.3 Verification
- QR codes: HMAC-SHA256 signed
- GPS: Haversine proximity check
- Time window: 5 minutes for QR

### 8.4 Rate Limiting
- Global: 100 req/min per IP
- Check-in: 10 req/min per user
- Micro-actions: 1 req/day per action

---

## 9. Monitoring & Observability

### 9.1 Metrics
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Karma conversion rate
- Active users by level

### 9.2 Logging
- Structured JSON logs
- Correlation IDs
- Sensitive data redaction

### 9.3 Alerts
- Error rate > 5%
- Latency p99 > 2s
- Failed conversions > 10%

---

## 10. Deployment

### 10.1 Environments
| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:3009 |
| Staging | Pre-production | staging.karma.rez.money |
| Production | Live | karma.rez.money |

### 10.2 Infrastructure
- Container: Docker
- Orchestration: Kubernetes
- Database: MongoDB Atlas
- Cache: Redis Cloud
- CDN: Vercel (web), Cloudflare

---

## 11. Compliance

### 11.1 Data Privacy
- GDPR compliance for EU users
- PDPA compliance for India
- Data retention: 7 years for financial

### 11.2 Financial
- Audit trail for all conversions
- Monthly reconciliation
- Tax compliance for CSR

### 11.3 Security
- SOC 2 Type II (planned Q4 2026)
- Penetration testing (quarterly)
- Bug bounty program

---

## 12. Roadmap

### Q2 2026
- [x] Core karma system
- [x] QR/GPS verification
- [x] Level system
- [x] Batch conversion
- [x] Leaderboard
- [ ] Community features
- [ ] Impact resume

### Q3 2026
- [ ] AI recommendations
- [ ] Corporate matching
- [ ] Social graph
- [ ] Mobile push notifications

### Q4 2026
- [ ] Blockchain verification
- [ ] NFT badges
- [ ] SOC 2 certification
- [ ] International expansion

---

## 13. Glossary

| Term | Definition |
|------|------------|
| Karma Point (KP) | Base unit of social impact |
| Active Karma | Current karma after decay |
| Lifetime Karma | Total karma ever earned |
| Trust Score | 0-100 measure of reliability |
| Conversion | Process of converting karma to REZ coins |
| Batch | Weekly grouping of conversions |
| CSR | Corporate Social Responsibility |
| ESG | Environmental, Social, Governance |
| NGO | Non-Governmental Organization |
| ICO | Impact Compensation Organization |

---

**Document Status:** Active
**Last Updated:** May 27, 2026
**Next Review:** June 27, 2026
