# Decision Twin

**Service:** assetmind-decision-twin
**Port:** 5250
**Type:** FastAPI / Python

## Overview

AI-powered investment decision support


### Features

- Decision modeling
- Scenario analysis
- Risk assessment
- Recommendation engine
- Decision logging

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5250`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/decide` | - |
| GET/POST/PUT/DELETE | `/api/scenarios` | - |

## Health Check

```bash
curl http://localhost:5250/health
```


## Docker

```bash
# Build
docker build -t assetmind-decision-twin .

# Run
docker run -p 5250:5250 \
  -e APP_ENV=production \
  assetmind-decision-twin
```


## Architecture

```
assetmind-decision-twin
├── main.py              # Entry point
├── src/                 # Source code
├── tests/               # Test suite
├── requirements.txt      # Dependencies
└── README.md            # This file
```

## Configuration

### Environment Modes

| Mode | Description |
|------|-------------|
| `development` | Local development with debug logging |
| `staging` | Staging environment |
| `production` | Production with optimized settings |

## Monitoring

- Health endpoint: `GET /health`
- Prometheus metrics: `GET /metrics`
- Ready endpoint: `GET /ready`

## Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/ -k "test_name"
```

## See Also

- [Main README](../README.md) - Platform overview
- [Deployment Guide](../DEPLOYMENT.md) - Deployment instructions
- [Monitoring Guide](../MONITORING.md) - Monitoring setup
- [Security Guide](../SECURITY.md) - Security hardening

---

*Part of the AssetMind Financial Intelligence Platform*
