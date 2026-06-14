#!/bin/bash
# StayOwn-Hospitality Docker Deployment Script

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} [${1}] ${2}"; }
log_success() { log "${GREEN}SUCCESS${NC}" "$1"; }
log_error() { log "${RED}ERROR${NC}" "$1"; }
log_warning() { log "${YELLOW}WARNING${NC}" "$1"; }
log_info() { log "${BLUE}INFO${NC}" "$1"; }

check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        exit 1
    fi
    log_success "Prerequisites checked"
}

deploy() {
    log_info "Loading environment..."
    set -a
    source "$ENV_FILE"
    set +a

    log_info "Building images..."
    docker compose -f "$COMPOSE_FILE" build --parallel

    log_info "Starting infrastructure..."
    docker compose -f "$COMPOSE_FILE" up -d mongodb redis rabbitmq

    log_info "Waiting for MongoDB..."
    sleep 10

    log_info "Starting all services..."
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "Deployment complete!"
}

status() {
    docker compose -f "$COMPOSE_FILE" ps
}

case "${1:-deploy}" in
    deploy) check_prerequisites; deploy; status ;;
    start) docker compose -f "$COMPOSE_FILE" start ;;
    stop) docker compose -f "$COMPOSE_FILE" stop ;;
    restart) docker compose -f "$COMPOSE_FILE" restart ;;
    status) status ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|status}"
        ;;
esac
