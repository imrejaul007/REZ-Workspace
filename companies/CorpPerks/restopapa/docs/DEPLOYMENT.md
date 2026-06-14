# Deployment Guide - Restaurant SaaS Platform

## Overview

This document provides comprehensive deployment instructions for the Restaurant SaaS Platform using various deployment strategies.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+
- AWS Account (for S3 and production deployment)
- Domain name (for production)

## Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd restaurant-saas
```

### 2. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Update environment variables with your values
```

### 3. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Manual Setup (Alternative)

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database URL and other configs

# Database setup
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# Start development server
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Update .env.local with your API URL

# Start development server
npm run dev
```

## Production Deployment

### Option 1: Docker Compose (Recommended for VPS)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd restaurant-saas

# Set production environment
cp .env.example .env
# Update .env with production values

# Deploy with production profile
docker-compose --profile production up -d

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: AWS ECS Deployment

#### 1. Prerequisites
- AWS CLI configured
- ECR repositories created
- ECS cluster set up
- RDS PostgreSQL instance
- S3 bucket for file storage

#### 2. Build and Push Images
```bash
# Build backend image
cd backend
docker build -t restaurant-saas-backend .
docker tag restaurant-saas-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-backend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-backend:latest

# Build frontend image
cd ../frontend
docker build -t restaurant-saas-frontend .
docker tag restaurant-saas-frontend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-frontend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-frontend:latest
```

#### 3. ECS Task Definition
```json
{
  "family": "restaurant-saas",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://username:password@rds-endpoint:5432/restaurant_saas"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/restaurant-saas",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/restaurant-saas-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.yourdomain.com/api/v1"
        }
      ]
    }
  ]
}
```

### Option 3: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

**Namespace**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: restaurant-saas
```

**Backend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: restaurant-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: restaurant-saas-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: restaurant-saas
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
```

#### 2. Deploy to Kubernetes
```bash
kubectl apply -f k8s/
kubectl get pods -n restaurant-saas
```

## Database Management

### Migrations
```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backups
```bash
# Backup database
pg_dump -h localhost -U postgres -d restaurant_saas > backup.sql

# Restore database
psql -h localhost -U postgres -d restaurant_saas < backup.sql
```

## Monitoring & Health Checks

### Application Health Endpoints
- Backend: `GET /api/v1/health`
- Frontend: `GET /api/health`

### Monitoring Stack
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords and secrets
- Rotate secrets regularly

### 2. Database Security
- Use connection pooling
- Enable SSL connections
- Regular security updates
- Backup encryption

### 3. Application Security
- Enable CORS with specific origins
- Use HTTPS in production
- Implement rate limiting
- Regular dependency updates

### 4. Infrastructure Security
- Use private subnets for databases
- Configure security groups properly
- Enable CloudTrail and monitoring
- Regular security audits

## Performance Optimization

### 1. Database
- Index optimization
- Connection pooling
- Query optimization
- Read replicas for scaling

### 2. Application
- Redis caching
- CDN for static assets
- Image optimization
- API response caching

### 3. Infrastructure
- Load balancing
- Auto-scaling
- Container resource limits
- Network optimization

## Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database connectivity
docker-compose exec backend npx prisma db push

# Check database logs
docker-compose logs postgres
```

**Build Issues**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

**Memory Issues**
```bash
# Check container resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

## Scaling

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas
- Redis cluster
- CDN for static content

### Vertical Scaling
- Increase container resources
- Optimize database configuration
- Tune application performance

## Maintenance

### Regular Tasks
- Update dependencies
- Security patches
- Database maintenance
- Log rotation
- Backup verification

### Monitoring
- Application performance
- Database performance
- Error rates
- User metrics
- Security events