# REXMind Model

**Service:** assetmind-rexmind-model
**Port:** 5160
**Type:** Python / PyTorch

## Overview

Core ML model for REXMind


### Features

- Transformer architecture
- Financial fine-tuning
- Knowledge distillation
- Model versioning
- A/B testing

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `5160`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MODEL_PATH` | Yes | See description |
| `GPU_DEVICE` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/model/predict` | - |

## Health Check

```bash
curl http://localhost:5160/health
```


## Docker

```bash
# Build
docker build -t assetmind-rexmind-model .

# Run
docker run -p 5160:5160 \
  -e APP_ENV=production \
  assetmind-rexmind-model
```


## Architecture

```
assetmind-rexmind-model
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
