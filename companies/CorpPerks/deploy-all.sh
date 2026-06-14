#!/bin/bash
# =============================================================================
# CorpPerks Deployment Script
# =============================================================================
# Complete deployment script for all CorpPerks services
# Usage: ./deploy-all.sh [command]
# Commands: up, down, restart, logs, status, seed, build, clean
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="corpperks"
ENV_FILE=".env.production"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Docker and Docker Compose are available"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file $ENV_FILE not found. Creating from template..."
        cp .env.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
        log_warning "Please edit $ENV_FILE with your production values before deploying."
    fi
}

# =============================================================================
# Build Functions
# =============================================================================

build_images() {
    log_info "Building all Docker images..."

    # Build backend
    if [ -d "backend" ]; then
        log_info "Building CorpPerks API..."
        docker compose -f "$COMPOSE_FILE" build corperks-api
    fi

    # Build intelligence
    if [ -d "corpperks-intelligence" ]; then
        log_info "Building CorpPerks Intelligence..."
        docker compose -f "$COMPOSE_FILE" build corpperks-intelligence
    fi

    # Build projectos
    if [ -d "projectos-service" ]; then
        log_info "Building ProjectOS..."
        docker compose -f "$COMPOSE_FILE" build projectos-service
    fi

    # Build REZ merchant bridge
    if [ -d "REZ-merchant-corpperks-bridge" ]; then
        log_info "Building REZ Merchant Bridge..."
        docker compose -f "$COMPOSE_FILE" build REZ-merchant-corpperks-bridge
    fi

    # Build rez-corporate-service
    if [ -d "rez-corporate-service" ]; then
        log_info "Building REZ Corporate Service..."
        docker compose -f "$COMPOSE_FILE" build rez-corporate-service
    fi

    # Build corpid services
    if [ -d "corpid/services" ]; then
        for service in corpid/services/*/; do
            service_name=$(basename "$service")
            if [ -f "$service/Dockerfile" ]; then
                log_info "Building corpid-$service_name..."
                docker compose -f "$COMPOSE_FILE" build "corpid-$service_name"
            fi
        done
    fi

    # Build frontend
    if [ -d "peopleos" ]; then
        log_info "Building PeopleOS Frontend..."
        docker compose -f "$COMPOSE_FILE" build peopleos-frontend
    fi

    log_success "All images built successfully"
}

build_service() {
    local service_name=$1
    log_info "Building $service_name..."
    docker compose -f "$COMPOSE_FILE" build "$service_name"
    log_success "$service_name built successfully"
}

# =============================================================================
# Deployment Functions
# =============================================================================

deploy() {
    log_info "Deploying CorpPerks services..."

    check_env_file

    # Build images first
    build_images

    # Start infrastructure services first
    log_info "Starting infrastructure services..."
    docker compose -f "$COMPOSE_FILE" up -d mongodb redis

    # Wait for infrastructure to be healthy
    log_info "Waiting for MongoDB to be ready..."
    until docker compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; do
        sleep 2
        echo -n "."
    done
    echo ""
    log_success "MongoDB is ready"

    log_info "Waiting for Redis to be ready..."
    until docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis-dev-password}" ping &>/dev/null; do
        sleep 2
        echo -n "."
    done
    echo ""
    log_success "Redis is ready"

    # Start backend services
    log_info "Starting backend services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        corperks-api \
        corpperks-intelligence \
        projectos-service

    # Start REZ integration services
    log_info "Starting REZ integration services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        REZ-merchant-corpperks-bridge \
        rez-corporate-service

    # Start corpid services
    log_info "Starting CorpID services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        corpid-api-gateway \
        corpid-identity-service \
        corpid-trust-graph-service \
        corpid-verification-service \
        corpid-passport-service \
        corpid-ci-score-service \
        corpid-risk-service \
        corpid-document-service \
        corpid-notification-service \
        corpid-admin-service \
        corpid-partner-service \
        corpid-monitor-service

    # Start frontend
    log_info "Starting frontend services..."
    docker compose -f "$COMPOSE_FILE" up -d peopleos-frontend

    log_success "All services deployed successfully"
}

up() {
    log_info "Starting all services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    log_success "All services started"
}

down() {
    log_info "Stopping all services..."
    docker compose -f "$COMPOSE_FILE" down
    log_success "All services stopped"
}

restart() {
    log_info "Restarting all services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    log_success "All services restarted"
}

# =============================================================================
# Status & Monitoring Functions
# =============================================================================

status() {
    log_info "Checking service status..."
    echo ""
    echo "========================================"
    echo "        CorpPerks Service Status        "
    echo "========================================"
    echo ""

    docker compose -f "$COMPOSE_FILE" ps

    echo ""
    echo "========================================"
    echo "         Health Check Summary          "
    echo "========================================"
    echo ""

    local services=(
        "corperks-api:4006"
        "corpperks-intelligence:4135"
        "projectos-service:4715"
        "REZ-merchant-corpperks-bridge:4008"
        "rez-corporate-service:4030"
        "corpid-api-gateway:4700"
        "peopleos-frontend:3000"
    )

    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name ($port) - Healthy"
        else
            echo -e "  ${RED}✗${NC} $name ($port) - Unhealthy/Not responding"
        fi
    done

    echo ""
}

logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        log_info "Showing logs for $service..."
        docker compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        log_info "Showing logs for all services..."
        docker compose -f "$COMPOSE_FILE" logs -f
    fi
}

# =============================================================================
# Database Functions
# =============================================================================

seed() {
    log_info "Seeding database with demo data..."

    # Seed backend
    if [ -f "backend/dist/scripts/seed.js" ]; then
        log_info "Seeding CorpPerks API database..."
        docker compose -f "$COMPOSE_FILE" exec -T corperks-api node dist/scripts/seed.js
    elif [ -f "backend/src/scripts/seed.ts" ]; then
        log_info "Seeding CorpPerks API database..."
        docker compose -f "$COMPOSE_FILE" exec -T corperks-api npx tsx src/scripts/seed.ts
    fi

    # Seed projectos
    if [ -d "projectos-service" ]; then
        log_info "Seeding ProjectOS database..."
        docker compose -f "$COMPOSE_FILE" exec -T projectos-service npm run seed 2>/dev/null || true
    fi

    log_success "Database seeding completed"
}

migrate() {
    log_info "Running database migrations..."

    log_info "Migrating CorpPerks API..."
    docker compose -f "$COMPOSE_FILE" exec -T corperks-api npm run migrate 2>/dev/null || \
    docker compose -f "$COMPOSE_FILE" exec -T corperks-api node dist/scripts/migrate.js 2>/dev/null || \
    log_warning "No migration script found for CorpPerks API"

    log_info "Migrating ProjectOS..."
    docker compose -f "$COMPOSE_FILE" exec -T projectos-service npm run migrate 2>/dev/null || \
    log_warning "No migration script found for ProjectOS"

    log_success "Migrations completed"
}

# =============================================================================
# Cleanup Functions
# =============================================================================

clean() {
    log_warning "Cleaning up Docker resources..."
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans
    log_success "Cleanup completed"
}

clean_images() {
    log_warning "Removing all CorpPerks Docker images..."
    docker images | grep corpperks | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    docker images | grep projectos | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    docker images | grep corpid | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    log_success "Docker images cleaned"
}

# =============================================================================
# Utility Functions
# =============================================================================

create_dockerfiles() {
    log_info "Creating Dockerfiles for services..."

    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 4006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4006/health || exit 1

# Start
CMD ["node", "dist/index.js"]
EOF
    log_success "Created backend/Dockerfile"

    # CorpPerks Intelligence Dockerfile
    cat > corpperks-intelligence/Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4135

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4135/health || exit 1

CMD ["node", "dist/index.js"]
EOF
    log_success "Created corpperks-intelligence/Dockerfile"

    # ProjectOS Dockerfile
    cat > projectos-service/Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4715

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4715/health || exit 1

CMD ["node", "dist/index.js"]
EOF
    log_success "Created projectos-service/Dockerfile"

    # Create Dockerfiles for corpid services
    if [ -d "corpid/services" ]; then
        for service in corpid/services/*/; do
            service_name=$(basename "$service")
            cat > "$service/Dockerfile" << EOF
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build || true

FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=0 /app/dist ./dist 2>/dev/null || true
COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4700

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4700/health || exit 1

CMD ["node", "dist/index.js"] || ["node", "src/index.js"]
EOF
        done
        log_success "Created Dockerfiles for corpid services"
    fi

    # PeopleOS Dockerfile
    cat > peopleos/Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next .next
COPY --from=builder /app/package*.json ./

RUN npm ci && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
EOF
    log_success "Created peopleos/Dockerfile"

    log_success "All Dockerfiles created"
}

create_mongodb_config() {
    mkdir -p config/mongodb
    cat > config/mongodb/mongod.conf << 'EOF'
# MongoDB Configuration for Production

storage:
  dbPath: /data/db
  journal:
    enabled: true
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
      journalCompressor: snappy
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 0.0.0.0
  maxIncomingConnections: 65536

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100

security:
  authorization: enabled
EOF
    log_success "Created MongoDB configuration"
}

# =============================================================================
# Main Command Handler
# =============================================================================

usage() {
    echo ""
    echo "CorpPerks Deployment Script"
    echo "==========================="
    echo ""
    echo "Usage: ./deploy-all.sh <command>"
    echo ""
    echo "Commands:"
    echo "  up          - Start all services (with build)"
    echo "  down        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Show service status and health"
    echo "  logs        - Show logs (use: logs <service>)"
    echo "  seed        - Seed database with demo data"
    echo "  migrate     - Run database migrations"
    echo "  build       - Build all Docker images"
    echo "  build:<svc> - Build specific service"
    echo "  clean       - Stop and remove containers"
    echo "  clean:images - Remove all CorpPerks images"
    echo "  setup       - Create Dockerfiles and configs"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy-all.sh up              # Deploy everything"
    echo "  ./deploy-all.sh status         # Check health"
    echo "  ./deploy-all.sh logs corperks-api  # View API logs"
    echo "  ./deploy-all.sh build:corperks-api # Build only API"
    echo ""
}

# =============================================================================
# Main Entry Point
# =============================================================================

COMMAND=${1:-help}

case $COMMAND in
    up)
        check_docker
        deploy
        ;;
    down)
        down
        ;;
    restart)
        check_docker
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    seed)
        check_docker
        seed
        ;;
    migrate)
        check_docker
        migrate
        ;;
    build)
        check_docker
        build_images
        ;;
    build:*)
        SERVICE=${COMMAND#build:}
        check_docker
        build_service "$SERVICE"
        ;;
    clean)
        clean
        ;;
    clean:images)
        clean_images
        ;;
    setup)
        check_docker
        create_dockerfiles
        create_mongodb_config
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
