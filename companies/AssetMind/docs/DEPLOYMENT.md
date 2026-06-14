# AssetMind Deployment Guide

**Version:** 1.0  
**Date:** June 5, 2026

---

## Overview

This guide covers deploying AssetMind to various environments:
- Docker (development/staging)
- Kubernetes (production)
- Cloud platforms (AWS, GCP, Azure)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | 2.0+ | Multi-container orchestration |
| kubectl | 1.25+ | Kubernetes CLI |
| helm | 3.10+ | Kubernetes package manager |
| terraform | 1.5+ | Infrastructure as Code |

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Clone repository
git clone https://github.com/assetmind/assetmind.git
cd assetmind/codebase

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Docker Compose Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| postgres | postgres:16 | 5432 | PostgreSQL database |
| timescale | timescale/timescaledb | 5433 | TimescaleDB |
| neo4j | neo4j:5 | 7474, 7687 | Neo4j graph database |
| redis | redis:7-alpine | 6379 | Redis cache |
| api-gateway | assetmind/api-gateway | 5260 | REST API |
| websocket-gateway | assetmind/websocket-gateway | 5261 | WebSocket |
| frontend | assetmind/frontend | 3000 | Next.js app |
| All microservices | assetmind/* | Various | Core services |

### Environment Variables

```bash
# .env file
POSTGRES_USER=assetmind
POSTGRES_PASSWORD=secure-password-here
POSTGRES_DB=assetmind

NEO4J_AUTH=neo4j/neo4j-password-here

REDIS_PASSWORD=redis-password-here

API_KEY=your-api-key-here
```

### Docker Volumes

```yaml
volumes:
  postgres_data:
    driver: local
  neo4j_data:
    driver: local
  redis_data:
    driver: local
```

### Building Custom Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build api-gateway

# Build with no cache
docker-compose build --no-cache
```

### Health Checks

```bash
# Check all health endpoints
curl http://localhost:5260/health
curl http://localhost:5261/health
curl http://localhost:5001/health
```

---

## Kubernetes Deployment

### Cluster Requirements

| Component | Specification |
|-----------|---------------|
| Nodes | 3+ (m5.large or equivalent) |
| CPU | 8+ cores per node |
| Memory | 16+ GB per node |
| Storage | 100+ GB per node |
| Kubernetes | 1.25+ |

### Helm Installation

```bash
# Add Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install AssetMind
helm install assetmind ./k8s/values.yaml --namespace assetmind --create-namespace
```

### Manual Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace assetmind

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check pods
kubectl get pods -n assetmind

# Check services
kubectl get svc -n assetmind
```

### Kubernetes Resources

#### Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: assetmind-api-gateway
spec:
  replicas: 5
  selector:
    matchLabels:
      app: assetmind
      component: api-gateway
  template:
    spec:
      containers:
        - name: api-gateway
          image: assetmind/api-gateway:latest
          ports:
            - containerPort: 5260
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5260
          readinessProbe:
            httpGet:
              path: /health
              port: 5260
```

#### Service Definition

```yaml
apiVersion: v1
kind: Service
metadata:
  name: assetmind-api-gateway
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 5260
  selector:
    app: assetmind
    component: api-gateway
```

#### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: assetmind-api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: assetmind-api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: assetmind-network-policy
spec:
  podSelector:
    matchLabels:
      app: assetmind
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgresql
        - podSelector:
            matchLabels:
              app: redis
        - podSelector:
            matchLabels:
              app: neo4j
```

### Secrets Management

```bash
# Create secrets
kubectl create secret generic assetmind-secrets \
  --from-literal=POSTGRES_PASSWORD=secure-password \
  --from-literal=NEO4J_PASSWORD=neo4j-password \
  --from-literal=REDIS_PASSWORD=redis-password \
  --namespace assetmind

# Or use external secrets operator
kubectl apply -f external-secrets.yaml
```

---

## AWS Deployment

### Infrastructure Setup (Terraform)

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "assetmind" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support = true
}

# EKS Cluster
resource "aws_eks_cluster" "assetmind" {
  name = "assetmind-cluster"
  role_arn = aws_iam_role.cluster.arn
  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "assetmind-postgres"
  engine = "postgres"
  engine_version = "16"
  instance_class = "db.r6g.large"
  allocated_storage = 100
  storage_encrypted = true
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id = "assetmind-redis"
  engine = "redis"
  node_type = "cache.r6g.large"
  num_cache_nodes = 2
}
```

### EKS Deployment

```bash
# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name assetmind-cluster

# Deploy AssetMind
kubectl apply -k k8s/overlays/production

# Scale services
kubectl scale deployment assetmind-api-gateway --replicas=5
```

### AWS Services Used

| Service | Purpose |
|---------|---------|
| EKS | Kubernetes cluster |
| RDS PostgreSQL | Primary database |
| RDS TimescaleDB | Time-series database |
| ElastiCache Redis | Caching |
| Neo4j Aura | Graph database |
| ALB | Load balancer |
| CloudWatch | Logging and monitoring |
| S3 | Object storage |
| ACM | SSL certificates |

---

## GCP Deployment

### Infrastructure Setup (Terraform)

```hcl
# main.tf
provider "google" {
  project = "assetmind-production"
  region = "us-central1"
}

# GKE Cluster
resource "google_container_cluster" "assetmind" {
  name = "assetmind-cluster"
  location = "us-central1"
  initial_node_count = 3
  node_config {
    machine_type = "e2-standard-4"
  }
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name = "assetmind-postgres"
  database_version = "POSTGRES_16"
  tier = "db-n1-standard-4"
}

# Memorystore Redis
resource "google_redis_instance" "redis" {
  name = "assetmind-redis"
  tier = "STANDARD_HA"
  memory_size_gb = 13
}
```

### GKE Deployment

```bash
# Get credentials
gcloud container clusters get-credentials assetmind-cluster --region us-central1

# Deploy
kubectl apply -f k8s/deployment.yaml

# Enable auto-scaling
kubectl autoscale deployment assetmind-api-gateway --cpu-percent=70 --min=3 --max=20
```

### GCP Services Used

| Service | Purpose |
|---------|---------|
| GKE | Kubernetes cluster |
| Cloud SQL | PostgreSQL + TimescaleDB |
| Memorystore | Redis |
| Neo4j Enterprise | Graph database |
| Cloud Load Balancing | Load balancer |
| Cloud Logging | Logging |
| Cloud Monitoring | Monitoring |
| Cloud Storage | Object storage |
| Cloud CDN | CDN |

---

## Azure Deployment

### Infrastructure Setup (Terraform)

```hcl
# main.tf
provider "azurerm" {
  features {}
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "assetmind" {
  name = "assetmind-cluster"
  location = "eastus"
  sku_tier = "Standard"
  default_node_pool {
    name = "default"
    node_count = 3
    vm_size = "Standard_D4s_v3"
  }
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_flexible_server" "postgres" {
  name = "assetmind-postgres"
  location = "eastus"
  sku_name = "Standard_D4s_v3"
  storage_mb = 102400
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "redis" {
  name = "assetmind-redis"
  location = "eastus"
  sku_name = "Standard"
  family = "C"
  capacity = 2
}
```

### AKS Deployment

```bash
# Get credentials
az aks get-credentials --resource-group assetmind-rg --name assetmind-cluster

# Deploy
kubectl apply -f k8s/deployment.yaml

# Monitor
kubectl top nodes
kubectl top pods
```

### Azure Services Used

| Service | Purpose |
|---------|---------|
| AKS | Kubernetes cluster |
| Azure Database for PostgreSQL | Primary database |
| Azure Cache for Redis | Redis caching |
| Neo4j Enterprise | Graph database |
| Azure Load Balancer | Load balancing |
| Azure Monitor | Monitoring |
| Application Insights | APM |
| Azure Blob Storage | Object storage |

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build images
        run: docker-compose build

      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push $ECR_REGISTRY/assetmind:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --region $AWS_REGION --name assetmind-cluster
          kubectl apply -k k8s/overlays/production
```

### ArgoCD Setup

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: assetmind
spec:
  project: default
  source:
    repoURL: https://github.com/assetmind/assetmind
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: assetmind
```

---

## Monitoring & Observability

### Prometheus Metrics

```yaml
# Prometheus configuration
scrape_configs:
  - job_name: 'assetmind'
    static_configs:
      - targets: ['api-gateway:5260']
    metrics_path: /metrics
```

### Grafana Dashboards

```bash
# Import dashboard
kubectl create configmap assetmind-grafana-dashboard \
  --from-file=dashboards/assetmind.json

# Key metrics to monitor:
# - Request rate
# - Error rate
# - Latency (p50, p95, p99)
# - Active connections
# - Database connections
```

### Alerting Rules

```yaml
# alerting rules
groups:
  - name: assetmind
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
```

---

## Backup & Recovery

### PostgreSQL Backup

```bash
# Automated backup
pg_dump -Fc assetmind -h postgres.assetmind.internal -U assetmind > backup_$(date +%Y%m%d).dump

# Point-in-time recovery
pg_restore -d assetmind --target-date '2026-06-05 12:00:00' backup.dump
```

### Neo4j Backup

```bash
# Online backup
neo4j-admin backup --backup-dir=/backups --database=neo4j

# Restore
neo4j-admin restore --from=/backups/neo4j --database=neo4j
```

### S3 Backup (AWS)

```bash
# Configure backup cron
0 2 * * * pg_dump -Fc assetmind | aws s3 cp - s3://assetmind-backups/postgres/$(date +\%Y\%m\%d).dump
```

---

## Security Checklist

- [ ] Enable TLS 1.3 on all endpoints
- [ ] Rotate secrets every 90 days
- [ ] Enable VPC isolation
- [ ] Configure WAF rules
- [ ] Enable audit logging
- [ ] Implement rate limiting
- [ ] Enable database encryption at rest
- [ ] Configure network policies
- [ ] Use managed identity where possible
- [ ] Regular security audits

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Pods stuck in Pending | Check resource quotas |
| Pods crashing | Check logs, adjust memory limits |
| High latency | Scale horizontally, check DB connections |
| Connection timeouts | Check network policies, security groups |

### Debug Commands

```bash
# Check pod logs
kubectl logs -f deployment/api-gateway -n assetmind

# Describe pod
kubectl describe pod <pod-name> -n assetmind

# Execute into container
kubectl exec -it <pod-name> -n assetmind -- /bin/bash

# Check resource usage
kubectl top pods -n assetmind

# Check events
kubectl get events -n assetmind --sort-by=.lastTimestamp
```

---

## Support

- Documentation: https://docs.assetmind.ai
- GitHub Issues: https://github.com/assetmind/assetmind/issues
- Email: support@assetmind.ai