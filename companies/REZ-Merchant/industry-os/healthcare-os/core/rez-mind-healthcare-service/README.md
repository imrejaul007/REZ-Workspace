# REZ Mind Healthcare Service

Healthcare Mind AI Service for Smart Recommendations

**Port:** 3008

## Features

- AI-powered symptom analysis
- Risk factor assessment
- Treatment recommendations
- Health risk scoring
- Patient insights
- Appointment reminder optimization
- Health trends analysis
- Comprehensive health reports

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Service info |
| GET | /api/insights/health | Health check |
| POST | /api/insights/analyze-symptoms | Analyze patient symptoms |
| POST | /api/insights/risk-factors | Assess risk factors |
| POST | /api/insights/treatments | Get treatment recommendations |
| POST | /api/insights/risk-score | Calculate health risk score |
| POST | /api/insights/insights | Generate patient insights |
| POST | /api/insights/appointment-reminders | Optimize appointment reminders |
| POST | /api/insights/health-trends | Analyze health trends |
| POST | /api/insights/comprehensive | Generate comprehensive health report |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3008 | Service port |
| HOST | 0.0.0.0 | Service host |
| NODE_ENV | development | Environment (production/development) |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
