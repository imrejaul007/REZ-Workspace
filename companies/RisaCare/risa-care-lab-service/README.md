# RisaCare Laboratory Information System (LIS)

A production-ready B2B Laboratory Information System for diagnostic laboratories, part of the RisaCare healthcare ecosystem.

## Overview

RisaCare Lab Service provides comprehensive laboratory management capabilities including:
- Test catalog management across multiple categories
- Sample collection, tracking, and chain of custody
- Diagnostic report generation with result validation
- Order management with pricing and payment tracking
- Collection center network management

## Features

### Core Capabilities
- **Multi-Category Test Support**: Hematology, Biochemistry, Microbiology, Pathology, Imaging
- **Sample Lifecycle Tracking**: Collection → Transit → Received → Processing → Completed
- **Result Validation**: Automatic flagging of critical, high, and low values
- **Report Management**: Draft → Verified → Released workflow with pathologist sign-off
- **Order Processing**: Create, modify, cancel orders with test additions
- **Collection Center Network**: Manage multiple sample collection points

### Test Categories
| Category | Description |
|----------|-------------|
| Hematology | Blood cell analysis, coagulation tests |
| Biochemistry | Blood chemistry, enzymes, metabolites |
| Microbiology | Infectious disease markers, cultures |
| Pathology | Urinalysis, histopathology |
| Imaging | X-rays, ultrasounds, specialized imaging |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Lab Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /lab | Get lab information |
| POST | /lab | Initialize/update lab |
| PUT | /lab | Update lab details |
| POST | /lab/collection-centers | Add collection center |

### Test Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tests | List all tests |
| GET | /tests/:testId | Get test details |
| GET | /tests/category/:category | Tests by category |
| POST | /tests | Add new test |

### Sample Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /samples | Collect new sample |
| GET | /samples/:sampleId | Get sample status |
| GET | /samples/:sampleId/track | Track sample journey |
| PUT | /samples/:sampleId/receive | Receive sample at lab |

### Report Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /reports | Create report |
| GET | /reports/:reportId | Get report |
| PUT | /reports/:reportId/results | Add/update results |
| PUT | /reports/:reportId/release | Release final report |
| GET | /reports/patient/:patientId | Patient reports |

### Order Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create new order |
| GET | /orders/:orderId | Get order details |
| PUT | /orders/:orderId/tests | Add tests to order |
| PUT | /orders/:orderId/cancel | Cancel order |

## Data Models

### Test
```typescript
{
  testId: string;
  name: string;
  category: 'hematology' | 'biochemistry' | 'microbiology' | 'pathology' | 'imaging';
  parameters: Parameter[];
  sampleType: string;
  turnaroundTime: number; // hours
  price: number;
}
```

### Sample Status Flow
```
collected → in_transit → received → processing → completed
```

### Result Status
- **normal**: Value within reference range
- **low**: Value below reference range
- **high**: Value above reference range
- **critical**: Value significantly outside range (>50% deviation)

### Report Status
```
draft → verified → released
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4742 | Server port |
| NODE_ENV | development | Environment mode |

## Health Check

```bash
curl http://localhost:4742/health
```

Response:
```json
{
  "status": "healthy",
  "service": "risa-care-lab",
  "timestamp": "2026-06-01T00:00:00.000Z"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  RisaCare Lab Service                    │
├─────────────────────────────────────────────────────────┤
│  Express.js API Layer                                    │
│  ├── Lab Routes                                          │
│  ├── Test Routes                                        │
│  ├── Sample Routes                                      │
│  ├── Report Routes                                      │
│  └── Order Routes                                       │
├─────────────────────────────────────────────────────────┤
│  Service Layer                                           │
│  ├── LabService      - Lab & collection center mgmt    │
│  ├── TestService     - Test catalog management          │
│  ├── SampleService   - Sample collection & tracking    │
│  ├── ResultService   - Result validation & flags        │
│  ├── ReportService   - Report generation & release     │
│  └── OrderService    - Order processing & payment      │
├─────────────────────────────────────────────────────────┤
│  Models (Zod schemas for validation)                    │
│  └── lab.ts                                             │
└─────────────────────────────────────────────────────────┘
```

## Integration Points

### RisaCare Ecosystem
- **Port 4742**: This service
- **RisaCare Core**: Patient data management
- **RisaCare Hospital OS**: Order integration with clinical systems

### External Systems
- EMR/EHR systems via REST API
- Laboratory equipment (via instrument integration)
- PDF generation for reports

## Sample Workflow

1. **Doctor orders tests** via `/orders`
2. **Sample collected** at collection center via `/samples`
3. **Sample received** at lab via `/samples/:id/receive`
4. **Results entered** via `/reports/:id/results`
5. **Pathologist verifies** via `/reports/:id/verify`
6. **Report released** via `/reports/:id/release`

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "details": [...] // Zod validation errors if applicable
}
```

## License

Part of RTNM Group / RisaCare Healthcare Ecosystem
