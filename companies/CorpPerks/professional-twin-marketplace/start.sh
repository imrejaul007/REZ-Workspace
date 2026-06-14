#!/bin/bash

# =============================================================================
# TwinOS Deployment Script
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="twinos"
PORT=${PORT:-4760}
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/twinos"}
NODE_ENV=${NODE_ENV:-"development"}

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

# =============================================================================
# FUNCTIONS
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# =============================================================================
# PRE-CHECKS
# =============================================================================

pre_checks() {
    log "Running pre-flight checks..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    info "Node.js: $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    info "npm: $(npm --version)"

    # Check MongoDB connection
    if [ -n "$MONGODB_URI" ]; then
        if command -v mongosh &> /dev/null; then
            if mongosh --eval "db.adminCommand('ping')" "$MONGODB_URI" &> /dev/null; then
                info "MongoDB: Connected"
            else
                warn "MongoDB: Connection failed (will retry on startup)"
            fi
        fi
    fi

    log "Pre-flight checks complete"
}

# =============================================================================
# INSTALL
# =============================================================================

install() {
    log "Installing dependencies..."
    npm install
    log "Dependencies installed"
}

# =============================================================================
# BUILD
# =============================================================================

build() {
    log "Building application..."
    npm run build
    log "Build complete"
}

# =============================================================================
# START
# =============================================================================

start() {
    log "Starting $SERVICE_NAME on port $PORT..."

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Export environment variables
    export PORT
    export MONGODB_URI
    export NODE_ENV

    # Start the application
    npm run dev > "$LOG_DIR/$SERVICE_NAME.log" 2>&1 &
    PID=$!

    # Save PID
    echo $PID > "$SCRIPT_DIR/$SERVICE_NAME.pid"

    # Wait for startup
    sleep 3

    # Check if running
    if ps -p $PID > /dev/null; then
        log "$SERVICE_NAME started successfully (PID: $PID)"
        log "Health check: http://localhost:$PORT/health"
        log "API docs: http://localhost:$PORT/"
    else
        error "Failed to start $SERVICE_NAME"
        error "Check logs: $LOG_DIR/$SERVICE_NAME.log"
        exit 1
    fi
}

# =============================================================================
# STOP
# =============================================================================

stop() {
    log "Stopping $SERVICE_NAME..."

    if [ -f "$SCRIPT_DIR/$SERVICE_NAME.pid" ]; then
        PID=$(cat "$SCRIPT_DIR/$SERVICE_NAME.pid")

        if ps -p $PID > /dev/null; then
            kill $PID
            sleep 2

            if ps -p $PID > /dev/null; then
                warn "Force killing..."
                kill -9 $PID
            fi

            log "$SERVICE_NAME stopped"
        else
            warn "$SERVICE_NAME was not running"
        fi

        rm "$SCRIPT_DIR/$SERVICE_NAME.pid"
    else
        warn "No PID file found"
    fi
}

# =============================================================================
# RESTART
# =============================================================================

restart() {
    stop
    sleep 2
    start
}

# =============================================================================
# STATUS
# =============================================================================

status() {
    if [ -f "$SCRIPT_DIR/$SERVICE_NAME.pid" ]; then
        PID=$(cat "$SCRIPT_DIR/$SERVICE_NAME.pid")

        if ps -p $PID > /dev/null; then
            log "$SERVICE_NAME is running (PID: $PID)"

            # Check health
            if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                info "Health check: OK"
            else
                warn "Health check: FAILED"
            fi
        else
            warn "$SERVICE_NAME is not running (stale PID file)"
        fi
    else
        warn "$SERVICE_NAME is not running"
    fi
}

# =============================================================================
# LOGS
# =============================================================================

logs() {
    if [ -f "$LOG_DIR/$SERVICE_NAME.log" ]; then
        tail -f "$LOG_DIR/$SERVICE_NAME.log"
    else
        warn "No logs found"
    fi
}

# =============================================================================
# TEST
# =============================================================================

test() {
    log "Running tests..."
    npm test
}

# =============================================================================
# DEPLOY (Production)
# =============================================================================

deploy() {
    log "Deploying to production..."

    # Set production environment
    export NODE_ENV=production

    # Build
    build

    # Stop existing
    stop

    # Start
    start

    log "Deployment complete"
}

# =============================================================================
# SCALE (Horizontal)
# =============================================================================

scale() {
    local instances=${1:-2}

    log "Scaling to $instances instances..."

    # Stop existing
    stop

    # Start multiple instances (different ports)
    for i in $(seq 1 $instances); do
        PORT=$((4760 + i - 1)) start &
    done

    log "Scaled to $instances instances"
}

# =============================================================================
# HEALTH CHECK
# =============================================================================

health() {
    local url=${1:-"http://localhost:$PORT/health"}

    log "Checking health: $url"

    local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo -e "\n000")
    local body=$(echo "$response" | sed '$d')
    local code=$(echo "$response" | tail -1)

    if [ "$code" = "200" ]; then
        log "Health: OK"
        echo "$body" | jq '.'
        return 0
    else
        error "Health: FAILED (HTTP $code)"
        return 1
    fi
}

# =============================================================================
# MIGRATE
# =============================================================================

migrate() {
    log "Running migrations..."

    if [ -f "$SCRIPT_DIR/scripts/migrate.ts" ]; then
        npx tsx "$SCRIPT_DIR/scripts/migrate.ts"
    else
        warn "No migration script found"
    fi
}

# =============================================================================
# SEED
# =============================================================================

seed() {
    log "Seeding database..."

    if [ -f "$SCRIPT_DIR/scripts/seed.ts" ]; then
        npx tsx "$SCRIPT_DIR/scripts/seed.ts"
    else
        warn "No seed script found"
    fi
}

# =============================================================================
# DOCKER
# =============================================================================

docker_build() {
    log "Building Docker image..."
    docker build -t twinos:latest .
}

docker_run() {
    log "Running Docker container..."
    docker run -d \
        --name twinos \
        -p $PORT:$PORT \
        -e MONGODB_URI="$MONGODB_URI" \
        -e NODE_ENV=production \
        twinos:latest
}

docker_stop() {
    log "Stopping Docker container..."
    docker stop twinos
    docker rm twinos
}

# =============================================================================
# HELP
# =============================================================================

help() {
    echo ""
    echo -e "${GREEN}TwinOS Deployment Commands${NC}"
    echo ""
    echo "Usage: ./start.sh <command>"
    echo ""
    echo "Commands:"
    echo "  install    Install dependencies"
    echo "  build      Build the application"
    echo "  start      Start the service"
    echo "  stop       Stop the service"
    echo "  restart    Restart the service"
    echo "  status     Check service status"
    echo "  logs       View service logs"
    echo "  test       Run tests"
    echo "  deploy     Deploy to production"
    echo "  scale      Scale to N instances"
    echo "  health     Check service health"
    echo "  migrate    Run database migrations"
    echo "  seed       Seed database"
    echo "  docker     Build Docker image"
    echo "  help       Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  PORT          Service port (default: 4760)"
    echo "  MONGODB_URI   MongoDB connection string"
    echo "  NODE_ENV      Environment (development|production)"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

case "$1" in
    install)
        pre_checks
        install
        ;;
    build)
        build
        ;;
    start)
        pre_checks
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    test)
        test
        ;;
    deploy)
        deploy
        ;;
    scale)
        scale "$2"
        ;;
    health)
        health "$2"
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    docker)
        docker_build
        docker_run
        ;;
    docker:build)
        docker_build
        ;;
    docker:run)
        docker_run
        ;;
    docker:stop)
        docker_stop
        ;;
    pre-check|pre_checks)
        pre_checks
        ;;
    help|--help|-h)
        help
        ;;
    *)
        help
        ;;
esac
