# RestoPapa API Deployment Guide

This guide covers deploying the RestoPapa API to various environments including staging and production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- Network: 1Gbps

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Network: 10Gbps
- Load Balancer

### Software Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git docker.io docker-compose nginx postgresql-client redis-tools

# CentOS/RHEL
sudo yum update
sudo yum install -y curl wget git docker docker-compose nginx postgresql redis

# macOS
brew install docker docker-compose nginx postgresql redis
```

### Domain & SSL Setup

1. **Domain Configuration:**
```bash
# Example DNS records
api.restopapa.com     A       1.2.3.4
staging-api.restopapa.com A   1.2.3.5
```

2. **SSL Certificate:**
```bash
# Using Let's Encrypt
sudo certbot certonly --nginx -d api.restopapa.com

# Or use existing certificate
cp your-cert.pem /etc/nginx/ssl/cert.pem
cp your-key.pem /etc/nginx/ssl/key.pem
```

## 🌍 Environment Setup

### Environment Variables

Create environment-specific files:

**`.env.production`:**
```bash
# Application
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0
API_PREFIX=api/v1
FRONTEND_URL=https://restopapa.com

# Database
DATABASE_URL="postgresql://prod_user:secure_pass@db.internal:5432/restopapa_prod?schema=public"
DATABASE_URL_PROD="postgresql://prod_user:secure_pass@db.internal:5432/restopapa_prod?schema=public"

# Redis
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_pass
REDIS_URL=redis://:secure_redis_pass@redis.internal:6379/0

# Security
JWT_SECRET=production-jwt-secret-256-chars-long
JWT_REFRESH_SECRET=production-refresh-secret-256-chars-long
BCRYPT_ROUNDS=12
CSRF_SECRET=production-csrf-secret
API_KEY_SECRET=production-api-key-secret

# Rate Limiting
RATE_LIMIT_MAX=1000
ENABLE_RATE_LIMITING=true
ENABLE_CSRF_PROTECTION=true

# Email (Production)
SENDGRID_API_KEY=REDACTED
EMAIL_FROM="RestoPapa <noreply@restopapa.com>"

# File Storage (Production)
CLOUDINARY_CLOUD_NAME=your-prod-cloud-name
CLOUDINARY_API_KEY=your-prod-api-key
CLOUDINARY_API_SECRET=your-prod-api-secret

# Payment Gateways (Live keys)
STRIPE_SECRET_KEY=sk_live_your-live-stripe-key
RAZORPAY_KEY_ID=rzp_live_your-live-key
RAZORPAY_KEY_SECRET=your-live-razorpay-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
ENABLE_SWAGGER=false

# Backup
BACKUP_S3_BUCKET=restopapa-backups-prod
NOTIFICATION_EMAIL=ops@restopapa.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
```

**`.env.staging`:**
```bash
# Copy from production and modify:
NODE_ENV=staging
FRONTEND_URL=https://staging.restopapa.com
DATABASE_URL="postgresql://staging_user:pass@staging-db:5432/restopapa_staging?schema=public"
# Use test/sandbox keys for payments
STRIPE_SECRET_KEY=sk_test_your-test-stripe-key
ENABLE_SWAGGER=true
LOG_LEVEL=debug
```

### Configuration Validation

```bash
# Validate environment configuration
./scripts/validate-config.sh production
./scripts/validate-config.sh staging
```

## 🐳 Docker Deployment

### Single Server Deployment

**1. Production Docker Compose:**

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  # Production API
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production-pm2
    container_name: restopapa-api-prod
    restart: unless-stopped
    ports:
      - '3000:3000'
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    networks:
      - restopapa-prod
    volumes:
      - ./logs:/app/logs
      - app-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: restopapa-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: restopapa_prod
      POSTGRES_USER: prod_user
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - '127.0.0.1:5432:5432'  # Bind to localhost only
    volumes:
      - postgres-data-prod:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - restopapa-prod
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=4MB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prod_user -d restopapa_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: restopapa-redis-prod
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
      --appendfsync everysec
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
    ports:
      - '127.0.0.1:6379:6379'  # Bind to localhost only
    volumes:
      - redis-data-prod:/data
    networks:
      - restopapa-prod
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: restopapa-nginx-prod
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
      - app-uploads:/var/www/uploads:ro
    depends_on:
      - api
    networks:
      - restopapa-prod

  # Monitoring (optional)
  prometheus:
    image: prom/prometheus:latest
    container_name: restopapa-prometheus-prod
    restart: unless-stopped
    ports:
      - '127.0.0.1:9090:9090'  # Internal only
    volumes:
      - ./monitoring/prometheus.prod.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data-prod:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=90d'
      - '--web.enable-lifecycle'
    networks:
      - restopapa-prod

  # Log Management
  loki:
    image: grafana/loki:latest
    container_name: restopapa-loki-prod
    restart: unless-stopped
    ports:
      - '127.0.0.1:3100:3100'
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml
      - loki-data-prod:/loki
    networks:
      - restopapa-prod

networks:
  restopapa-prod:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres-data-prod:
    driver: local
  redis-data-prod:
    driver: local
  prometheus-data-prod:
    driver: local
  loki-data-prod:
    driver: local
  app-uploads:
    driver: local
```

**2. Deploy to Production:**

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Check deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f api

# Run health check
curl -f http://localhost:3000/health
```

**3. Database Migration:**

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec api npm run db:migrate:deploy

# Verify database
docker-compose -f docker-compose.prod.yml exec api npm run db:status
```

### Multi-Server Deployment

For high availability, deploy across multiple servers:

**Server 1 (API + Load Balancer):**
```bash
# docker-compose.api.yml
services:
  api:
    # API configuration
  nginx:
    # Load balancer configuration
```

**Server 2 (Database):**
```bash
# docker-compose.db.yml
services:
  postgres:
    # Database configuration
  redis:
    # Cache configuration
```

## ☸️ Kubernetes Deployment

### Basic Kubernetes Configuration

**1. Namespace:**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: restopapa-prod
---
apiVersion: v1
kind: Namespace
metadata:
  name: restopapa-staging
```

**2. Secrets:**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: restopapa-secrets
  namespace: restopapa-prod
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/restopapa_prod"
  JWT_SECRET: "your-jwt-secret"
  REDIS_PASSWORD: "your-redis-password"
  # Add all sensitive environment variables
```

**3. ConfigMap:**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restopapa-config
  namespace: restopapa-prod
data:
  NODE_ENV: "production"
  API_PORT: "3000"
  LOG_LEVEL: "info"
  # Add non-sensitive environment variables
```

**4. Deployment:**
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: restopapa-api
  namespace: restopapa-prod
  labels:
    app: restopapa-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: restopapa-api
  template:
    metadata:
      labels:
        app: restopapa-api
    spec:
      containers:
      - name: api
        image: your-registry/restopapa-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: restopapa-secrets
              key: DATABASE_URL
        envFrom:
        - configMapRef:
            name: restopapa-config
        - secretRef:
            name: restopapa-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: logs-pvc
```

**5. Service:**
```yaml
# k8s/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: restopapa-api-service
  namespace: restopapa-prod
spec:
  selector:
    app: restopapa-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**6. Ingress:**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: restopapa-ingress
  namespace: restopapa-prod
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.restopapa.com
    secretName: restopapa-tls
  rules:
  - host: api.restopapa.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: restopapa-api-service
            port:
              number: 80
```

**7. Deploy to Kubernetes:**

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n restopapa-prod
kubectl get services -n restopapa-prod
kubectl get ingress -n restopapa-prod

# Check logs
kubectl logs -f deployment/restopapa-api -n restopapa-prod

# Scale deployment
kubectl scale deployment/restopapa-api --replicas=5 -n restopapa-prod
```

## ☁️ Cloud Deployment

### AWS Deployment

**1. ECS with Fargate:**

Create `task-definition.json`:
```json
{
  "family": "restopapa-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "restopapa-api",
      "image": "your-ecr-repo/restopapa-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "API_PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/restopapa-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

Deploy with AWS CLI:
```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster production-cluster \
  --service-name restopapa-api \
  --task-definition restopapa-api:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**2. Application Load Balancer:**
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name restopapa-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target group
aws elbv2 create-target-group \
  --name restopapa-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health
```

### Google Cloud Platform

**1. Cloud Run Deployment:**
```bash
# Build and push to GCR
docker build -t gcr.io/PROJECT-ID/restopapa-api .
docker push gcr.io/PROJECT-ID/restopapa-api

# Deploy to Cloud Run
gcloud run deploy restopapa-api \
  --image gcr.io/PROJECT-ID/restopapa-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --concurrency 100
```

**2. Cloud SQL & Redis:**
```bash
# Create Cloud SQL instance
gcloud sql instances create restopapa-db \
  --database-version POSTGRES_13 \
  --tier db-n1-standard-2 \
  --region us-central1 \
  --storage-size 100GB \
  --storage-type SSD

# Create Redis instance
gcloud redis instances create restopapa-cache \
  --size 4 \
  --region us-central1 \
  --redis-version redis_6_x
```

### Azure Deployment

**1. Container Instances:**
```bash
# Create resource group
az group create --name restopapa-prod --location eastus

# Create container instance
az container create \
  --resource-group restopapa-prod \
  --name restopapa-api \
  --image your-registry/restopapa-api:latest \
  --cpu 2 \
  --memory 4 \
  --restart-policy Always \
  --ports 3000 \
  --environment-variables NODE_ENV=production API_PORT=3000 \
  --secure-environment-variables DATABASE_URL=$DATABASE_URL
```

**2. PostgreSQL & Redis:**
```bash
# Create PostgreSQL
az postgres flexible-server create \
  --resource-group restopapa-prod \
  --name restopapa-db \
  --admin-user dbadmin \
  --admin-password SecurePassword123! \
  --sku-name Standard_D2s_v3 \
  --storage-size 128 \
  --version 13

# Create Redis
az redis create \
  --resource-group restopapa-prod \
  --name restopapa-cache \
  --location eastus \
  --sku Standard \
  --vm-size C1
```

## 📊 Monitoring & Logging

### Production Monitoring Stack

**1. Prometheus Configuration:**
```yaml
# monitoring/prometheus.prod.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'restopapa-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/monitoring/metrics'
    scrape_interval: 30s

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "alerts/*.yml"
```

**2. Grafana Dashboards:**
```bash
# Install Grafana
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana

# Import dashboards
curl -X POST \
  http://admin:admin@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/dashboards/api-dashboard.json
```

**3. Log Aggregation with ELK Stack:**
```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:7.17.0
    volumes:
      - ./elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro

  kibana:
    image: kibana:7.17.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
```

### Application Performance Monitoring

**1. New Relic Integration:**
```typescript
// src/main.ts
import * as newrelic from 'newrelic';

if (process.env.NEW_RELIC_LICENSE_KEY) {
  newrelic.start();
}
```

**2. Sentry Error Tracking:**
```typescript
// Add to main.ts
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
```

## 💾 Backup & Recovery

### Automated Backup Strategy

**1. Database Backup Cron:**
```bash
# Add to crontab
0 2 * * * /path/to/restopapa/scripts/backup-database.sh
0 12 * * * /path/to/restopapa/scripts/backup-database.sh
```

**2. S3 Backup Configuration:**
```bash
# Environment variables for backup script
BACKUP_S3_BUCKET=restopapa-backups-prod
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
RETENTION_DAYS=30
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
```

**3. Disaster Recovery Plan:**

```bash
# scripts/disaster-recovery.sh
#!/bin/bash

# 1. Provision new infrastructure
terraform apply -var="environment=disaster-recovery"

# 2. Restore latest backup
./scripts/restore-database.sh restore latest

# 3. Update DNS to point to DR environment
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://dns-failover.json

# 4. Verify application health
curl -f https://api.restopapa.com/health
```

### Backup Testing

```bash
# Monthly backup test
./scripts/test-backup-restore.sh production monthly
```

## 🔒 Security Considerations

### Network Security

**1. Firewall Configuration:**
```bash
# Ubuntu UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**2. SSL/TLS Configuration:**
```nginx
# nginx/ssl.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;
```

### Application Security

**1. Security Headers:**
```typescript
// Already configured in main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // ... other directives
    },
  },
}));
```

**2. Rate Limiting:**
```nginx
# nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=3r/s;

location /api/v1/auth/ {
    limit_req zone=auth burst=5 nodelay;
}
```

### Secret Management

**1. Using Docker Secrets:**
```yaml
# docker-compose.prod.yml
services:
  api:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

**2. Using Vault:**
```bash
# Install Vault
vault kv put secret/restopapa \
  database_password=secure_password \
  jwt_secret=secure_jwt_secret
```

## ⚡ Performance Optimization

### Database Optimization

**1. Connection Pooling:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

**2. Database Tuning:**
```sql
-- PostgreSQL optimization
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Application Optimization

**1. PM2 Cluster Mode:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'restopapa-api',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
  }]
};
```

**2. Redis Optimization:**
```bash
# Redis configuration
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### CDN Configuration

**1. CloudFlare Setup:**
```bash
# DNS records for CDN
api.restopapa.com CNAME your-origin-server
```

**2. Cache Headers:**
```typescript
// Add cache headers for static content
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  },
}));
```

## 🔧 Troubleshooting

### Common Issues

**1. Application Won't Start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Check environment variables
docker-compose -f docker-compose.prod.yml exec api printenv | grep DATABASE

# Test database connection
docker-compose -f docker-compose.prod.yml exec api npm run db:status
```

**2. High CPU Usage:**
```bash
# Check running processes
docker-compose -f docker-compose.prod.yml exec api ps aux

# Monitor resource usage
docker stats restopapa-api-prod

# Check slow queries
docker-compose -f docker-compose.prod.yml exec postgres psql -U prod_user -d restopapa_prod -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**3. Memory Issues:**
```bash
# Check memory usage
free -h

# Check Node.js heap
docker-compose -f docker-compose.prod.yml exec api node -e "console.log(process.memoryUsage())"

# Enable heap profiling
NODE_OPTIONS="--max-old-space-size=2048" npm run start:prod
```

**4. Database Connection Issues:**
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec api pg_isready -h postgres -U prod_user

# Check connection pool
docker-compose -f docker-compose.prod.yml exec postgres psql -U prod_user -d restopapa_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Check locks
docker-compose -f docker-compose.prod.yml exec postgres psql -U prod_user -d restopapa_prod -c "SELECT * FROM pg_locks WHERE granted = false;"
```

### Performance Monitoring

**1. Application Metrics:**
```bash
# API response times
curl -w "@curl-format.txt" -s -o /dev/null https://api.restopapa.com/health

# Database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U prod_user -d restopapa_prod -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE tablename = 'User';"
```

**2. Log Analysis:**
```bash
# Error rate
grep "ERROR" logs/combined.log | tail -100

# Slow queries
grep "slow query" logs/combined.log | tail -50

# Security events
grep "SECURITY" logs/security.log | tail -20
```

### Rollback Strategy

**1. Application Rollback:**
```bash
# Rollback to previous version
docker tag your-registry/restopapa-api:v1.2.0 your-registry/restopapa-api:latest
docker-compose -f docker-compose.prod.yml up -d api

# Database migration rollback
npm run db:migrate:rollback
```

**2. Blue-Green Deployment:**
```bash
# Deploy to green environment
docker-compose -f docker-compose.green.yml up -d

# Switch traffic (update load balancer)
# If issues occur, switch back to blue
```

---

## 📞 Support & Maintenance

### Monitoring Checklist

- [ ] Application health checks
- [ ] Database performance metrics
- [ ] Redis memory usage
- [ ] Disk space utilization
- [ ] SSL certificate expiration
- [ ] Backup verification
- [ ] Log rotation
- [ ] Security updates

### Emergency Contacts

- **On-call Engineer**: ops@restopapa.com
- **Database Admin**: dba@restopapa.com
- **Security Team**: security@restopapa.com
- **Slack Channel**: #restopapa-ops

---

**Last Updated**: December 2024
**Version**: 2.0