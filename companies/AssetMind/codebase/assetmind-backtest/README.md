# Backtesting Engine

**Service:** assetmind-backtest
**Port:** 5140
**Type:** FastAPI / Python

## Overview

Historical strategy backtesting platform


### Features

- Strategy backtesting
- Historical data
- Performance metrics
- Risk analysis
- Report generation

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5140`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `HISTORICAL_DATA_URL` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/backtest` | - |
| GET/POST/PUT/DELETE | `/api/results` | - |
| GET/POST/PUT/DELETE | `/api/strategies` | - |

## Health Check

```bash
curl http://localhost:5140/health
```


## Docker

```bash
# Build
docker build -t assetmind-backtest .

# Run
docker run -p 5140:5140 \
  -e APP_ENV=production \
  assetmind-backtest
```


## Architecture

```
assetmind-backtest
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
