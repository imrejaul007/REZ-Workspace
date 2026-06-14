# HOJAI Integration

**Service:** assetmind-hojai-integration
**Port:** 4540
**Type:** FastAPI / Python

## Overview

Integration with HOJAI AI platform


### Features

- HOJAI memory
- HOJAI agents
- HOJAI voice
- HOJAI intelligence
- Bidirectional sync

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `4540`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HOJAI_API_KEY` | Yes | See description |
| `HOJAI_GATEWAY_URL` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/hojai` | - |

## Health Check

```bash
curl http://localhost:4540/health
```


## Docker

```bash
# Build
docker build -t assetmind-hojai-integration .

# Run
docker run -p 4540:4540 \
  -e APP_ENV=production \
  assetmind-hojai-integration
```


## Architecture

```
assetmind-hojai-integration
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
