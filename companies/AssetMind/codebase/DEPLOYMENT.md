# AssetMind Deployment Guide

**Version:** 1.0.0  
**Date:** June 12, 2026

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Compose](#docker-compose)
3. [Kubernetes](#kubernetes)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes 1.24+ (for K8s deployment)
- 16GB RAM minimum
- 100GB disk space

### Run with Docker Compose

```bash
# Clone and navigate
cd /Users/rejaulkarim/Documents/RTMN/companies/AssetMind/codebase

# Copy environment file
cp .env.example .env
# Edit .env with your production values

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Docker Compose

### Core Services Only (Minimal)

```bash
# Start core tier only
docker-compose up -d postgres redis neo4j asset-universe asset-twin api-gateway
```

### Full Platform

```bash
# Start everything
docker-compose --profile full up -d
```

### Services by Tier

```bash
# Core Tier (5001-5006)
docker-compose up -d asset-universe asset-twin market-twin portfolio-twin investor-twin intelligence-twin

# Data Tier (5010-5023)
docker-compose up -d market-data news-service social-service macro-data crypto-data sec-data

# Intelligence Tier (5050-5060)
docker-compose up -d financial-intelligence sentiment-intelligence risk-intelligence

# Agent Tier (5090-5112)
docker-compose up -d agent-orchestrator portfolio-agent risk-agent

# Gateway
docker-compose up -d api-gateway frontend

# Databases
docker-compose up -d postgres redis neo4j
```

---

## Kubernetes

### Prerequisites

```bash
# Install kubectl
brew install kubectl

# Install helm
brew install helm

# Install ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true
```

### Deploy Full Platform

```bash
cd k8s

# Create namespace
kubectl create namespace assetmind

# Apply all manifests
kubectl apply -f assetmind-hub.yaml -n assetmind
kubectl apply -f services/ -n assetmind

# Check deployment
kubectl get pods -n assetmind

# View logs
kubectl logs -n assetmind -l app=assetmind -f
```

### Scaling

```bash
# Scale API Gateway
kubectl scale deployment assetmind-api-gateway --replicas=5 -n assetmind

# Scale AI services (with GPU)
kubectl scale deployment assetmind-rexmind --replicas=3 -n assetmind
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env file
cat > .env << 'EOF'
# =============================================================================
# SECURITY - CRITICAL
# =============================================================================
ASSETMIND_SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-base64-32

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_USER=assetmind
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=assetmind
DATABASE_URL=postgresql://assetmind:your-db-password@postgres:5432/assetmind

# =============================================================================
# REDIS
# =============================================================================
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:your-redis-password@redis:6379

# =============================================================================
# NEO4J
# =============================================================================
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
NEO4J_URI=bolt://neo4j:7687

# =============================================================================
# EXTERNAL APIS
# =============================================================================
FRED_API_KEY=your-fred-api-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
COINGECKO_API_KEY=your-coingecko-key
SEC_API_KEY=your-sec-api-key

# =============================================================================
# HOJAI INTEGRATION
# =============================================================================
HOJAI_GATEWAY=http://hojai-gateway:4500
HOJAI_MEMORY=http://hojai-memory:4540
HOJAI_MEMORY_API_KEY=your-hojai-api-key

# =============================================================================
# RABTUL INTEGRATION
# =============================================================================
RABTUL_AUTH_URL=https://auth.rabtul.com
RABTUL_WALLET_URL=https://wallet.rabtul.com
RABTUL_PAYMENT_URL=https://pay.rabtul.com
RABTUL_API_KEY=your-rabtul-api-key

# =============================================================================
# APPLICATION
# =============================================================================
APP_ENV=production
LOG_LEVEL=INFO
DEBUG=false
CORS_ORIGINS=https://app.assetmind.ai,https://dashboard.assetmind.ai

# =============================================================================
# PRODUCTION
# =============================================================================
DOMAIN=assetmind.ai
HTTPS_ENABLED=true
EOF
```

---

## Monitoring Setup

### Prometheus

```bash
# Add Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/prometheus -n monitoring --create-namespace

# Check Prometheus
kubectl get pods -n monitoring
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
```

### Grafana

```bash
# Install Grafana
helm install grafana prometheus-community/grafana -n monitoring \
  --set adminPassword='your-grafana-password' \
  --set persistence.enabled=true

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80
```

### Dashboard Import

Import dashboard from: `k8s/dashboards/assetmind-dashboard.json`

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker-compose build
      
      - name: Push to registry
        run: |
          docker-compose push
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/assetmind-api-gateway

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests
        run: docker-compose run --rm pytest
      
      - name: Security scan
        run: |
          docker run --rm -v $(pwd):/src aquasec/trivy fs /src
```

---

## Health Checks

### Check All Services

```bash
#!/bin/bash
for service in api-gateway asset-universe asset-twin market-twin portfolio-twin investor-twin intelligence-twin; do
  echo "Checking $service..."
  curl -s http://localhost:5260/health | jq . || echo "$service FAILED"
done
```

### Kubernetes Health

```bash
# All pods healthy?
kubectl get pods -n assetmind | grep -v Running

# Service endpoints?
kubectl get endpoints -n assetmind

# Ingress working?
kubectl describe ingress assetmind-ingress -n assetmind
```

---

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n assetmind
kubectl logs <pod-name> -n assetmind
```

**Database connection issues:**
```bash
kubectl exec -it postgres-0 -n assetmind -- psql -U assetmind
```

**Pod memory/CPU issues:**
```bash
kubectl top pods -n assetmind
```

**Network issues:**
```bash
kubectl exec -it assetmind-api-gateway-xxx -n assetmind -- curl http://asset-twin:5002/health
```

---

## Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set all required secrets (no defaults)
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for databases
- [ ] Set up log aggregation
- [ ] Configure autoscaling
- [ ] Test disaster recovery
- [ ] Security scan all images
- [ ] Performance testing

---

*Generated by Claude Code*  
*Last updated: June 12, 2026*
