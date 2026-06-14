# Financial Council

**Service:** assetmind-council
**Port:** 5195
**Type:** FastAPI / Python

## Overview

Multi-agent AI council for investment decisions


### Features

- Multi-agent deliberation
- Consensus building
- Argument synthesis
- Decision logging
- Bias detection

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5195`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `AGENT_COUNT` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/council/{question}` | - |

## Health Check

```bash
curl http://localhost:5195/health
```


## Docker

```bash
# Build
docker build -t assetmind-council .

# Run
docker run -p 5195:5195 \
  -e APP_ENV=production \
  assetmind-council
```


## Architecture

```
assetmind-council
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
