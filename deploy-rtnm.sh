#!/bin/bash
# =============================================================================
# RTNM Ecosystem - Master Deployment Script
# Deploys the entire Real-Time Marketplace Network
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.rtnm.yml"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          RTNM 2035 - Real-Time Marketplace Network              ║"
echo "║              Master Deployment Script v3.0                       ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status() { echo -e "${CYAN}[RTNM]${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_header() { echo -e "\n${BOLD}${PURPLE}═══ $1 ═══${NC}\n"; }

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing=()

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing prerequisites: ${missing[*]}"
        exit 1
    fi

    print_success "All prerequisites installed"
    docker --version
}

# Setup network
setup_network() {
    print_status "Creating network..."
    docker network create rtnm-network 2>/dev/null || print_status "Network already exists"
}

# Deploy using docker compose
deploy() {
    print_header "Deploying RTNM Ecosystem"

    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    print_status "Building and starting containers..."

    # Check if docker compose plugin or standalone
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" up -d --build
    else
        docker-compose -f "$COMPOSE_FILE" up -d --build
    fi

    print_success "Deployment complete"
}

# Health check all services
health_check() {
    print_header "Running Health Checks"

    local services=(
        "sutar-intent-bus:4154"
        "sutar-negotiation-engine:4191"
        "sutar-decision-engine:4240"
        "sutar-rez-bridge:4155"
        "rez-event-bus:4075"
        "order-flow-orchestrator:4260"
        "hojai-core-bridge:4270"
        "salar-bridge:4271"
        "industry-agent-bridge:4272"
        "rez-intent-predictor:4018"
        "rez-predictive-engine:4123"
        "rez-memory-layer:4201"
        "voiceos-unified:4850"
        "rez-ai-voice:4112"
        "genie-memory:4703"
        "genie-relationship:4704"
        "genie-briefing:4706"
        "rez-order-service:4006"
        "rez-delivery-service:4009"
        "rez-merchant-service:4005"
        "rez-kds-service:4014"
    )

    local total=${#services[@]}
    local healthy=0
    local failed=()

    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"

        if curl -sf --max-time 5 "http://localhost:$port/health" &> /dev/null; then
            print_success "$name (port $port)"
            healthy=$((healthy + 1))
        else
            print_warning "$name (port $port) - not responding"
            failed+=("$name")
        fi
    done

    echo -e "\n${BOLD}Summary:${NC}"
    echo -e "  Total: $total"
    echo -e "  Healthy: ${GREEN}$healthy${NC}"
    echo -e "  Failed: ${RED}$((total - healthy))${NC}"

    if [ ${#failed[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}Failed services:${NC}"
        for f in "${failed[@]}"; do
            echo "  - $f"
        done
    fi
}

# Show status
status() {
    print_header "Service Status"

    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
}

# Show logs
logs() {
    local service="${1:-}"

    if [ -n "$service" ]; then
        print_status "Showing logs for: $service"
        if docker compose version &> /dev/null; then
            docker compose -f "$COMPOSE_FILE" logs -f "$service"
        else
            docker-compose -f "$COMPOSE_FILE" logs -f "$service"
        fi
    else
        print_status "Showing all logs"
        if docker compose version &> /dev/null; then
            docker compose -f "$COMPOSE_FILE" logs -f
        else
            docker-compose -f "$COMPOSE_FILE" logs -f
        fi
    fi
}

# Stop all services
stop() {
    print_header "Stopping Services"

    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" down
    else
        docker-compose -f "$COMPOSE_FILE" down
    fi

    print_success "All services stopped"
}

# Restart a service
restart_service() {
    local service="$1"

    if [ -z "$service" ]; then
        print_error "Usage: ./deploy-rtnm.sh restart <service-name>"
        exit 1
    fi

    print_status "Restarting: $service"

    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" restart "$service"
    else
        docker-compose -f "$COMPOSE_FILE" restart "$service"
    fi

    sleep 2
    health_check
}

# Scale a service
scale() {
    local service="$1"
    local replicas="${2:-1}"

    if [ -z "$service" ] || [ -z "$replicas" ]; then
        print_error "Usage: ./deploy-rtnm.sh scale <service> <replicas>"
        exit 1
    fi

    print_status "Scaling $service to $replicas replicas..."

    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" up -d --scale "$service=$replicas"
    else
        docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$replicas"
    fi
}

# Show help
show_help() {
    echo -e "${BOLD}RTNM Deployment Commands:${NC}\n"
    echo "  ./deploy-rtnm.sh deploy     - Deploy entire ecosystem"
    echo "  ./deploy-rtnm.sh health    - Run health checks"
    echo "  ./deploy-rtnm.sh status    - Show service status"
    echo "  ./deploy-rtnm.sh logs       - Show all logs"
    echo "  ./deploy-rtnm.sh logs <svc> - Show service logs"
    echo "  ./deploy-rtnm.sh stop        - Stop all services"
    echo "  ./deploy-rtnm.sh restart    - Restart a service"
    echo "  ./deploy-rtnm.sh scale      - Scale a service"
    echo ""
    echo -e "${BOLD}Order Flow:${NC}"
    echo "  Intent (4154) → Negotiation (4191) → Decision (4240)"
    echo "       ↓"
    echo "  Bridge (4155) → Event Bus (4075)"
    echo "       ↓"
    echo "  Orchestrator (4260) → Order (4006) → Delivery (4009)"
    echo "       ↓"
    echo "  Merchant (4005) + KDS (4014)"
}

# Main
case "${1:-}" in
    deploy|up)
        check_prerequisites
        setup_network
        deploy
        health_check
        ;;
    health|check)
        health_check
        ;;
    status|ps)
        status
        ;;
    logs)
        logs "$2"
        ;;
    stop|down)
        stop
        ;;
    restart)
        restart_service "$2"
        ;;
    scale)
        scale "$2" "$3"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac