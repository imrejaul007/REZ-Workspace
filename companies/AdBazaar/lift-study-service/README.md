# Lift Study Service

**Port:** 4972

AdBazaar's Lift Study Service provides brand lift and conversion lift measurement capabilities for advertising campaigns. It enables advertisers to measure the incremental impact of their campaigns on brand metrics and business outcomes.

## Features

- **Brand Lift Measurement:** Measure awareness, consideration, intent, and ad recall lift
- **Conversion Lift Measurement:** Track conversion rates, revenue, and engagement metrics
- **Statistical Analysis:** Z-tests, confidence intervals, and p-values
- **Survey Management:** Create and manage brand lift surveys
- **Recommendations Engine:** AI-powered recommendations based on results
- **Multi-Study Support:** Track multiple lift studies simultaneously

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lift Study Service                           │
│                        (Port 4972)                              │
├─────────────────────────────────────────────────────────────────┤
│  Routes Layer                                                    │
│  ├── /api/studies - Study management                           │
│  ├── /api/surveys - Survey management                          │
│  └── /api/analysis - Analysis and results                       │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                  │
│  ├── StudyService - Study CRUD operations                       │
│  ├── BrandLiftService - Brand lift calculations                 │
│  ├── ConversionLiftService - Conversion metrics                  │
│  ├── SurveyService - Survey management                          │
│  └── AnalysisService - Statistical analysis                    │
├─────────────────────────────────────────────────────────────────┤
│  Models Layer                                                    │
│  ├── LiftStudy - Study metadata                                 │
│  ├── BrandLift - Brand survey responses                         │
│  ├── ConversionLift - Conversion data                           │
│  ├── Survey - Survey definitions                                │
│  ├── SurveyResponse - Survey responses                          │
│  └── LiftResult - Analysis results                             │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                  │
│  ├── MongoDB - Primary database                                 │
│  └── Redis - Caching layer (optional)                          │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Studies

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/studies` | Create lift study |
| GET | `/api/studies` | List all studies |
| GET | `/api/studies/:id` | Get study by ID |
| PUT | `/api/studies/:id` | Update study |
| DELETE | `/api/studies/:id` | Delete study |
| POST | `/api/studies/:id/start` | Start study |
| POST | `/api/studies/:id/pause` | Pause study |

### Brand Lift

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/studies/:id/brand-lift` | Submit brand lift survey |
| GET | `/api/studies/:id/brand-lift` | Get brand lift results |
| GET | `/api/studies/:id/brand-lift/responses` | Get survey responses |

### Conversion Lift

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/studies/:id/conversion-lift` | Record conversion data |
| POST | `/api/studies/:id/conversion-lift/batch` | Batch record conversions |
| GET | `/api/studies/:id/conversion-lift` | Get conversion lift results |

### Surveys

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/surveys` | Create survey |
| GET | `/api/surveys` | List surveys |
| GET | `/api/surveys/:id` | Get survey |
| POST | `/api/surveys/:id/activate` | Activate survey |
| POST | `/api/surveys/:id/complete` | Complete survey |
| POST | `/api/surveys/:id/responses` | Submit response |
| GET | `/api/surveys/:id/responses` | Get responses |
| GET | `/api/surveys/:id/stats` | Get response stats |

### Analysis

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/analysis/studies/:id/analyze` | Run analysis |
| GET | `/api/analysis/studies/:id/results` | Get results |
| GET | `/api/analysis/studies/:id/recommendations` | Get recommendations |
| POST | `/api/analysis/compare` | Compare studies |

### Health & Metrics

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/live` | Liveness check |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis (optional)

### Installation

```bash
cd lift-study-service
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4972
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lift_study_service
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-secret-token
API_KEY=your-api-key
LOG_LEVEL=info
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Example Usage

### Create a Lift Study

```bash
curl -X POST http://localhost:4972/api/studies \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "name": "Q1 Brand Lift Study",
    "type": "brand_lift",
    "methodology": "randomized_control",
    "confidenceLevel": 0.95,
    "controlGroupSize": 0.1,
    "treatmentGroupSize": 0.9,
    "metrics": ["awareness", "consideration", "intent", "ad_recall"],
    "targetAudience": {
      "demographics": {
        "age": [25, 34],
        "location": ["Mumbai", "Delhi"]
      }
    }
  }'
```

### Submit Brand Lift Survey

```bash
curl -X POST http://localhost:4972/api/studies/{studyId}/brand-lift \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "respondentId": "resp_12345",
    "treatmentGroup": true,
    "surveyType": "post",
    "responses": {
      "awareness": { "aided": true, "score": 85 },
      "consideration": 75,
      "intent": 80,
      "adRecall": { "exact": true },
      "recommendationLikelihood": 8
    },
    "demographics": {
      "age": 28,
      "gender": "male",
      "location": "Mumbai"
    }
  }'
```

### Record Conversion Data

```bash
curl -X POST http://localhost:4972/api/studies/{studyId}/conversion-lift \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "treatmentGroup": true,
    "userId": "user_789",
    "metrics": {
      "conversions": 1,
      "revenue": 299.99,
      "visits": 5,
      "pageViews": 12,
      "addToCart": 2,
      "purchases": 1
    }
  }'
```

### Run Analysis

```bash
curl -X POST http://localhost:4972/api/analysis/studies/{studyId}/analyze \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "type": "both",
    "confidenceLevel": 0.95
  }'
```

### Get Results

```bash
curl http://localhost:4972/api/analysis/studies/{studyId}/results \
  -H "X-Internal-Token: your-secret-token"
```

## Data Models

### LiftStudy

| Field | Type | Description |
|-------|------|-------------|
| name | string | Study name |
| type | enum | brand_lift, conversion_lift, both |
| status | enum | draft, active, paused, completed, cancelled |
| methodology | enum | randomized_control, geo_targeting, matched_market, holdout |
| confidenceLevel | number | Statistical confidence level (0.8-0.99) |
| controlGroupSize | number | Control group percentage |
| treatmentGroupSize | number | Treatment group percentage |
| metrics | string[] | Metrics to track |
| targetAudience | object | Targeting criteria |

### BrandLift

| Field | Type | Description |
|-------|------|-------------|
| studyId | ObjectId | Reference to LiftStudy |
| surveyType | enum | pre, post, both |
| treatmentGroup | boolean | Treatment or control group |
| respondentId | string | Unique respondent identifier |
| responses | object | Survey responses |

### ConversionLift

| Field | Type | Description |
|-------|------|-------------|
| studyId | ObjectId | Reference to LiftStudy |
| treatmentGroup | boolean | Treatment or control group |
| userId | string | User identifier |
| metrics | object | Conversion metrics |

### LiftResult

| Field | Type | Description |
|-------|------|-------------|
| studyId | ObjectId | Reference to LiftStudy |
| type | enum | brand_lift, conversion_lift, both |
| overallLift | number | Overall lift percentage |
| confidence | number | Statistical confidence |
| pValue | number | P-value for significance |
| statisticalSignificance | boolean | Whether result is significant |
| sampleSize | object | Treatment/control sample sizes |
| metricResults | array | Per-metric lift results |
| recommendations | array | Actionable recommendations |

## Statistical Methods

### Z-Test for Proportions

Used for calculating statistical significance of lift results:

```
z = (p1 - p2) / sqrt(p(1-p)(1/n1 + 1/n2))
```

Where:
- p1 = treatment proportion
- p2 = control proportion
- p = pooled proportion
- n1, n2 = sample sizes

### Confidence Intervals

95% confidence intervals calculated using:

```
lift ± 1.96 * SE
```

### Minimum Detectable Effect (MDE)

Sample size calculation based on:

```
n = 2 * (Z_alpha + Z_beta)^2 * p * (1-p) / MDE^2
```

## Integration

### Internal Services

The service authenticates internal calls using:
- `X-Internal-Token` header for service-to-service calls
- `X-Service-Id` header to identify calling service
- `X-Service-Name` header for service name

### Redis Caching

Optional Redis caching for:
- Study metadata
- Analysis results
- Survey responses

### Event Publishing

Publishes events for:
- Study status changes
- Analysis completion
- Recommendation generation

## Monitoring

### Prometheus Metrics

- `lift_study_http_request_duration_seconds` - Request latency
- `lift_study_http_requests_total` - Request count
- `lift_study_studies_created_total` - Studies created
- `lift_study_studies_completed_total` - Studies completed
- `lift_study_brand_lift_calculations_total` - Brand lift calculations
- `lift_study_conversion_lift_calculations_total` - Conversion lift calculations
- `lift_study_survey_responses_total` - Survey responses
- `lift_study_active_studies` - Active studies gauge
- `lift_study_analysis_duration_seconds` - Analysis duration

### Health Checks

- `/health` - Full health check with all dependencies
- `/ready` - Kubernetes readiness probe
- `/live` - Kubernetes liveness probe

## Error Handling

All errors return consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

## License

Proprietary - AdBazaar Internal Use Only