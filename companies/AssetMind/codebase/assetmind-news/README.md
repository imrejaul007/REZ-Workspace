# News Service

**Service:** assetmind-news
**Port:** 5012
**Type:** FastAPI / Python

## Overview

Financial news aggregation and analysis


### Features

- News aggregation
- Sentiment analysis
- Relevance scoring
- Category filtering
- Breaking news alerts

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5012`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | See description |
| `NEWS_API_KEY` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/news` | - |
| GET/POST/PUT/DELETE | `/api/sentiment/{symbol}` | - |

## Health Check

```bash
curl http://localhost:5012/health
```


## Docker

```bash
# Build
docker build -t assetmind-news .

# Run
docker run -p 5012:5012 \
  -e APP_ENV=production \
  assetmind-news
```


## Architecture

```
assetmind-news
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
