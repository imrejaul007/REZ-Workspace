#!/bin/bash

# Production Deployment Script
# RestaurantHub SaaS Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="RestaurantHub"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/restauranthub-deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Check if running as root (for production server setup)
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This is okay for initial server setup."
    fi
}

# Verify prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if required files exist
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error "Docker Compose file not found: $COMPOSE_FILE"
    fi
    
    if [[ ! -f ".env.production" ]]; then
        error "Production environment file not found: .env.production"
    fi
    
    success "All prerequisites met"
}

# Create backup before deployment
create_backup() {
    log "Creating pre-deployment backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Get current timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/pre_deploy_backup_$TIMESTAMP.sql"
    
    # Create database backup if container is running
    if docker ps | grep -q "restauranthub-postgres-prod"; then
        log "Creating database backup..."
        docker exec restauranthub-postgres-prod pg_dump -U restauranthub_user restauranthub_prod > "$BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        success "Database backup created: $BACKUP_FILE.gz"
    else
        warning "PostgreSQL container not running, skipping database backup"
    fi
    
    # Clean old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "pre_deploy_backup_*.sql.gz" -mtime +7 -delete
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    success "Docker images updated"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Start database if not running
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Run Prisma migrations
    docker-compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy
    success "Database migrations completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Copy production environment file
    cp .env.production .env
    
    # Start all services with zero downtime deployment
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    success "Application deployed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 60
    
    # Check frontend
    if curl -f -s http://localhost/health > /dev/null; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check backend API
    if curl -f -s http://localhost/api/health > /dev/null; then
        success "Backend API health check passed"
    else
        error "Backend API health check failed"
    fi
    
    # Check database connection
    if docker exec restauranthub-postgres-prod pg_isready -U restauranthub_user > /dev/null 2>&1; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    success "All health checks passed"
}

# Clean up old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    docker volume prune -f --filter label!=keep
    
    # Remove unused networks
    docker network prune -f
    
    success "Cleanup completed"
}

# SSL certificate management
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    # Check if certificates exist
    if [[ -f "nginx/ssl/cert.pem" && -f "nginx/ssl/key.pem" ]]; then
        success "SSL certificates found"
    else
        warning "SSL certificates not found. Please add your SSL certificates to nginx/ssl/"
        warning "Required files: cert.pem and key.pem"
        
        # Create self-signed certificate for testing (DO NOT USE IN PRODUCTION)
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        warning "Self-signed certificate created for testing only"
        warning "Replace with proper SSL certificates before production use"
    fi
}

# Monitor deployment
monitor_deployment() {
    log "Monitoring deployment..."
    
    # Show running containers
    echo ""
    log "Running containers:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Show logs
    echo ""
    log "Recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/pre_deploy_backup_*.sql.gz 2>/dev/null | head -n1)
    
    if [[ -n "$LATEST_BACKUP" ]]; then
        log "Restoring from backup: $LATEST_BACKUP"
        
        # Start database
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 30
        
        # Restore database
        gunzip -c "$LATEST_BACKUP" | docker exec -i restauranthub-postgres-prod psql -U restauranthub_user -d restauranthub_prod
        
        success "Database restored from backup"
    else
        warning "No backup found for rollback"
    fi
    
    error "Rollback completed. Please investigate the issue."
}

# Main deployment function
main() {
    log "Starting $PROJECT_NAME production deployment..."
    
    # Set trap for rollback on error
    trap rollback ERR
    
    check_permissions
    check_prerequisites
    create_backup
    setup_ssl
    pull_images
    run_migrations
    deploy_application
    health_check
    cleanup
    monitor_deployment
    
    success "🎉 $PROJECT_NAME deployed successfully to production!"
    log "Deployment completed at $(date)"
    
    echo ""
    echo -e "${GREEN}🚀 Your RestaurantHub platform is now running in production!${NC}"
    echo -e "${BLUE}📊 Access your application at: https://your-domain.com${NC}"
    echo -e "${BLUE}📈 Monitor logs with: docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "${BLUE}📋 Check status with: docker-compose -f $COMPOSE_FILE ps${NC}"
    echo ""
}

# Script options
case "${1:-}" in
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    "rollback")
        rollback
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    "stop")
        log "Stopping all services..."
        docker-compose -f "$COMPOSE_FILE" down
        success "All services stopped"
        ;;
    *)
        main
        ;;
esac