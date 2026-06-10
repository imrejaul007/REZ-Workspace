# PRODFLOW - Manufacturing AI Operating System

> "AI-Driven Production Excellence"

PRODFLOW is an AI-powered operating system for manufacturing plants. It combines AI agents, automated workers, voice agents, and a complete backend to manage manufacturing operations.

## Features

### AI Brain (Advanced Intelligence)

The AI Brain provides advanced manufacturing intelligence with 5 core capabilities:

- **Production Planning** - Intelligent scheduling, resource optimization, bottleneck detection
- **Quality Control Predictions** - Defect prediction, quality scoring, risk assessment
- **Inventory Optimization** - EOQ calculation, reorder optimization, stock analysis
- **Demand Forecasting** - Time series analysis, seasonality detection, trend analysis
- **Equipment Maintenance** - Failure prediction, remaining life estimation, cost estimation

### Production Features

- MongoDB with Mongoose ODM
- JWT Authentication
- Rate Limiting
- Helmet Security Headers
- Winston Structured Logging
- Zod Request Validation
- Health Checks (/health, /health/live, /health/ready)
- Graceful Shutdown
- CORS Protection

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Checks
```bash
GET  /health           # Detailed health check
GET  /health/live       # Liveness probe
GET  /health/ready      # Readiness probe
```

### AI Brain

#### Status & Capabilities
```bash
GET /api/ai/brain/status              # Get AI Brain status and capabilities
```

#### Production Planning
```bash
POST /api/ai/brain/production/plan       # Generate optimized production schedule
GET  /api/ai/brain/production/metrics   # Get real-time production metrics
```

#### Quality Control Predictions
```bash
POST /api/ai/brain/quality/predict         # Predict quality for a product
POST /api/ai/brain/quality/batch-predict  # Batch quality predictions
```

#### Inventory Optimization
```bash
POST /api/ai/brain/inventory/optimize   # Generate inventory optimization
GET  /api/ai/brain/inventory/alerts     # Get urgent inventory alerts
```

#### Demand Forecasting
```bash
POST /api/ai/brain/demand/forecast        # Forecast demand for a product
POST /api/ai/brain/demand/batch-forecast # Batch demand forecasts
```

#### Equipment Maintenance
```bash
POST /api/ai/brain/maintenance/predict   # Predict maintenance needs
GET  /api/ai/brain/maintenance/equipment # List equipment status
```

#### Comprehensive Insights
```bash
GET /api/ai/brain/insights    # Get comprehensive AI insights
GET /api/ai/brain/dashboard   # Get AI dashboard summary
```

## Environment Variables

```bash
# Server
PORT=4817
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/prodflow
MONGODB_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_POOL_SIZE=10

# JWT Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
INTERNAL_SERVICE_TOKEN=your-internal-token
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=10

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
LOGS_DIR=logs
```

## API Examples

### AI Brain - Production Planning
```bash
# Generate optimized production plan
curl -X POST http://localhost:4817/api/ai/brain/production/plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "constraints": {
      "maxUtilization": 85,
      "prioritizeUrgent": true,
      "minimizeSetup": true
    }
  }'

# Get production metrics
curl http://localhost:4817/api/ai/brain/production/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AI Brain - Quality Prediction
```bash
# Predict quality for a product
curl -X POST http://localhost:4817/api/ai/brain/quality/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId": "PRODUCT_ID"}'

# Batch quality predictions
curl -X POST http://localhost:4817/api/ai/brain/quality/batch-predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productIds": ["PRODUCT_ID_1", "PRODUCT_ID_2"]}'
```

### AI Brain - Inventory Optimization
```bash
# Generate inventory optimization
curl -X POST http://localhost:4817/api/ai/brain/inventory/optimize \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get inventory alerts
curl http://localhost:4817/api/ai/brain/inventory/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AI Brain - Demand Forecasting
```bash
# Forecast demand for a product
curl -X POST http://localhost:4817/api/ai/brain/demand/forecast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId": "PRODUCT_ID", "periods": 12}'
```

### AI Brain - Maintenance Prediction
```bash
# Predict maintenance for equipment
curl -X POST http://localhost:4817/api/ai/brain/maintenance/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"equipmentId": "EQ-001"}'

# Get equipment list
curl http://localhost:4817/api/ai/brain/maintenance/equipment \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AI Brain - Insights
```bash
# Get comprehensive insights
curl http://localhost:4817/api/ai/brain/insights \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get AI dashboard
curl http://localhost:4817/api/ai/brain/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Pricing

- **₹9,999/month** (HOJAI AI - Non-REZ clients)
- Included in REZ-Merchant OS (REZ ecosystem clients)

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI
