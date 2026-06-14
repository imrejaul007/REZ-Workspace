# REZ-expense

**Smart Expense Tracking Service for REZ Consumer - Enhanced with AI**

An intelligent expense tracking service with AI-powered auto-categorization, policy enforcement, spend insights, and smart receipt matching. Built with Express, Mongoose, and integrated with REZ ecosystem services.

## Overview

REZ-expense enables users to track their daily spending with intelligent automation. It supports both manual entry and receipt scanning, automatically categorizes expenses using AI, enforces expense policies, and provides deep insights into spending patterns.

## Status

**ENHANCED - Built June 2026**

New AI-powered features include auto-categorization, policy violation detection, spend pattern insights, and smart receipt matching.

## Features

### Core Features
- **Manual Expense Entry**: Quick add expenses with category selection
- **Receipt Capture**: Store receipt images for documentation
- **Category Management**: Eight predefined expense categories
- **Spending Analysis**: View spending by category and time period
- **Location Tracking**: Track expenses by location
- **Analytics Integration**: Send data to REZ Analytics for insights
- **Intelligence Integration**: Track spending patterns with REZ Intelligence

### AI Auto-Categorization
- **Intelligent Categorization**: Uses Claude to categorize expenses automatically
- **Learning System**: Learns from user's categorization history
- **Confidence Scoring**: Provides category suggestions with confidence scores
- **One-Click Confirmation**: Accept suggestions or make changes easily
- **Pattern Recognition**: Recognizes merchant patterns for accurate categorization

### Policy Enforcement
- **Tenant Policies**: Configurable expense policies per tenant
- **Violation Detection**: Automatically flags policy violations
- **Budget Limits**: Daily, weekly, monthly budget enforcement
- **Approval Routing**: Suggests appropriate approvers for violations
- **Escalation Paths**: Configurable escalation workflows

### Spend Pattern Insights
- **Weekly Insights**: Detailed weekly spending analysis
- **Monthly Insights**: Comprehensive monthly reports
- **Anomaly Detection**: Identifies unusual spending patterns
- **Trend Analysis**: Compare spending across periods
- **Budget Tracking**: Real-time budget vs actual tracking
- **Top Merchants**: Analysis of top spending merchants

### Smart Receipt Matching
- **Auto-Matching**: Automatically matches receipts to transactions
- **Confidence Scoring**: Match confidence based on multiple factors
- **Merchant Matching**: Fuzzy matching for merchant names
- **Amount Tolerance**: Configurable amount matching tolerance
- **Unmatched Receipts**: Flag unmatched receipts for review

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **AI Integration**: Claude via HOJAI Finance AI (Port 4830)

## Project Structure

```
REZ-expense/
├── src/
│   ├── service.ts                    # Express app entry point
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── services/
│   │   ├── ai-categorization.service.ts   # AI categorization logic
│   │   ├── policy.service.ts              # Policy enforcement
│   │   ├── insights.service.ts           # Spend insights
│   │   └── receipt-matching.service.ts   # Receipt matching
│   ├── middleware/
│   │   └── policy.middleware.ts     # Policy validation middleware
│   └── routes/
│       └── expense.routes.ts         # API route handlers
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3013**

The service runs on `PORT=3013` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- npm or yarn
- HOJAI Finance AI service (optional, for AI features)

### Installation

```bash
# Clone and navigate
cd REZ-expense

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure in .env:
# MONGODB_URI=mongodb://localhost:27017/rez-expense
# HOJAIFINANCE_AI_URL=http://localhost:4830

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Expense Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/expense/add` | POST | Add new expense with AI categorization |
| `GET /api/expense/history/:userId` | GET | Get expense history |
| `GET /api/expense/summary/:userId` | GET | Get spending summary |
| `GET /api/expense/:id` | GET | Get single expense |
| `PUT /api/expense/:id` | PUT | Update expense |
| `DELETE /api/expense/:id` | DELETE | Delete expense |
| `GET /api/expense/budget/:userId` | GET | Get budget status |

### AI Categorization

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/expense/:id/categorize` | POST | Auto-categorize expense |
| `POST /api/expense/:id/confirm-category` | POST | Confirm category |
| `GET /api/expense/category-suggestions` | GET | Get category suggestions |

### Policy Enforcement

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/policies/validate/:expenseId` | POST | Validate expense against policy |
| `GET /api/policies/:tenantId` | GET | Get tenant policies |
| `POST /api/policies/violations` | POST | Log policy violation |
| `GET /api/policies/violations/patterns/:tenantId` | GET | Get violation patterns |
| `POST /api/policies/violations/:violationId/resolve` | POST | Resolve violation |
| `GET /api/policies/violations/:tenantId` | GET | Get tenant violations |

### Insights

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/insights/:userId/weekly` | GET | Weekly spending insights |
| `GET /api/insights/:userId/monthly` | GET | Monthly spending insights |
| `GET /api/insights/:userId/anomalies` | GET | Spending anomalies |
| `GET /api/insights/:userId/budget` | GET | Budget tracking |
| `GET /api/insights/:userId/trends` | GET | Spending trends |

### Receipt Matching

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/receipts/match` | POST | Auto-match receipts |
| `GET /api/receipts/unmatched` | GET | Get unmatched receipts |
| `POST /api/receipts/suggest-merchant` | POST | Suggest merchant matches |
| `POST /api/receipts/auto-match` | POST | Auto-match high confidence |

### Receipts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/receipt/add` | POST | Add receipt |
| `GET /api/receipt/:id` | GET | Get receipt |
| `POST /api/receipt/:id/match` | POST | Match receipt to expense |

### Category Learning

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/categories/history/:userId` | GET | Get category history |
| `POST /api/categories/learn` | POST | Record category learning |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Health check |
| `GET /ready` | GET | Readiness check |

## API Examples

### Add Expense with AI Categorization

```bash
curl -X POST http://localhost:3013/api/expense/add \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "merchant_name": "Dominos Pizza",
    "amount": 850,
    "date": "2026-06-05",
    "auto_categorize": true,
    "tenant_id": "company-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "expense": {
    "expense_id": "EXP-1717500000000-abc123",
    "user_id": "user123",
    "merchant_name": "Dominos Pizza",
    "category": "food",
    "amount": 850,
    "ai_categorization": {
      "suggested_category": "food",
      "confidence": 0.92,
      "reasoning": "Matched merchant pattern",
      "requires_review": false
    }
  },
  "message": "Expense added successfully"
}
```

### Auto-Categorize Expense

```bash
curl -X POST http://localhost:3013/api/expense/EXP-123/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_name": "Uber",
    "amount": 320,
    "date": "2026-06-05",
    "force_recategorize": true
  }'
```

### Validate Against Policy

```bash
curl -X POST http://localhost:3013/api/policies/validate/EXP-123 \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: company-001" \
  -d '{
    "expense": {
      "expense_id": "EXP-123",
      "merchant_name": "Amazon",
      "amount": 15000,
      "category": "shopping"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expense_id": "EXP-123",
    "is_valid": true,
    "violations": [],
    "requires_approval": true,
    "suggested_approvers": ["manager"],
    "approval_routing": {
      "primary_approver": "manager",
      "approver_role": "manager",
      "escalation_path": ["manager"],
      "estimated_approval_time": "2 hours"
    }
  }
}
```

### Get Weekly Insights

```bash
curl http://localhost:3013/api/insights/user123/weekly
```

**Response:**
```json
{
  "success": true,
  "data": {
    "week_start": "2026-06-01T00:00:00.000Z",
    "week_end": "2026-06-07T23:59:59.999Z",
    "total_spent": 25000,
    "category_breakdown": [
      {"_id": "food", "total": 8500, "count": 12},
      {"_id": "travel", "total": 5000, "count": 8},
      {"_id": "shopping", "total": 7500, "count": 3}
    ],
    "top_merchants": [
      {"_id": "Amazon", "total": 5000, "count": 2},
      {"_id": "Dominos", "total": 2500, "count": 5}
    ],
    "comparison_to_previous_week": 12.5,
    "insights": [...],
    "anomalies": [...]
  }
}
```

### Get Monthly Insights

```bash
curl "http://localhost:3013/api/insights/user123/monthly?month=5&year=2026"
```

### Get Spending Anomalies

```bash
curl "http://localhost:3013/api/insights/user123/anomalies?days=30"
```

### Auto-Match Receipts

```bash
curl -X POST http://localhost:3013/api/receipts/match \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_ids": ["RCP-001", "RCP-002"],
    "user_id": "user123",
    "auto_match_threshold": 0.9
  }'
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3013 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/rez-expense |

### External Services

| Variable | Description | Default |
|----------|-------------|---------|
| `ANALYTICS_API` | Analytics service URL | https://rez-analytics.onrender.com |
| `MERCHANT_API` | Merchant service URL | https://rez-merchant.onrender.com |
| `INTELLIGENCE_API` | Intelligence service URL | https://rez-intelligence.onrender.com |
| `HOJAIFINANCE_AI_URL` | HOJAI Finance AI service | http://localhost:4830 |
| `HOJAIFINANCE_AI_API_KEY` | HOJAI API key | - |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |

## Expense Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `food` | Food and dining | Restaurants, delivery, groceries |
| `travel` | Transportation | Uber, flights, bus |
| `shopping` | Retail purchases | Amazon, clothing |
| `entertainment` | Leisure activities | Movies, concerts, subscriptions |
| `utilities` | Bills and utilities | Electricity, water, internet |
| `healthcare` | Medical expenses | Pharmacy, doctor visits |
| `education` | Learning expenses | Books, courses, tuition |
| `other` | Miscellaneous | Everything else |

## Policy Rules

### Available Rule Types

| Type | Description |
|------|-------------|
| `amount_exceeds` | Flag expenses exceeding threshold |
| `category_not_allowed` | Block specific categories |
| `merchant_blacklist` | Block blacklisted merchants |
| `time_window` | Restrict expense times |
| `frequency_exceeded` | Flag unusual frequency |

### Violation Severity

| Severity | Description | Action |
|----------|-------------|--------|
| `critical` | Direct violation | Auto-reject |
| `high` | Significant violation | Require escalation |
| `medium` | Moderate concern | Require approval |
| `low` | Minor issue | Flag for review |
| `info` | Informational | Log only |

## Data Models

### Expense Schema

```typescript
interface Expense {
  expense_id: string;
  user_id: string;
  merchant_name: string;
  category: string;
  amount: number;
  currency: string;
  date: Date;
  receipt_url?: string;
  location?: { city: string; lat: number; lng: number };
  extracted_data?: Record<string, unknown>;
  ai_categorization?: {
    suggested_category: string;
    confidence: number;
    reasoning: string;
    requires_review: boolean;
    confirmed_at: Date;
  };
  policy_validation?: {
    is_valid: boolean;
    violations_count: number;
    requires_approval: boolean;
    validated_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}
```

### Policy Violation Schema

```typescript
interface PolicyViolation {
  violation_id: string;
  expense_id: string;
  policy_id: string;
  tenant_id: string;
  user_id: string;
  rule_id: string;
  rule_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  actual_value: unknown;
  allowed_value?: unknown;
  resolution: 'pending' | 'approved' | 'rejected' | 'escalated' | 'waived';
  resolved_by?: string;
  resolved_at?: Date;
  suggested_approver?: string;
  created_at: Date;
}
```

### Receipt Schema

```typescript
interface Receipt {
  receipt_id: string;
  user_id: string;
  merchant_name?: string;
  amount?: number;
  date?: Date;
  image_url: string;
  ocr_data?: {
    merchant_name?: string;
    amount?: number;
    date?: Date;
    items?: ReceiptItem[];
    tax?: number;
    tip?: number;
    confidence: number;
  };
  matched_expense_id?: string;
  match_confidence?: number;
  match_status: 'unmatched' | 'pending' | 'matched' | 'flagged' | 'rejected';
  uploaded_at: Date;
  processed_at?: Date;
}
```

## Integration with HOJAI Finance AI

The service integrates with HOJAI Finance AI (Port 4830) for:

1. **AI Categorization**: Claude-powered expense categorization
2. **Policy Validation**: Tenant-specific policy enforcement
3. **Anomaly Detection**: Statistical analysis of spending patterns

When HOJAI Finance AI is unavailable, the service falls back to local categorization using merchant pattern matching.

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-expense .

# Run container
docker run -p 3013:3013 --env-file .env rez-expense
```

### Production Considerations

- Use managed MongoDB for production
- Configure proper retention policies for old expenses
- Set up indexes on user_id and date for performance
- Enable AI categorization for best results
- Configure tenant-specific policies

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-bills | 3012 | Receipt scanning |
| REZ-inbox | 3003 | Smart inbox |
| REZ-nearby | 3015 | Location discovery |
| HOJAI Finance AI | 4830 | AI categorization & policy |

## License

Private - REZ Consumer Application
