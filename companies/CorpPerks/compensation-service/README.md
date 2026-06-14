# Compensation Planning Service

**Port: 4740**
**Company: CorpPerks**

A comprehensive compensation planning and management service for handling salary bands, compensation packages, increments, promotions, and bonuses.

## Features

- **Salary Bands**: Define and manage organizational salary levels
- **Compensation Packages**: Track employee compensation including salary, equity, and benefits
- **Increment Plans**: Plan, approve, and process annual/performance increments
- **Promotions**: Manage employee promotions between salary bands
- **Bonus Plans**: Configure and calculate bonus eligibility (annual, quarterly, performance, retention)

## Quick Start

```bash
cd CorpPerks/compensation-service

# Install dependencies
npm install

# Start development server
npm run dev

# Seed demo data
npm run seed

# Build for production
npm run build
```

## API Endpoints

### Salary Bands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bands` | List all salary bands |
| GET | `/api/bands/:id` | Get band by ID |
| POST | `/api/bands` | Create salary band |
| PATCH | `/api/bands/:id` | Update salary band |
| DELETE | `/api/bands/:id` | Delete salary band |
| GET | `/api/bands/level/:level` | Get bands by level |

### Compensation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compensation/:employeeId` | Get employee compensation |
| POST | `/api/compensation` | Create compensation package |
| PATCH | `/api/compensation/:id` | Update compensation package |
| DELETE | `/api/compensation/:id` | Delete compensation package |

### Increments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/increments/plans` | List increment plans |
| POST | `/api/increments/plan` | Create increment plan |
| POST | `/api/increments/plan/increments` | Plan increments for employees |
| POST | `/api/increments/approve` | Approve increment plan |
| POST | `/api/increments/reject` | Reject increment plan |
| GET | `/api/increments/requests` | List increment requests |
| POST | `/api/increments/request/approve` | Approve increment request |
| POST | `/api/increments/request/reject` | Reject increment request |
| POST | `/api/increments/process` | Process approved increments |

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/promotions` | List all promotions |
| GET | `/api/promotions/pending` | Get pending promotions |
| GET | `/api/promotions/:id` | Get promotion by ID |
| POST | `/api/promotions` | Create promotion |
| POST | `/api/promotions/approve` | Approve promotion |
| POST | `/api/promotions/reject` | Reject promotion |
| POST | `/api/promotions/process` | Process approved promotion |

### Bonus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bonus/plans` | List bonus plans |
| GET | `/api/bonus/plans/:id` | Get bonus plan by ID |
| POST | `/api/bonus/plans` | Create bonus plan |
| GET | `/api/bonus/:employeeId` | Get employee bonus eligibility |
| POST | `/api/bonus/calculate` | Calculate bonus eligibility |
| POST | `/api/bonus/pay` | Mark bonus as paid |
| GET | `/api/bonus/plan/:planId/eligibilities` | Get plan eligibilities |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

## Models

### SalaryBand
```typescript
{
  name: string;        // "Associate", "Senior Associate", etc.
  minSalary: number;   // Minimum salary for band
  maxSalary: number;   // Maximum salary for band
  level: string;       // "L1", "L2", etc.
  currency: string;     // "INR" (default)
}
```

### CompensationPackage
```typescript
{
  employeeId: string;
  bandId: ObjectId;
  salary: number;
  equity: {
    shares: number;
    vestingPeriodMonths: number;
    strikePrice: number;
  };
  benefits: {
    healthInsurance: number;
    retirement: number;
    allowances: Record<string, number>;
    otherBenefits: Record<string, number>;
  };
  effectiveDate: Date;
}
```

### IncrementPlan
```typescript
{
  name: string;
  fiscalYear: string;      // "FY26"
  percentage: number;       // 0-100
  criteria: {
    eligibilityType: 'all' | 'performance_based' | 'tenure_based';
    minPerformanceRating?: number;
    minTenureMonths?: number;
  };
  status: 'draft' | 'planned' | 'approved' | 'rejected';
  plannedDate: Date;
  createdBy: string;
}
```

### Promotion
```typescript
{
  employeeId: string;
  oldBandId: ObjectId;
  newBandId: ObjectId;
  oldSalary: number;
  newSalary: number;
  effectiveDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
}
```

### BonusPlan
```typescript
{
  name: string;
  type: 'annual' | 'quarterly' | 'performance' | 'signing' | 'retention';
  criteria: {
    eligibilityType: 'all' | 'performance_based' | 'tiered';
    tiers?: Array<{ minRating, maxRating, percentage }>;
    minPerformanceRating?: number;
    minTenureMonths?: number;
  };
  payoutDate: Date;
  budget?: number;
  status: 'active' | 'inactive' | 'completed';
}
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4740 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/compensation_db |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |
| NODE_ENV | Environment | development |
| CORS_ORIGIN | CORS allowed origin | * |

## Security

- Rate limiting: 1000 requests per 15 minutes per IP
- Helmet.js security headers
- Zod input validation on all endpoints
- Timing-safe token comparison for authentication
- CORS configuration

## Tech Stack

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
