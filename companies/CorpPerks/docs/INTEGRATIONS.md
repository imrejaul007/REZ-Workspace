# CorpPerks Integration Guide

## Complete Integration Architecture

### CorpPerks Services
```
                    ┌─────────────────────────────────────────────┐
                    │           API Gateway (Port 4700)           │
                    └─────────────────┬───────────────────────────┘
                                      │
        ┌───────────┬───────────┬─────┴───────┬───────────┬───────────┐
        │           │           │             │           │           │
   ┌────▼────┐ ┌──▼───┐ ┌────▼────┐ ┌────▼────┐ ┌───▼───┐ ┌────▼────┐
   │ Backend │ │Intel  │ │ProjectOS│ │ Team    │ │Meeting │ │Payroll │
   │  4006   │ │ 4135  │ │  4715   │ │Collab  │ │ 4728  │ │ 4738   │
   └─────────┘ └───────┘ └─────────┘ │  4716  │ └────────┘ └─────────┘
                                     └─────────┘
```

### External Service Integrations
```
CorpPerks ◄─────── RABTUL Services
   │           ├── Auth (4002)
   │           ├── Profile (4013)
   │           ├── Wallet (4004)
   │           ├── Payment (4001)
   │           └── Notification (4011)
   │
   ├─────────── REZ Intelligence
   │           ├── Intent Predictor (4018)
   │           ├── Predictive Engine (4123)
   │           └── Signal Aggregator (4142)
   │
   ├─────────── REZ Merchant
   │           └── Benefits, Offers, Rewards
   │
   ├─────────── Hojai AI
   │           ├── Agents (4550)
   │           └── Flow (4560)
   │
   ├─────────── AdBazaar (REZ Media)
   │           └── Gamification, Rewards
   │
   ├─────────── RidZa
   │           └── Salary Advance, Loans
   │
   └─────────── RisnaEstate
               └── Properties, Investments
```

---

## Service URLs

### Local Development
```env
# Backend Services
BACKEND_URL=http://localhost:4006
CORP_INTEL_URL=http://localhost:4135
PROJECTOS_URL=http://localhost:4715
TEAM_COLLAB_URL=http://localhost:4716
MEETING_URL=http://localhost:4728
PERFORMANCE_URL=http://localhost:4729
OKR_URL=http://localhost:4730
WORKFLOW_URL=http://localhost:4731
ONBOARDING_URL=http://localhost:4732
EXIT_URL=http://localhost:4733
LMS_URL=http://localhost:4734
REPORTS_URL=http://localhost:4735
CALENDAR_URL=http://localhost:4736
SSO_URL=http://localhost:4737
PAYROLL_URL=http://localhost:4738
SHIFT_URL=http://localhost:4739
COMPENSATION_URL=http://localhost:4740
DOCUMENT_URL=http://localhost:4741
VIDEO_URL=http://localhost:4742
CORP_CRM_URL=http://localhost:4725
ANALYTICS_URL=http://localhost:4744
PUSH_URL=http://localhost:4743
WHATSAPP_URL=http://localhost:4745
CORPID_URL=http://localhost:4701
API_GATEWAY_URL=http://localhost:4700

# External Services
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_PROFILE_URL=http://localhost:4013
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_PAYMENT_URL=http://localhost:4001
REZ_INTENT_URL=http://localhost:4018
REZ_PREDICTIVE_URL=http://localhost:4123
```

---

## Quick Integration Examples

### 1. React Native / Expo
```typescript
import { corpperks } from '@corpperks/sdk';

// Login
await corpperks.login(email, password);

// Get profile
const profile = await corpperks.getMyProfile();

// Check in
await corpperks.checkIn('in', { lat: 12.97, lng: 77.59 });

// Get OKRs
const okrs = await corpperks.getMyOKRs();

// Chat with AI
const response = await corpperks.chatWithCopilot("What's my productivity score?");
```

### 2. Next.js / React
```typescript
import { integrations } from '@/shared/integrations';

// Get employees
const employees = await integrations.backend.getEmployees();

// Create project
const project = await integrations.projectOS.createProject({
  name: 'New Project',
  description: 'Project description',
  startDate: '2026-06-01',
});

// Get AI recommendations
const cards = await integrations.intel.getDecisionCards();
```

### 3. Backend Service
```typescript
import express from 'express';
import { apiRequest } from '@corpperks/shared';

const app = express();

// Call CorpPerks backend
app.post('/webhook', async (req, res) => {
  await apiRequest(`${process.env.BACKEND_URL}/api/attendance`, {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});
```

---

## Integration Checklist

### RABTUL Services
- [x] Auth Service (login, OTP, JWT)
- [x] Profile Service (employee data)
- [x] Wallet Service (coins, rewards)
- [x] Payment Service (Razorpay, UPI)
- [x] Notification Service (push, SMS, WhatsApp)

### REZ Intelligence
- [x] Intent Predictor
- [x] Predictive Engine
- [x] Signal Aggregator
- [x] Identity Graph

### REZ Merchant
- [x] Benefits API
- [x] Offers API
- [x] Rewards API

### Hojai AI
- [x] Agents API
- [x] Flow API
- [x] Communications API

### AdBazaar
- [x] Gamification API
- [x] Rewards API

### RidZa
- [x] Salary Advance API
- [x] Loan API

### RisnaEstate
- [x] Properties API
- [x] Investments API
- [x] Net Worth API

---

## Troubleshooting

### Service Unavailable
```bash
# Check if service is running
curl http://localhost:4006/health

# Check Docker status
docker-compose ps

# View logs
docker-compose logs backend
```

### Auth Errors
```bash
# Check token
echo $JWT_SECRET

# Verify in RABTUL Auth
curl -X POST http://localhost:4002/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### MongoDB Connection
```bash
# Check MongoDB
docker-compose logs mongodb

# Verify connection string
echo $MONGODB_URI
```
