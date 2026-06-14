# Event Operating System

**Service:** assetmind-event-os
**Port:** 5052
**Type:** FastAPI / Python

## Overview

Event-driven architecture platform


### Features

- Event streaming
- Event processing
- Real-time analytics
- Event storage
- Event replay

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5052`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KAFKA_BROKERS` | Yes | See description |
| `DATABASE_URL` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/events` | - |
| GET/POST/PUT/DELETE | `/api/streams` | - |

## Health Check

```bash
curl http://localhost:5052/health
```


## Docker

```bash
# Build
docker build -t assetmind-event-os .

# Run
docker run -p 5052:5052 \
  -e APP_ENV=production \
  assetmind-event-os
```


## Architecture

```
assetmind-event-os
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
