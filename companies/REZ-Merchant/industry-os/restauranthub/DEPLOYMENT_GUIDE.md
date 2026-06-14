# RestoPapa Deployment Guide

## 🚀 Quick Deployment Options

### 1. Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd restopapa

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env file with your configuration

# Start infrastructure
npm run docker:up

# Setup database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

**Access Points:**
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/docs
- Database: localhost:5432 (restopapa/restopapa_secret)
- Redis: localhost:6379

### 2. Production Deployment

#### Prerequisites
- Docker & Docker Compose
- Domain name with SSL certificates
- Database backup/restore plan

#### Step 1: Environment Configuration
```bash
# Create production environment file
cp .env.example .env.prod

# Update with production values:
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/restopapa
REDIS_URL=redis://user:pass@prod-redis:6379
JWT_SECRET=your-super-secure-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-key
RAZORPAY_KEY_ID=your-razorpay-key
```

#### Step 2: SSL Configuration
```bash
# Place SSL certificates in deploy/nginx/ssl/
mkdir -p deploy/nginx/ssl
cp your-domain.crt deploy/nginx/ssl/
cp your-domain.key deploy/nginx/ssl/
```

#### Step 3: Deploy
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run db:migrate

# Check services health
docker-compose -f docker-compose.prod.yml ps
```

#### Step 4: Monitoring Setup
- **Grafana Dashboard**: http://your-domain:3003
- **Prometheus Metrics**: http://your-domain:9090
- **Application Logs**: `docker-compose logs -f api`

### 3. Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (1.20+)
- Helm 3.0+
- kubectl configured

```bash
# Deploy using Helm
helm install restopapa ./deploy/helm/restopapa \
  --namespace restopapa \
  --create-namespace \
  --values ./deploy/helm/values-prod.yaml

# Check deployment status
kubectl get pods -n restopapa
kubectl get services -n restopapa
```

## 🔧 Configuration Management

### Environment Variables

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://user:pass@host:6379

# Authentication
JWT_SECRET=your-super-secure-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-encryption-key

# AWS Services
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_key
RAZORPAY_KEY_SECRET=your-secret
RAZORPAY_WEBHOOK_SECRET=webhook-secret

# Email
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com

# App
FRONTEND_URL=https://your-frontend-domain.com
```

#### Optional Variables
```bash
# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,png,pdf,doc,docx

# Features
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_AADHAR_VERIFICATION=true
```

### Database Configuration

#### Connection Pool Settings
```bash
# Prisma connection pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_TIMEOUT=30000
```

#### Performance Optimization
```sql
-- Apply these settings to PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### Redis Configuration
```bash
# redis.conf settings
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🔒 Security Checklist

### Pre-deployment Security
- [ ] Change all default passwords
- [ ] Generate secure JWT secrets (256-bit minimum)
- [ ] Configure firewall rules
- [ ] Setup SSL/TLS certificates
- [ ] Enable HTTPS redirect
- [ ] Configure CORS policies
- [ ] Setup rate limiting
- [ ] Enable SQL injection protection
- [ ] Configure XSS protection headers

### Production Security
- [ ] Regular security audits (`npm audit`)
- [ ] Container security scanning
- [ ] Database access restrictions
- [ ] API endpoint authentication
- [ ] File upload restrictions
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] CSRF token implementation

### Compliance (if handling sensitive data)
- [ ] GDPR compliance (data deletion, consent)
- [ ] PCI DSS (if handling payments directly)
- [ ] SOC 2 controls
- [ ] Regular penetration testing
- [ ] Audit logging

## 📊 Monitoring & Observability

### Application Metrics
- **Health Checks**: `/health`, `/health/ready`, `/health/live`
- **Prometheus Metrics**: Custom business metrics
- **Error Tracking**: Sentry integration
- **Performance**: Response times, throughput

### Infrastructure Monitoring
```bash
# Key metrics to monitor
- CPU usage < 80%
- Memory usage < 85%
- Disk usage < 90%
- Database connections < max_pool_size
- Redis memory usage < maxmemory
- API response time < 200ms (95th percentile)
- Error rate < 1%
```

### Alerting Rules
```yaml
# Example Prometheus alerts
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical

- alert: DatabaseDown
  expr: up{job="postgres"} == 0
  for: 30s
  labels:
    severity: critical
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/restopapa-$(date +%Y%m%d).sql.gz

# Retain backups for 30 days
find /backups -name "restopapa-*.sql.gz" -mtime +30 -delete
```

### File Backup (S3)
```bash
# Sync uploaded files to backup bucket
aws s3 sync s3://your-main-bucket s3://your-backup-bucket --delete
```

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Verification**: Weekly restore tests
4. **Failover Procedure**: Documented step-by-step

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check connection
docker-compose exec api npm run db:status

# Reset connections
docker-compose restart postgres
docker-compose restart api
```

#### Redis Connection Issues
```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

#### High Memory Usage
```bash
# Check container memory
docker stats

# Optimize Node.js heap
NODE_OPTIONS="--max-old-space-size=1024"
```

### Performance Issues

#### Slow Database Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_orders_created_at ON "Order"(created_at);
```

#### High CPU Usage
```bash
# Profile Node.js application
NODE_ENV=production node --prof dist/main.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## 📈 Scaling Strategies

### Horizontal Scaling
- Load balancer configuration (nginx, HAProxy)
- Multiple API server instances
- Redis cluster for session storage
- CDN for static assets

### Database Scaling
- Read replicas for queries
- Connection pooling optimization
- Query optimization and indexing
- Partitioning large tables

### Caching Strategy
- Redis for session storage
- Application-level caching
- CDN for static content
- Database query result caching

## 🔄 CI/CD Pipeline

### Automated Testing
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Security scanning (SAST/DAST)

### Deployment Stages
1. **Development** → Auto-deploy on feature branch
2. **Staging** → Auto-deploy on develop branch
3. **Production** → Manual approval on main branch

### Rollback Strategy
```bash
# Quick rollback using Docker tags
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale api=0
docker tag restopapa/api:previous-version restopapa/api:latest
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly dependency updates
- [ ] Monthly security patches
- [ ] Quarterly performance reviews
- [ ] Annual architecture review

### Support Contacts
- **Development Team**: dev@restopapa.com
- **Infrastructure**: ops@restopapa.com
- **Security Issues**: security@restopapa.com
- **Emergency**: +1-XXX-XXX-XXXX

---

For additional support, please refer to the [README.md](./README.md) or create an issue in the project repository.