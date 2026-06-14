# CorpID - Universal Trust, Verification & Reputation Infrastructure

## Overview
Trust Infrastructure Platform for the entire RTNM ecosystem. CorpID provides universal identity verification, CI Scoring, and reputation management across all companies and services.

## Vision
Every entity (individual, business, supplier, merchant, driver, franchise) in the RTNM ecosystem has a verifiable, trusted identity that enables seamless verification and trust establishment.

## Entity Types
| Type | Prefix | Description |
|------|--------|-------------|
| Individual | CI-IND-XXXXX | Person identity |
| Business | CI-BIZ-XXXXX | Company entity |
| Supplier | CI-SUP-XXXXX | Supply chain partner |
| Merchant | CI-MER-XXXXX | REZ Merchant |
| Driver | CI-DRV-XXXXX | Ride/Delivery driver |
| Franchise | CI-FRN-XXXXX | Franchisee entity |

## CI Score (0-1000)
Composite Trust Score based on:
| Factor | Weight | Description |
|--------|--------|-------------|
| Identity | 15% | KYC completion, document verification |
| Employment | 20% | Employment history, tenure |
| Skills | 15% | Certifications, skills verified |
| Reputation | 25% | References, ratings, reviews |
| Compliance | 10% | Background checks, legal |
| References | 15% | Verified professional references |

### Score Tiers
| Range | Tier | Color |
|-------|------|-------|
| 900-1000 | Elite | Gold |
| 750-899 | Premium | Silver |
| 500-749 | Verified | Blue |
| 300-499 | Basic | Gray |
| 0-299 | Unverified | Red |

## Core Services (13 microservices)

| Service | Port | Purpose |
|---------|------|---------|
| corpid-api-gateway | 4701 | Unified entry point, routing |
| corpid-identity-service | 4702 | CorpID creation, entity types |
| corpid-verification-service | 4703 | KYB/KYC verification |
| corpid-ci-score-service | 4704 | CI Score 0-1000 |
| corpid-passport-service | 4705 | Career + Business passports |
| corpid-trust-graph-service | 4706 | Relationships |
| corpid-monitor-service | 4707 | Continuous monitoring |
| corpid-risk-service | 4708 | Fraud detection |
| corpid-document-service | 4709 | Document vault |
| corpid-notification-service | 4710 | Alerts |
| corpid-partner-service | 4711 | External integrations |
| corpid-admin-service | 4712 | Admin dashboard |

## API Endpoints Summary

### Identity Service
- `POST /api/v1/identities` - Create new identity
- `GET /api/v1/identities/:corpId` - Get identity
- `PATCH /api/v1/identities/:corpId` - Update identity
- `GET /api/v1/entities` - List entities
- `GET /api/v1/search` - Search entities

### Verification Service
- `POST /api/v1/verify/identity` - Start KYC
- `POST /api/v1/verify/business` - Start KYB
- `POST /api/v1/verify/employment` - Verify employment
- `POST /api/v1/verify/education` - Verify education
- `GET /api/v1/verify/:corpId/status` - Get verification status

### CI Score Service
- `GET /api/v1/scores/:corpId` - Get current score
- `GET /api/v1/scores/:corpId/history` - Score history
- `GET /api/v1/scores/:corpId/factors` - Score breakdown
- `POST /api/v1/scores/calculate` - Trigger recalculation

### Passport Service
- `GET /api/v1/passports/:corpId` - Get all passports
- `GET /api/v1/passports/:corpId/career` - Career passport
- `GET /api/v1/passports/:corpId/business` - Business passport
- `GET /api/v1/passports/:corpId/wallet` - Trust wallet
- `POST /api/v1/passports/:corpId/wallet/badge` - Add badge

### Trust Graph Service
- `GET /api/v1/graph/:corpId` - Get relationships
- `POST /api/v1/relationships` - Add relationship
- `GET /api/v1/relationships/:corpId` - Get entity relationships
- `DELETE /api/v1/relationships/:id` - Remove relationship

### Monitor Service
- `GET /api/v1/monitor/:corpId` - Get monitoring status
- `GET /api/v1/alerts/:corpId` - Get alerts
- `POST /api/v1/monitor/subscribe` - Subscribe to monitoring

### Risk Service
- `GET /api/v1/risk/:corpId` - Get risk score
- `GET /api/v1/fraud/:corpId` - Fraud indicators
- `POST /api/v1/risk/assess` - Trigger risk assessment

### Document Service
- `POST /api/v1/documents` - Upload document
- `GET /api/v1/documents/:docId` - Get document
- `GET /api/v1/documents/:corpId` - List entity documents
- `POST /api/v1/documents/:docId/verify` - Verify document

### Notification Service
- `GET /api/v1/notifications/:corpId` - Get notifications
- `POST /api/v1/notifications` - Send notification
- `POST /api/v1/webhooks` - Register webhook
- `GET /api/v1/webhooks/:corpId` - List webhooks

### Partner Service
- `GET /api/v1/partners` - List partners
- `POST /api/v1/partners` - Add partner
- `GET /api/v1/integrations/:partnerId` - Get integration
- `POST /api/v1/integrations` - Create integration

### Admin Service
- `GET /api/v1/admin/verifications` - Pending verifications
- `PATCH /api/v1/admin/verifications/:id` - Process verification
- `GET /api/v1/admin/audit` - Audit logs
- `GET /api/v1/admin/stats` - Dashboard stats

## Integration Points

| Partner | Purpose | Status |
|---------|---------|--------|
| TalentAI | Candidate verification | Ready |
| PeopleOS | Employee onboarding | Ready |
| MyTalent | Career passport | Ready |
| REZ Ride | Driver trust | Ready |
| NeXha | Supplier trust | Ready |
| RidZa | Risk evaluation | Ready |
| CorpPerks | Enterprise verification | Ready |
| REZ-Media | Creator verification | Ready |

## Security

- JWT Authentication (RABTUL Auth integration)
- Rate Limiting: 100 req/min per IP
- Helmet security headers
- Input validation with Zod
- Audit logging
- Document encryption at rest

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB |
| Cache | Redis |
| Queue | In-memory (BullMQ ready) |
| Auth | JWT (RABTUL) |
| Validation | Zod |
| API Docs | OpenAPI 3.0 |

## CI Score Factors Detail

### Identity (15%)
- Government ID verified (Aadhaar, PAN, Passport)
- Address verified
- Biometric verified
- Selfie match

### Employment (20%)
- Current employer verified
- Employment history (months employed)
- Tenure at current role
- Role level

### Skills (15%)
- Education verified
- Certifications count
- Skills endorsements
- Training completed

### Reputation (25%)
- Reference count
- Average reference rating
- Review score (if applicable)
- Compliance checks passed

### Compliance (10%)
- Background check status
- Legal clearances
- Regulatory compliance
- Tax compliance

### References (15%)
- Professional references verified
- Reference response rate
- Reference quality score
- Mutual connections

## Passport Types

### Career Passport
- Employment history
- Education credentials
- Skills & certifications
- Achievements & awards
- Projects & portfolio
- Professional memberships

### Business Passport
- Company registration
- Business credentials
- Financial track record
- Client references
- Certifications & compliance
- Awards & recognitions

### Trust Wallet
- Verified badges
- Achievement certificates
- Endorsements
- Trust stamps
- Compliance certificates
