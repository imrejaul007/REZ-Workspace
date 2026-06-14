# Data Connectors

**Service:** assetmind-connectors
**Port:** 5010
**Type:** Python

## Overview

External data source connectors


### Features

- Yahoo Finance
- SEC EDGAR
- CoinGecko
- FRED Economic
- News APIs

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5010`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YAHOO_API_KEY` | Yes | See description |
| `SEC_API_KEY` | Yes | See description |
| `COINGECKO_API_KEY` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |

## Health Check

```bash
curl http://localhost:5010/health
```


## Docker

```bash
# Build
docker build -t assetmind-connectors .

# Run
docker run -p 5010:5010 \
  -e APP_ENV=production \
  assetmind-connectors
```


## Architecture

```
assetmind-connectors
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
