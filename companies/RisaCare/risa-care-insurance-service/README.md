# RisaCare Insurance Advisor Service

A comprehensive health insurance advisor service for RisaCare that helps users compare health insurance plans, manage policies, file claims, and get personalized recommendations.

## Features

- **Plan Comparison**: Search and compare multiple health insurance plans side-by-side
- **Policy Management**: Add, view, renew, and cancel insurance policies
- **Claim Processing**: Initiate cashless/reimbursement claims, upload documents, track status
- **Smart Recommendations**: AI-powered personalized plan recommendations based on user profile
- **Provider Information**: Detailed insurer information with claims statistics
- **Premium Calculator**: Estimate insurance premiums based on user profile
- **Eligibility Assessment**: Check eligibility for specific plans

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/RisaCare/risa-care-insurance-service

# Install dependencies
npm install

# Start development server
npm run dev
```

The service will be available at `http://localhost:4724`

## API Endpoints

### Health Check

```
GET /health
```

### Plan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/plans` | Search plans with filters |
| GET | `/api/v1/plans/:planId` | Get plan details |
| POST | `/api/v1/plans/compare` | Compare multiple plans |
| GET | `/api/v1/plans/recommend` | Get quick recommendations |

### Policy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/policies` | Add a new policy |
| GET | `/api/v1/policies/user/:userId` | Get user policies |
| GET | `/api/v1/policies/:policyId` | Get policy details |
| POST | `/api/v1/policies/:policyId/renew` | Renew policy |
| POST | `/api/v1/policies/:policyId/cancel` | Cancel policy |

### Claim Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/claims` | Initiate a claim |
| GET | `/api/v1/claims/user/:userId` | Get claim history |
| GET | `/api/v1/claims/:claimId` | Get claim details |
| PUT | `/api/v1/claims/:claimId/documents` | Upload documents |
| DELETE | `/api/v1/claims/:claimId/documents/:documentId` | Delete document |
| GET | `/api/v1/claims/:claimId/settlement` | Calculate settlement |
| GET | `/api/v1/claims/stats` | Get claims statistics |

### Provider Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/providers` | List all providers |
| GET | `/api/v1/providers/top` | Get top-rated providers |
| GET | `/api/v1/providers/search` | Search providers |
| GET | `/api/v1/providers/:providerId` | Get provider details |
| GET | `/api/v1/providers/:providerId/stats` | Provider claims stats |
| POST | `/api/v1/providers/compare` | Compare providers |

### Recommendation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/recommendations` | Get personalized recommendations |
| GET | `/api/v1/recommendations/:id` | Get saved recommendation |
| POST | `/api/v1/recommendations/premium` | Calculate premium |
| POST | `/api/v1/recommendations/eligibility` | Check eligibility |

## API Examples

### Search Plans

```bash
curl "http://localhost:4724/api/v1/plans?type=family&minCoverage=500000&maxPremium=20000"
```

### Compare Plans

```bash
curl -X POST http://localhost:4724/api/v1/plans/compare \
  -H "Content-Type: application/json" \
  -d '{"planIds": ["PLAN001", "PLAN002", "PLAN003"]}'
```

### Get Recommendations

```bash
curl -X POST http://localhost:4724/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER001",
    "age": 35,
    "income": 1200000,
    "familySize": 4,
    "healthConditions": ["none"],
    "budget": 25000
  }'
```

### Add Policy

```bash
curl -X POST http://localhost:4724/api/v1/policies \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER001",
    "planId": "PLAN001",
    "coveredMembers": [
      {"name": "John Doe", "relationship": "self", "dateOfBirth": "1990-01-15", "gender": "male"}
    ],
    "startDate": "2026-06-01",
    "premiumPaid": 15000
  }'
```

### Initiate Claim

```bash
curl -X POST http://localhost:4724/api/v1/claims \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "POL001",
    "userId": "USER001",
    "patientId": "PAT001",
    "patientName": "John Doe",
    "type": "cashless",
    "amount": 75000,
    "diagnosis": "Appendectomy",
    "hospitalId": "HOSP001",
    "hospitalName": "Apollo Hospitals",
    "treatmentDate": "2026-06-01"
  }'
```

### Upload Claim Documents

```bash
curl -X PUT http://localhost:4724/api/v1/claims/CLM001/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"type": "discharge_summary", "fileName": "discharge.pdf", "fileUrl": "https://storage.example.com/doc.pdf"}
    ]
  }'
```

## Data Models

### InsurancePlan

| Field | Type | Description |
|-------|------|-------------|
| planId | string | Unique plan identifier |
| providerName | string | Insurance provider name |
| planName | string | Plan name |
| type | enum | individual, family, senior, critical_illness |
| coverageAmount | number | Sum insured amount |
| premium | number | Annual premium |
| exclusions | string[] | List of exclusions |
| inclusions | string[] | List of inclusions |
| subLimits | object | Coverage sub-limits |
| waitingPeriod | number | Initial waiting period in days |
| copay | number | Co-pay percentage |

### UserPolicy

| Field | Type | Description |
|-------|------|-------------|
| policyId | string | Unique policy identifier |
| userId | string | User identifier |
| planId | string | Associated plan ID |
| startDate | string | Policy start date |
| endDate | string | Policy end date |
| sumInsured | number | Coverage amount |
| coveredMembers | object[] | Family members covered |
| status | enum | active, expired, lapsed, cancelled |

### Claim

| Field | Type | Description |
|-------|------|-------------|
| claimId | string | Unique claim identifier |
| policyId | string | Associated policy ID |
| type | enum | reimbursement, cashless |
| status | enum | initiated, under_review, approved, rejected, settled |
| amount | number | Claimed amount |
| diagnosis | string | Medical condition |
| documents | object[] | Uploaded documents |

## Premium Calculation

The service uses the following factors to calculate premiums:

1. **Base Premium**: Coverage amount / 100,000 x 1,500 (INR)
2. **Age Loading**: +8% for ages 36-45, +15% for ages 46+
3. **Family Loading**: +10% per additional family member beyond 2
4. **Health Loading**: +25% for critical health conditions
5. **Tenure Discount**: -10% per additional year for multi-year policies

## Scoring Algorithm

Plan recommendations use a weighted scoring system:

- **Coverage Adequacy** (40%): How well coverage meets recommended amount
- **Value for Money** (20%): Coverage to premium ratio
- **Family Fit** (15%): Match between plan type and family size
- **Provider Reliability** (10%): Claim settlement ratio
- **Low Copay** (10%): Preference for 0% copay plans
- **Senior Fit** (5%): Age-appropriate features

## Port Configuration

Service runs on **port 4724** as defined in CLAUDE.md for RisaCare healthcare services.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Project Structure

```
risa-care-insurance-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts           # Application entry point
    ├── models/
    │   └── insurance.ts   # TypeScript interfaces and Zod schemas
    ├── services/
    │   ├── planService.ts           # Plan management
    │   ├── policyService.ts         # Policy management
    │   ├── claimService.ts          # Claim processing
    │   ├── recommendationService.ts # AI recommendations
    │   └── providerService.ts      # Provider information
    └── routes/
        └── insuranceRoutes.ts       # API route definitions
```

## Available Insurance Providers

The service includes seed data for the following providers:

1. Star Health
2. HDFC Ergo
3. ICICI Lombard
4. Care Health
5. Max Bupa
6. Bajaj Allianz
7. Aditya Birla Health
8. Manipal Cigna

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication & authorization
- [ ] Real-time claim status notifications
- [ ] Integration with insurer APIs for live data
- [ ] Document verification service
- [ ] Payment gateway integration for premium payments
- [ ] Analytics dashboard

## License

Part of RTNM Group - RisaCare Healthcare Ecosystem
