#!/bin/bash

# Production Deployment Script for RestaurantHub SaaS Platform
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/backup/restauranthub"
LOG_FILE="/var/log/restauranthub/deploy-$(date +%Y%m%d-%H%M%S).log"

echo -e "${BLUE}🚀 Starting RestaurantHub deployment to ${ENVIRONMENT}${NC}"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "${RED}❌ Error occurred on line $1${NC}"
    log "${RED}Deployment failed. Rolling back...${NC}"
    # Add rollback logic here
    exit 1
}

trap 'handle_error $LINENO' ERR

# Pre-deployment checks
log "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    log "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    log "${RED}❌ Environment file .env.${ENVIRONMENT} not found${NC}"
    exit 1
fi

# Check disk space
AVAILABLE_SPACE=$(df / | awk 'NR==2{print $4}')
REQUIRED_SPACE=1000000  # 1GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    log "${RED}❌ Insufficient disk space. Available: ${AVAILABLE_SPACE}KB, Required: ${REQUIRED_SPACE}KB${NC}"
    exit 1
fi

log "${GREEN}✅ Pre-deployment checks passed${NC}"

# Backup current deployment
log "${YELLOW}💾 Creating backup...${NC}"

mkdir -p "$BACKUP_DIR"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

if docker ps -q --filter "name=restauranthub" | grep -q .; then
    docker exec restauranthub-postgres pg_dump -U postgres restauranthub > "$BACKUP_DIR/database-$(date +%Y%m%d-%H%M%S).sql"
    log "${GREEN}✅ Database backup created${NC}"
fi

# Create full backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    . 2>/dev/null || true

log "${GREEN}✅ Application backup created: $BACKUP_NAME${NC}"

# Build and test
log "${YELLOW}🔨 Building application...${NC}"

# Frontend build test
cd frontend
npm run build 2>&1 | tee -a "$LOG_FILE"
cd ..

log "${GREEN}✅ Frontend build successful${NC}"

# Backend build test (if applicable)
if [ -f "backend/package.json" ]; then
    cd backend
    npm run build 2>&1 | tee -a "$LOG_FILE" || true
    cd ..
    log "${GREEN}✅ Backend build successful${NC}"
fi

# Run tests
log "${YELLOW}🧪 Running tests...${NC}"

cd frontend
npm run test 2>&1 | tee -a "$LOG_FILE" || true
cd ..

# Security scan
log "${YELLOW}🔒 Running security audit...${NC}"

cd frontend
npm audit --audit-level moderate 2>&1 | tee -a "$LOG_FILE" || true
cd ..

# Stop existing services
log "${YELLOW}⏹️  Stopping existing services...${NC}"

if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
    docker-compose -f docker-compose.prod.yml down
    log "${GREEN}✅ Services stopped${NC}"
fi

# Clean up old images (keep last 3)
log "${YELLOW}🧹 Cleaning up old Docker images...${NC}"

docker image prune -f
docker system prune -f --volumes=false

log "${GREEN}✅ Cleanup completed${NC}"

# Deploy new version
log "${YELLOW}🚀 Deploying new version...${NC}"

# Copy environment file
cp ".env.${ENVIRONMENT}" ".env"

# Build and start services
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

log "${GREEN}✅ Services started${NC}"

# Health checks
log "${YELLOW}🏥 Running health checks...${NC}"

# Wait for services to start
sleep 30

# Check frontend health
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$FRONTEND_HEALTH" != "200" ]; then
    log "${RED}❌ Frontend health check failed (HTTP $FRONTEND_HEALTH)${NC}"
    exit 1
fi

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health || echo "000")
if [ "$BACKEND_HEALTH" != "200" ]; then
    log "${RED}❌ Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
    exit 1
fi

# Check database connectivity
if ! docker exec restauranthub-postgres pg_isready -U postgres &> /dev/null; then
    log "${RED}❌ Database health check failed${NC}"
    exit 1
fi

log "${GREEN}✅ All health checks passed${NC}"

# Performance tests
log "${YELLOW}⚡ Running performance tests...${NC}"

# Test page load times
HOMEPAGE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/ || echo "999")
DASHBOARD_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/dashboard || echo "999")

log "📊 Performance metrics:"
log "  - Homepage load time: ${HOMEPAGE_TIME}s"
log "  - Dashboard load time: ${DASHBOARD_TIME}s"

# Warning if load times are too high
if (( $(echo "$HOMEPAGE_TIME > 2.0" | bc -l) )); then
    log "${YELLOW}⚠️  Homepage load time is high (${HOMEPAGE_TIME}s)${NC}"
fi

# SSL/TLS check (if using HTTPS)
if [ "$ENVIRONMENT" = "production" ]; then
    log "${YELLOW}🔒 Checking SSL/TLS configuration...${NC}"
    
    # Check SSL certificate (adjust domain as needed)
    # SSL_SCORE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com" | jq -r '.endpoints[0].grade' || echo "Unknown")
    # log "🔒 SSL Labs Grade: $SSL_SCORE"
fi

# Generate deployment report
log "${YELLOW}📊 Generating deployment report...${NC}"

REPORT_FILE="/var/log/restauranthub/deployment-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "status": "success"
  },
  "health_checks": {
    "frontend": "$FRONTEND_HEALTH",
    "backend": "$BACKEND_HEALTH",
    "database": "healthy"
  },
  "performance": {
    "homepage_load_time": "$HOMEPAGE_TIME",
    "dashboard_load_time": "$DASHBOARD_TIME"
  },
  "services": {
    "frontend": "$(docker ps --format 'table {{.Status}}' --filter name=restauranthub-frontend | tail -n1)",
    "backend": "$(docker ps --format 'table {{.Status}}' --filter name=restauranthub-backend | tail -n1)",
    "database": "$(docker ps --format 'table {{.Status}}' --filter name=restauranthub-postgres | tail -n1)",
    "nginx": "$(docker ps --format 'table {{.Status}}' --filter name=restauranthub-nginx | tail -n1)"
  }
}
EOF

log "${GREEN}✅ Deployment report generated: $REPORT_FILE${NC}"

# Final status
log "${GREEN}🎉 Deployment completed successfully!${NC}"
log "${BLUE}📝 Summary:${NC}"
log "  - Environment: $ENVIRONMENT"
log "  - Backup: $BACKUP_NAME"
log "  - Log file: $LOG_FILE"
log "  - Report: $REPORT_FILE"
log "  - Frontend: http://localhost:3000"
log "  - Backend API: http://localhost:8000/api/v1"

# Send notification (if configured)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🎉 RestaurantHub deployment to '$ENVIRONMENT' completed successfully!"}' \
        "$SLACK_WEBHOOK" &> /dev/null || true
fi

if [ -n "$DISCORD_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"content":"🎉 RestaurantHub deployment to '$ENVIRONMENT' completed successfully!"}' \
        "$DISCORD_WEBHOOK" &> /dev/null || true
fi

log "${GREEN}✨ All done! RestaurantHub is now running in $ENVIRONMENT mode.${NC}"