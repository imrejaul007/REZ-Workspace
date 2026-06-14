# Knowledge Graph

**Service:** assetmind-knowledge-graph
**Port:** 5040
**Type:** FastAPI / Python

## Overview

Neo4j-based financial knowledge graph


### Features

- Entity relationships
- Graph queries
- Path analysis
- Entity resolution
- Knowledge inference

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5040`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Yes | See description |
| `NEO4J_USER` | Yes | See description |
| `NEO4J_PASSWORD` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/graph` | - |
| GET/POST/PUT/DELETE | `/api/search` | - |

## Health Check

```bash
curl http://localhost:5040/health
```


## Docker

```bash
# Build
docker build -t assetmind-knowledge-graph .

# Run
docker run -p 5040:5040 \
  -e APP_ENV=production \
  assetmind-knowledge-graph
```


## Architecture

```
assetmind-knowledge-graph
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
