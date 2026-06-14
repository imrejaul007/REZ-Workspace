# RL Trading

**Service:** assetmind-rl-trading
**Port:** 5165
**Type:** Python / PyTorch

## Overview

Reinforcement learning trading agent


### Features

- RL agent training
- Policy optimization
- Backtesting
- Live trading
- Performance monitoring

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5165`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `MODEL_PATH` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/train` | - |
| GET/POST/PUT/DELETE | `/api/predict` | - |

## Health Check

```bash
curl http://localhost:5165/health
```


## Docker

```bash
# Build
docker build -t assetmind-rl-trading .

# Run
docker run -p 5165:5165 \
  -e APP_ENV=production \
  assetmind-rl-trading
```


## Architecture

```
assetmind-rl-trading
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
