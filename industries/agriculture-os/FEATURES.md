# Agriculture OS - Features

**Status:** ✅ BUILT | **Port:** 5070 | **Updated:** June 14, 2026

---

## Digital Twins

### Farm Twin
- Land management
- Plot mapping
- Ownership records
- Lease tracking
- Crop rotation history

### Crop Twin
- Growth stage tracking
- Yield prediction
- Health monitoring
- Harvest scheduling
- Quality grading

### Livestock Twin
- Animal identification
- Health records
- Breeding management
- Weight tracking
- Movement history

### Weather Twin
- Real-time weather data
- Forecast integration
- Alert system
- Historical analysis
- Microclimate data

### Soil Twin
- Nutrient levels
- Moisture content
- pH tracking
- Amendment records
- Soil type mapping

---

## AI Agents

### YieldPredict Agent
- Harvest forecasting
- Crop yield analysis
- Historical comparison
- Risk assessment

### IrrigationSched Agent
- Water requirement calculation
- Schedule optimization
- Drought response
- Resource allocation

### PestDetect Agent
- Disease identification
- Pest detection
- Treatment recommendations
- Alert system

### MarketAdv Agent
- Price analysis
- Market timing
- Contract recommendations
- Trend prediction

### EquipmentMon Agent
- Machinery tracking
- Maintenance alerts
- Fuel consumption
- Utilization reports

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Farms
- `POST /api/farms` - Add farm
- `GET /api/farms/:id` - Get farm
- `GET /api/farms/:id/plots` - Farm plots

### Crops
- `POST /api/crops` - Add crop
- `GET /api/crops/:id` - Get crop
- `PUT /api/crops/:id/growth` - Update growth stage
- `GET /api/crops/:id/yield` - Yield prediction

### Livestock
- `POST /api/livestock` - Add animal
- `GET /api/livestock/:id` - Get animal
- `PUT /api/livestock/:id/health` - Update health

### Weather
- `GET /api/weather/current` - Current weather
- `GET /api/weather/forecast` - Forecast
- `GET /api/weather/alerts` - Active alerts

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Weather API | External | Weather data |
| Market Data | External | Prices |

---

## Quick Start

```bash
cd industries/agriculture-os
npm install
node src/index.js
# Runs on http://localhost:5070
```