# API Documentation

**Service:** assetmind-swagger
**Port:** 5260
**Type:** Swagger UI

## Overview

Interactive API documentation


### Features

- Swagger UI
- OpenAPI 3.0 spec
- Try it out
- Code samples
- Authentication

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5260`

# Start service
python main.py
```



## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | - |
| GET | `/openapi.json` | - |

## Health Check

```bash
curl http://localhost:5260/health
```


## Docker

```bash
# Build
docker build -t assetmind-swagger .

# Run
docker run -p 5260:5260 \
  -e APP_ENV=production \
  assetmind-swagger
```


## Architecture

```
assetmind-swagger
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
