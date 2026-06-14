# RisaCare Chronic Care Management Service

A comprehensive microservice for managing chronic conditions like Diabetes, Hypertension, Thyroid, Asthma, Heart Disease, COPD, Arthritis, and Depression.

## Features

- **Condition Management**: Track and manage multiple chronic conditions per patient
- **Health Readings**: Record and track vital readings (blood sugar, blood pressure, heart rate, weight, etc.)
- **Trend Analysis**: Visualize health trends over time (week, month, quarter, year)
- **Care Protocols**: Customized care plans with target ranges and lifestyle recommendations
- **Smart Alerts**: Automatic alerts for out-of-range readings, medication reminders, and trend concerns
- **Control Scoring**: Calculate overall disease control scores
- **Reporting**: Generate comprehensive monthly reports and patient overviews
- **Scheduling**: Automated daily checks for reminders and trend analysis

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd risa-care-chronic-care-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Or build and start production
npm run build
npm start
```

### Configuration

Create a `.env` file:

```env
PORT=4720
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/risa_chronic_care
LOG_LEVEL=info
CORS_ORIGIN=*
```

## API Endpoints

### Conditions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/conditions` | Create a new chronic condition |
| GET | `/api/v1/conditions/:patientId` | Get all conditions for a patient |
| GET | `/api/v1/conditions/details/:conditionId` | Get condition details |
| PUT | `/api/v1/conditions/:conditionId` | Update a condition |
| DELETE | `/api/v1/conditions/:conditionId` | Delete a condition |
| GET | `/api/v1/conditions/:conditionId/summary` | Get condition summary |

### Readings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/conditions/:conditionId/readings` | Add a reading |
| GET | `/api/v1/conditions/:conditionId/readings` | Get readings |
| GET | `/api/v1/conditions/:conditionId/trends` | Get trend analysis |

### Protocols

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/conditions/:conditionId/protocol` | Create care protocol |
| GET | `/api/v1/conditions/:conditionId/protocol` | Get protocol |
| PUT | `/api/v1/conditions/:conditionId/protocol/:protocolId` | Update protocol |
| GET | `/api/v1/conditions/:conditionId/recommendations` | Get recommendations |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/alerts/:patientId` | Get patient alerts |
| GET | `/api/v1/alerts/:patientId/stats` | Get alert statistics |
| PUT | `/api/v1/alerts/:alertId/acknowledge` | Acknowledge alert |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/:patientId/:conditionId` | Get monthly report |
| GET | `/api/v1/reports/:patientId/overview` | Get patient overview |
| GET | `/api/v1/control-score/:patientId` | Get control score |

## Supported Conditions

| Condition | Key Metrics |
|-----------|-------------|
| Diabetes | Blood Sugar, Blood Pressure, Weight |
| Hypertension | Blood Pressure, Heart Rate, Weight |
| Thyroid | TSH, Weight, Heart Rate, Mood |
| Asthma | Lung Function (FEV1), Heart Rate |
| Heart Disease | Blood Pressure, Heart Rate, Weight |
| COPD | Lung Function, Heart Rate |
| Arthritis | Pain Level, Weight |
| Depression | Mood Score, Weight |

## Supported Reading Types

- `blood_sugar` - mg/dL
- `blood_pressure` - mmHg
- `heart_rate` - bpm
- `weight` - kg
- `thyroid` - mIU/L (TSH)
- `lung_function` - % (FEV1)
- `pain_level` - scale (0-10)
- `mood` - scale (0-10)

## Target Ranges

The service includes default target ranges for each condition:

| Condition | Blood Sugar | Blood Pressure |
|-----------|-------------|----------------|
| Diabetes | 80-180 mg/dL | 90-140 mmHg |
| Hypertension | - | 90-120 mmHg |
| Heart Disease | - | 90-130 mmHg |

## Data Models

### ChronicCondition

```typescript
{
  patientId: string;
  conditionType: 'diabetes' | 'hypertension' | 'thyroid' | 'asthma' | 'heart_disease' | 'copd' | 'arthritis' | 'depression' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedDate: Date;
  medications: Medication[];
  status: 'active' | 'managed' | 'resolved';
  familyHistory: boolean;
  riskFactors: string[];
}
```

### ConditionReading

```typescript
{
  conditionId: ObjectId;
  patientId: string;
  readingType: ReadingType;
  value: number;
  unit: string;
  recordedAt: Date;
  notes?: string;
  recordedBy?: string;
}
```

### Alert

```typescript
{
  patientId: string;
  conditionId: ObjectId;
  type: 'out_of_range' | 'medication_due' | 'appointment_due' | 'trend_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}
```

## Control Score

The control score (0-100) indicates how well a condition is managed:

| Score | Status | Description |
|-------|--------|-------------|
| 80-100 | Excellent | Well-controlled condition |
| 60-79 | Good | Generally well-managed |
| 40-59 | Fair | Needs improvement |
| 0-39 | Poor | Requires immediate attention |

## Scheduled Jobs

The service runs automated tasks:

| Schedule | Task |
|----------|------|
| Daily 8 AM | Medication reminder check |
| Daily 9 AM | Appointment reminder check |
| Every 6 hours | Trend analysis |
| Daily midnight | Cleanup old acknowledged alerts |

## Health Check

```bash
curl http://localhost:4720/health
```

## Example Requests

### Create a Diabetes Condition

```bash
curl -X POST http://localhost:4720/api/v1/conditions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "conditionType": "diabetes",
    "severity": "moderate",
    "medications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "twice daily"
      }
    ]
  }'
```

### Add a Blood Sugar Reading

```bash
curl -X POST http://localhost:4720/api/v1/conditions/{conditionId}/readings \
  -H "Content-Type: application/json" \
  -d '{
    "readingType": "blood_sugar",
    "value": 145,
    "unit": "mg/dL",
    "notes": "Morning fasting reading"
  }'
```

### Get Trends

```bash
curl "http://localhost:4720/api/v1/conditions/{conditionId}/trends?readingType=blood_sugar&period=month"
```

### Get Control Score

```bash
curl "http://localhost:4720/api/v1/control-score/patient-123"
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "stack": "..." // Only in development
  }
}
```

## Logging

The service uses Winston for structured logging:

- Console output with colors in development
- File output (error.log, combined.log) in production
- Includes request context, errors, and timestamps

## Security

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Input Validation**: All inputs validated with Zod
- **Parameterized Queries**: MongoDB injection prevention

## Directory Structure

```
risa-care-chronic-care-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/
│   │   └── chronicCare.ts    # Mongoose models
│   ├── routes/
│   │   └── chronicRoutes.ts  # API routes
│   ├── services/
│   │   ├── chronicCareService.ts
│   │   ├── protocolService.ts
│   │   ├── alertService.ts
│   │   ├── reportingService.ts
│   │   └── schedulerService.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── types/
│   │   └── index.ts          # TypeScript types & Zod schemas
│   └── utils/
│       ├── database.ts
│       ├── logger.ts
│       └── helpers.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

This service is part of the RisaCare ecosystem:

```
RisaCare (4700-4799)
├── risa-care-chronic-care-service (4720) ← You are here
├── risa-care-appointment-service (4710)
├── risa-care-telehealth-service (4711)
├── risa-care-pharmacy-service (4712)
└── ...
```

## License

Proprietary - RTNM Group
