# Trade Execution

**Service:** assetmind-execution
**Port:** 5161
**Type:** FastAPI / Python

## Overview

Order execution and trade management


### Features

- Order routing
- Smart routing
- Execution algorithms
- Commission optimization
- Trade confirmation

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5161`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BROKER_API_KEY` | Yes | See description |
| `DATABASE_URL` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/execute` | - |
| GET/POST/PUT/DELETE | `/api/orders` | - |

## Health Check

```bash
curl http://localhost:5161/health
```


## Docker

```bash
# Build
docker build -t assetmind-execution .

# Run
docker run -p 5161:5161 \
  -e APP_ENV=production \
  assetmind-execution
```


## Architecture

```
assetmind-execution
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
