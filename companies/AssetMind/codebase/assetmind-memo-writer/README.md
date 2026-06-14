# AI Memo Writer

**Service:** assetmind-memo-writer
**Port:** 5190
**Type:** FastAPI / Python

## Overview

AI-powered investment memo generation


### Features

- Research synthesis
- Professional formatting
- Citation generation
- Multiple templates
- Export options

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5190`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `LLM_API_KEY` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/generate` | - |
| GET/POST/PUT/DELETE | `/api/templates` | - |

## Health Check

```bash
curl http://localhost:5190/health
```


## Docker

```bash
# Build
docker build -t assetmind-memo-writer .

# Run
docker run -p 5190:5190 \
  -e APP_ENV=production \
  assetmind-memo-writer
```


## Architecture

```
assetmind-memo-writer
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
