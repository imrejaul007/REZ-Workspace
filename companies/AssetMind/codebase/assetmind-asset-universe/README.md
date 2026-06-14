# Asset Universe

**Service:** assetmind-asset-universe
**Port:** 5001
**Type:** FastAPI / Python

## Overview

Comprehensive asset database and discovery


### Features

- Asset catalog
- Search and filtering
- Classification
- Metadata management
- Data validation

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5001`

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
| GET/POST/PUT/DELETE | `/api/assets` | - |
| GET/POST/PUT/DELETE | `/api/assets/{id}` | - |
| GET/POST/PUT/DELETE | `/api/search` | - |

## Health Check

```bash
curl http://localhost:5001/health
```


## Docker

```bash
# Build
docker build -t assetmind-asset-universe .

# Run
docker run -p 5001:5001 \
  -e APP_ENV=production \
  assetmind-asset-universe
```


## Architecture

```
assetmind-asset-universe
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
