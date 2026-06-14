# CorpPerks - Developer Guide

**Version:** 4.2.0
**Last Updated:** June 12, 2026

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 6+
- Redis 7+
- Docker & Docker Compose
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/imrejaul007/CorpPerks.git
cd CorpPerks

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose up -d

# Start API Gateway
cd api-gateway && npm run dev

# Start Backend (new terminal)
cd backend && npm run dev

# Start a web app (new terminal)
cd peopleos && npm run dev
```

### Access Points

| Service | URL | Default Port |
|---------|-----|--------------|
| PeopleOS | http://localhost:3000 | 3000 |
| API Gateway | http://localhost:4700 | 4700 |
| Backend | http://localhost:4006 | 4006 |
| MongoDB | mongodb://localhost:27017 | 27017 |
| Redis | redis://localhost:6379 | 6379 |

---

## Project Structure

```
CorpPerks/
├── 🌐 Web Apps (8)
│   ├── peopleos/              # Workforce OS
│   ├── talentai/              # Career Intelligence
│   ├── insight-campus/        # Student Campus
│   ├── client-portal/         # Client Management
│   ├── admin-dashboard/       # Admin Panel
│   ├── super-admin/           # Platform Admin
│   ├── support-portal/        # Support Hub
│   └── corpperks-landing/     # Marketing Landing
│
├── 📱 Mobile Apps (5)
│   ├── people/                # MyTalent Employee App
│   ├── manager-app/          # Manager App
│   ├── client-app/            # Client App
│   ├── talentai-app/          # TalentAI Mobile
│   └── insight-app/           # InsightCampus Mobile
│
├── 🍽️ Restaurant
│   └── restopapa/             # Restaurant OS
│
├── ⚙️ Microservices (31)
│   ├── api-gateway/           # Port 4700
│   ├── backend/              # Port 4006
│   ├── corpperks-intelligence/ # Port 4135
│   ├── payroll-service/       # Port 4738
│   └── ... (27 more)
│
├── 🏢 BIZORA
│   └── services/
│       ├── hotel-os/
│       ├── restaurant-os/
│       ├── salon-os/
│       ├── retail-os/
│       └── fitness-os/
│
├── 🔗 Bridges
│   ├── REZ-merchant-corpperks-bridge/
│   ├── corpid-profile-bridge/
│   └── ...
│
├── 🤖 AI Agents
│   ├── role-ai-agents/
│   └── ai-agents-service/
│
├── 📚 Shared
│   ├── shared/                # Shared utilities
│   ├── config/                # Configuration
│   └── docs/                  # Documentation
│
└── Configuration
    ├── docker-compose.yml
    ├── docker-compose.prod.yml
    └── Dockerfile
```

---

## Development Workflow

### Starting Services

```bash
# Start all infrastructure
docker-compose up -d

# Start API Gateway
cd api-gateway && npm run dev

# Start Backend
cd backend && npm run dev

# Start multiple services in parallel
npm run dev:all
```

### Running Web Apps

```bash
# PeopleOS (Workforce OS)
cd peopleos && npm run dev

# TalentAI (Career Intelligence)
cd talentai && npm run dev

# InsightCampus (Student Campus)
cd insight-campus && npm run dev
```

### Running Mobile Apps

```bash
# People App (Employee)
cd people && npx expo start

# TalentAI App
cd talentai-app && npx expo start

# Insight App
cd insight-app && npx expo start
```

### Running Microservices

```bash
# Start individual service
cd payroll-service && npm run dev

# Start all services
npm run services:dev
```

---

## Architecture

### API Gateway Pattern

All requests flow through the API Gateway (port 4700):

```
Client → API Gateway (4700) → Individual Services
```

### Service Communication

Services communicate via:
- REST APIs (HTTP)
- Message Queue (Bull/Redis)
- WebSocket (realtime-service)

### Database Pattern

Each service has its own MongoDB database:
- `corpperks_api` - API Gateway
- `corpperks_backend` - Backend
- `corpperks_payroll` - Payroll Service
- etc.

---

## Key Services

### API Gateway (port 4700)

Central entry point for all API requests.

**Key Responsibilities:**
- Authentication & Authorization
- Rate Limiting
- Request Routing
- Response Normalization

**Configuration:**
```bash
API_GATEWAY_PORT=4700
API_GATEWAY_URL=http://localhost:4700
```

### Backend (port 4006)

Core HRMS service handling employee data.

**Key Responsibilities:**
- Employee CRUD
- Department Management
- Org Chart
- Leave Management

**Models:**
- Employee
- Department
- Designation
- Leave
- LeaveBalance

### Payroll Service (port 4738)

Indian payroll processing.

**Key Responsibilities:**
- Salary Calculation
- PF/ESI/TDS Deductions
- Payslip Generation
- Reimbursement Processing

**Indian Compliance:**
- PF (Provident Fund)
- ESI (Employee State Insurance)
- TDS (Tax Deducted at Source)
- Professional Tax
- Gratuity
- LWF (Labor Welfare Fund)

---

## CorpID Integration

### Overview

CorpID v2.0 provides universal employee identity across all RTNM products.

### Configuration

```bash
# .env
CORPID_SERVICE_URL=http://localhost:4702
CORPID_INTERNAL_TOKEN=your-internal-token
CORPID_SYNC_ON_CREATE=true
CORPID_SYNC_ON_UPDATE=true
```

### Migration

```bash
# Dry run
npx tsx scripts/migrateEmployeesToCorpId.ts --dry-run

# Actual migration
npx tsx scripts/migrateEmployeesToCorpId.ts
```

### API Usage

```typescript
import { CorpIdService } from '@/shared/corpid';

// Create CorpID for employee
const corpId = await CorpIdService.createIdentity({
  employeeId: employee._id,
  email: employee.email,
  name: employee.name,
  company: employee.companyId
});

// Sync profile updates
await CorpIdService.syncProfile(employeeId, profileData);
```

---

## BIZORA - Industry Bridges

### Overview

BIZORA bridges CorpPerks to REZ Merchant industry solutions.

### Available Bridges

| Industry | Bridge | Connects To |
|----------|--------|-------------|
| Hotel | hotel-os | REZ-Merchant/hotel-ecosystem |
| Restaurant | restaurant-os | REZ-Merchant/restauranthub |
| Salon | salon-os | REZ-Merchant/REZ-salon-ecosystem |
| Retail | retail-os | REZ-Merchant/REZ-retail-app |
| Fitness | fitness-os | REZ-Merchant/REZ-fitness-app |

### Integration Pattern

```typescript
// Example: Get hotel benefits for employee
const benefits = await BIZORAService.getBenefits({
  industry: 'hotel',
  employeeId: employee._id,
  benefitType: 'room_discount'
});
```

---

## AI Agents

### Role AI Agents (40)

10 roles × 4 levels of expertise:

| Role | L1 | L2 | L3 | L4 |
|------|-----|-----|-----|-----|
| Software | CodeBuddy | DevPro | TechLead | CTO Advisor |
| Sales | SalesBuddy | SalesPro | SalesLeader | Revenue Strategist |
| HR | HRBuddy | HRPro | HRManager | CHRO Counselor |
| ... | ... | ... | ... | ... |

### General AI Agents (6)

- Career Coach
- Productivity Advisor
- Learning Coach
- Financial Advisor
- Benefits Assistant
- HR Assistant

### Using AI Agents

```typescript
import { AIAgentService } from '@/ai-agents-service';

// Chat with career coach
const response = await AIAgentService.chat({
  agent: 'career-coach',
  userId: user._id,
  message: 'How do I become a tech lead?'
});
```

---

## RTNM Ecosystem Integration

### RABTUL Integration

Authentication, Wallet, and Payment services.

```bash
RABTUL_SERVICE_URL=https://api.rabtul.com
RABTUL_API_KEY=your-api-key
```

### HOJAI AI Integration

AI Memory, Agents, and Workflows.

```bash
HOJAI_SERVICE_URL=https://api.hojai.ai
HOJAI_API_KEY=your-api-key
```

### REZ Merchant Integration

GST Invoicing, Benefits, and HRIS.

```bash
REZ_MERCHANT_URL=https://api.rezmerchant.com
REZ_MERCHANT_API_KEY=your-api-key
```

---

## API Development

### Creating New Endpoints

1. Add route in service router:

```typescript
// services/your-service/src/routes/employee.ts
router.get('/employees', async (req, res) => {
  const employees = await EmployeeService.findAll(req.query);
  res.json({ success: true, data: employees });
});
```

2. Register route in main app:

```typescript
// services/your-service/src/app.ts
import employeeRoutes from './routes/employee';

app.use('/api/v1/employees', employeeRoutes);
```

3. Add validation schema:

```typescript
// services/your-service/src/validations/employee.ts
import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  department: z.string(),
  // ...
});
```

### API Response Format

```typescript
// Success
res.json({
  success: true,
  data: payload,
  meta: { page: 1, total: 100 }
});

// Error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    details: [...]
  }
});
```

---

## Testing

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Specific service
cd backend && npm test
```

### Writing Tests

```typescript
// __tests__/employee.test.ts
import { describe, it, expect } from 'vitest';
import { EmployeeService } from '@/services/employee';

describe('EmployeeService', () => {
  it('should create employee', async () => {
    const employee = await EmployeeService.create({
      name: 'John Doe',
      email: 'john@example.com'
    });
    expect(employee).toBeDefined();
    expect(employee.email).toBe('john@example.com');
  });
});
```

---

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Vercel Deployment (Web Apps)

```bash
# Deploy PeopleOS
cd peopleos && vercel --prod

# Deploy TalentAI
cd talentai && vercel --prod

# Deploy all web apps
./deploy-all.sh
```

### Expo EAS Build (Mobile)

```bash
# Configure
cd people && eas build:configure

# iOS
eas build --platform ios

# Android
eas build --platform android

# Submit
eas submit --platform ios
eas submit --platform android
```

---

## Environment Variables

### Required Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/corpperks
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Services
API_GATEWAY_URL=http://localhost:4700
CORPID_SERVICE_URL=http://localhost:4702

# RTNM Integration
RABTUL_SERVICE_URL=https://api.rabtul.com
HOJAI_SERVICE_URL=https://api.hojai.ai
REZ_MERCHANT_URL=https://api.rezmerchant.com
```

### Service-Specific Variables

```bash
# Payroll Service
PAYROLL_SERVICE_PORT=4738
PF_ACCOUNT_NUMBER=your-pf-number
ESI_NUMBER=your-esi-number

# Push Service
FCM_PROJECT_ID=your-firebase-project
APNS_KEY_ID=your-apns-key
```

---

## Security Best Practices

### Logging with PII Redaction

```typescript
import { logger } from '@/shared/logger';

// Logs automatically redact PII
logger.info('Employee created', {
  employeeId: employee._id,
  email: employee.email, // Will be redacted
  name: employee.name    // Will be redacted
});
```

### Input Validation

```typescript
import { z } from 'zod';

const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  department: z.string().uuid()
});

export const validateEmployee = (data: unknown) =>
  createEmployeeSchema.parse(data);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

---

## Common Tasks

### Adding a New Service

1. Create service directory structure:

```bash
mkdir -p services/new-service/src/{routes,models,services,middleware}
```

2. Copy package.json from existing service

3. Update docker-compose.prod.yml

4. Add to deploy-all.sh

### Adding a New Web App

1. Create Next.js app:

```bash
npx create-next-app@latest new-app --typescript --tailwind
```

2. Configure API client:

```typescript
// lib/api.ts
export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  tokenGetter: () => getAuthToken()
});
```

3. Add to Vercel deployment

### Adding a New Mobile App

1. Create Expo app:

```bash
npx create-expo-app new-app --template blank-typescript
```

2. Configure EAS Build:

```bash
cd new-app && eas build:configure
```

3. Add to app stores

---

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB status
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Reset MongoDB
docker-compose down -v
docker-compose up -d
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

### Service Not Starting

```bash
# Check port availability
lsof -i :4700

# Check logs
cd api-gateway && npm run dev 2>&1

# Check environment
echo $MONGODB_URI
```

---

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces for types
- Use type inference where possible
- Export types for public APIs

### File Naming

```
component-name.ts      # React components
service-name.ts       # Business logic
route-name.ts         # Express routes
model-name.ts         # Mongoose models
validation-name.ts    # Zod schemas
```

### Git Conventions

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| README.md | Overview and quick start |
| SOT.md | Complete product specifications |
| docs/API-REFERENCE.md | API endpoint documentation |
| docs/DEPLOYMENT-GUIDE.md | Detailed deployment |
| docs/INTEGRATIONS.md | Integration setup |
| docs/REALTIME-PUSH-INTEGRATION.md | Real-time setup |

### Feature Documentation

| Product | Location |
|---------|----------|
| PeopleOS | docs/peopleos/FEATURES.md |
| TalentAI | docs/talentai/FEATURES.md |
| InsightCampus | docs/insight-campus/FEATURES.md |
| People App | docs/people/FEATURES.md |
| RestoPapa | docs/restopapa/FEATURES.md |
| BIZORA | docs/bizora/FEATURES.md |
| CorpID | docs/corpid/FEATURES.md |

---

## Support

- **GitHub Issues:** https://github.com/imrejaul007/CorpPerks/issues
- **Documentation:** https://docs.corpperks.com
- **Support Email:** support@corpperks.com

---

*Last Updated: June 12, 2026*
*CorpPerks - Developer Guide*