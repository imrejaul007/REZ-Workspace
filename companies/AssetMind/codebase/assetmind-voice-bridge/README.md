# Voice Bridge

**Service:** assetmind-voice-bridge
**Port:** 4850
**Type:** FastAPI / Python

## Overview

Voice interface for AssetMind


### Features

- Speech recognition
- Voice commands
- Audio responses
- Multi-language
- Voice authentication

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development
- Default port: `4850`

# Start service
python main.py
```


## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VOICE_API_KEY` | Yes | See description |
| `STT_ENGINE` | Yes | See description |


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | - |
| GET/POST/PUT/DELETE | `/api/voice` | - |

## Health Check

```bash
curl http://localhost:4850/health
```


## Docker

```bash
# Build
docker build -t assetmind-voice-bridge .

# Run
docker run -p 4850:4850 \
  -e APP_ENV=production \
  assetmind-voice-bridge
```


## Architecture

```
assetmind-voice-bridge
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
