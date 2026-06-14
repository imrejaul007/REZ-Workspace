# REZ-Media

## Company Description

REZ-Media is a comprehensive digital marketing platform specializing in **Ads**, **Loyalty**, and **DOOH Advertising** solutions. We empower businesses to reach their target audiences through innovative advertising technology while building lasting customer relationships through gamified loyalty programs and intelligent marketing automation.

> **Note:** Karma (Social Impact) has moved to its own company - [Karma Foundation](https://github.com/imrejaul007/Karma-Foundation)

## Services

Our platform offers a complete suite of marketing, advertising, and engagement solutions:

### Advertising Solutions

| Service | Description |
|---------|-------------|
| **adBazaar** | Multi-channel ad marketplace connecting brands with premium inventory |
| **adsqr** | QR code-based advertising with seamless offline-to-online tracking |
| **dooh** | Digital Out-of-Home advertising for dynamic screen networks |
| **dooh-screen-app** | DOOH screen management and content display |
| **dooh-mobile** | DOOH mobile companion app for screen owners |
| **rez-dooh-service** | DOOH backend service for scheduling and bidding |
| **creators** | Influencer and creator partnership management platform |

### Supply Side Platform (SSP)

| Service | Port | Description |
|---------|------|-------------|
| **ssp-portal** | 4520-4525 | Supply Side Platform for DOOH monetization |
| ssp-gateway | 4520 | API Gateway |
| ssp-screen-service | 4521 | Screen management |
| ssp-inventory-service | 4522 | Ad slot inventory |
| ssp-bidding-service | 4523 | Real-time bidding |
| ssp-revenue-service | 4524 | Revenue tracking |
| ssp-analytics-service | 4525 | Performance analytics |

> **Competitor:** PubMatic SSP, Google Ad Manager  
> **Tagline:** "Maximize your screen inventory revenue"

### Loyalty & Gamification

| Service | Description |
|---------|-------------|
| **Gamification** | Engagement-driven loyalty mechanics with points, badges, and challenges |
| **Gamification Service** | Backend loyalty system |

### Marketing Automation

| Service | Description |
|---------|-------------|
| **Marketing** | AI-powered campaign management and audience segmentation |
| **Automation** | Workflow-based marketing automation for cross-channel campaigns |
| **Abandonment Tracker** | Cart and engagement abandonment detection and recovery |
| **Decision Service** | Real-time personalization and recommendation engine |
| **Economic Engine** | Dynamic pricing and promotional optimization |

### Intelligence & Analytics

| Service | Description |
|---------|-------------|
| **Feedback** | Real-time customer feedback collection and sentiment analysis |
| **Journey** | Customer journey mapping and touchpoint optimization |
| **Lead Intelligence** | Predictive lead scoring and qualification system |
| **Media Events** | Event-driven analytics and cross-channel attribution |

---

## Deployment

### Prerequisites

- Node.js 18+
- Docker (optional, for containerized deployment)
- Database: PostgreSQL 14+ / MongoDB 6+

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run development server
npm run dev

# Run tests
npm test
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker build -t rez-media .
docker run -p 3000:3000 rez-media
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL/MongoDB connection string | Yes |
| `API_KEY` | Authentication key for API access | Yes |
| `REDIS_URL` | Redis connection for caching | No |
| `LOG_LEVEL` | Logging verbosity (info, warn, error) | No |

### Container Orchestration

For Kubernetes deployment, use the provided Helm chart:

```bash
helm install rez-media ./charts/rez-media -f values.prod.yaml
```

---

## BPO Services

BPO (Business Process Outsourcing) services powered by Axom:

| Service | Port | Description | Tests |
|---------|------|-------------|-------|
| **axomi-bpo** | 4080 | BPO workflows - job management, worker registry | 44 tests |
| **axomi-help** | 4081 | Support platform - tickets, FAQ, messaging | 40 tests |
| **axomi-bpo-voice-bpo** | - | Voice BPO - call center, transcription, voice AI | - |

### Running BPO Services

```bash
# axomi-bpo
cd axomi-bpo && npm install && npm run dev

# axomi-help
cd axomi-help && npm install && npm run dev

# axomi-bpo-voice-bpo
cd axomi-bpo-voice-bpo && npm install && npm run dev
```

### BPO API Overview

**axomi-bpo:**
- Job lifecycle (create, assign, complete, cancel, rate)
- Worker management (register, track performance)

**axomi-help:**
- Ticket management (create, assign, resolve, close)
- FAQ system (search, categorize)
- Messaging between users and agents

**axomi-bpo-voice-bpo:**
- Voice call handling
- Speech transcription
- Voice AI integration

---

## License

Proprietary - REZ-Media Inc.
