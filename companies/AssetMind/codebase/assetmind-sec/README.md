# SEC EDGAR Connector

**Service:** assetmind-sec
**Port:** 5020
**Type:** FastAPI / Python

## Overview

SEC EDGAR filing integration


### Features

- Filing search
- 10-K/10-Q retrieval
- 8-K event tracking
- Insider trading
- Filing alerts

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5020`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `SEC_API_KEY` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/filings` | - |
| GET/POST/PUT/DELETE | `/api/search` | - |

## Health Check

```bash
curl http://localhost:5020/health
```


## Docker

```bash
# Build
docker build -t assetmind-sec .

# Run
docker run -p 5020:5020 \
  -e APP_ENV=production \
  assetmind-sec
```


## Architecture

```
assetmind-sec
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
