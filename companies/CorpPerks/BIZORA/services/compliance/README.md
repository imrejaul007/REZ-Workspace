# BIZORA Compliance Service

Business compliance checking service for GST, TDS, PF/ESI, and regulatory compliance.

## Features

- **GST Compliance** - Registration verification, turnover threshold checks, tax liability calculation
- **TDS Compliance** - Section-wise deduction verification, PAN validation, threshold checks
- **PF/ESI Compliance** - Employee count verification, contribution tracking
- **Compliance Reports** - Generate and retrieve detailed compliance reports
- **Real-time Status** - Check overall compliance status with scores and issues

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/CorpPerks/BIZORA/services/compliance

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check

```bash
# Basic health check
GET /health

# Readiness check
GET /health/ready
```

### Compliance Status

```bash
# Get overall compliance status
GET /api/compliance/status?companyId=<company_id>
```

### Compliance Check

```bash
# Run a compliance check
POST /api/compliance/check
Content-Type: application/json

{
  "companyId": "company_123",
  "type": "gst",
  "period": {
    "start": "2024-04-01",
    "end": "2024-04-30"
  },
  "data": {
    "turnover": 5000000,
    "gstin": "27AABCU9603R1ZM",
    "inputTaxCredit": 45000,
    "outputTax": 90000
  }
}
```

### GST Compliance Check

```bash
# Run GST compliance check
POST /api/compliance/gst
Content-Type: application/json

{
  "companyId": "company_123",
  "turnover": 5000000,
  "gstin": "27AABCU9603R1ZM",
  "inputTaxCredit": 45000,
  "outputTax": 90000
}
```

### TDS Compliance Check

```bash
# Run TDS compliance check
POST /api/compliance/tds
Content-Type: application/json

{
  "companyId": "company_123",
  "tan": "DELH12345E",
  "transactions": [
    {
      "section": "194C",
      "amount": 50000,
      "recipientPan": "AAAPL1234C"
    },
    {
      "section": "194J",
      "amount": 100000,
      "recipientPan": "BBGPL5678D"
    }
  ]
}
```

### Compliance Reports

```bash
# List compliance reports
GET /api/compliance/reports?companyId=<company_id>&type=gst&limit=50&offset=0
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "companyId": "company_123",
    "overallStatus": "compliant",
    "score": 95,
    "checks": [...],
    "criticalIssues": 0,
    "warnings": 2
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "companyId",
        "message": "Company ID is required"
      }
    ]
  },
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

## Configuration

Environment variables can be configured in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4002 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection URI | mongodb://localhost:27017/bizora-compliance |
| `LOG_LEVEL` | Logging level | info |

## Compliance Types

| Type | Description | Due Date |
|------|-------------|----------|
| `gst` | GST compliance | 11th of each month |
| `tds` | TDS compliance | 30th of next quarter month |
| `pf` | PF compliance | 15th of each month |
| `esi` | ESI compliance | 15th of each month |
| `professional_tax` | Professional tax | Varies by state |
| `annual` | Annual compliance | March 31st |
| `custom` | Custom compliance | As specified |

## Issue Severity Levels

| Level | Score Impact | Description |
|-------|-------------|-------------|
| `critical` | -30 | Registration/filing required |
| `high` | -20 | Significant compliance gap |
| `medium` | -10 | Minor compliance issue |
| `low` | -5 | Recommendation/advisory |

## GST Thresholds (India)

| Turnover | Rate |
|----------|------|
| < Rs 40 Lakhs | Nil (composition scheme eligible) |
| >= Rs 40 Lakhs | Mandatory GST |
| >= Rs 10 Crores | Audit required |

## TDS Sections

| Section | Rate | Description |
|---------|------|-------------|
| 192 | 10% | Salary |
| 192A | 10% | PF withdrawal |
| 193 | 10% | Securities interest |
| 194 | 10% | Dividends |
| 194A | 10% | Other interest |
| 194B | 30% | Lottery/Games |
| 194C | 2% | Contractor |
| 194D | 10% | Insurance commission |
| 194H | 10% | Commission/Brokerage |
| 194I | 2% | Rent |
| 194J | 10% | Professional/Technical |

## Project Structure

```
services/compliance/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── index.ts           # Main server
    ├── config/
    │   └── index.ts       # Configuration
    ├── routes/
    │   └── compliance.ts  # API routes
    ├── models/
    │   └── ComplianceCheck.ts  # Mongoose model
    ├── services/
    │   └── complianceService.ts  # Business logic
    └── middleware/
        └── errorHandler.ts  # Error handling
```

## License

Proprietary - BIZORA/CorpPerks
