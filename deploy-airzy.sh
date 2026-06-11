#!/bin/bash
# =============================================================================
# Airzy - Deploy Travel Ecosystem
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App/KHAIRMOVE/airzy"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    Airzy Travel Ecosystem                        ║"
echo "║                   Deployment Script v3.0                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status() { echo -e "${CYAN}[Airzy]${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Service definitions
declare -A SERVICES=(
    ["airzy-api"]="4500"
    ["airzy-booking"]="4501"
    ["airzy-inventory"]="4502"
    ["airzy-payment"]="4503"
    ["airzy-gate-navigation"]="4510"
    ["airzy-dining-extension"]="4511"
    ["airzy-visa-service"]="4512"
    ["airzy-document-vault"]="4513"
    ["airzy-social-extension"]="4514"
    ["airzy-travel-finance"]="4515"
)

check_service() {
    local service=$1
    local path="${BASE_DIR}/${service}"

    if [ ! -d "$path" ]; then
        print_error "Service not found: $service"
        return 1
    fi

    # Check for Dockerfile or package.json
    if [ ! -f "$path/Dockerfile" ] && [ ! -f "$path/package.json" ]; then
        print_error "No deployment config in: $service"
        return 1
    fi

    return 0
}

deploy_service() {
    local service=$1
    local port=$2
    local path="${BASE_DIR}/${service}"

    print_status "Deploying $service (port $port)..."

    local container="airzy-${service}"

    # Stop existing
    docker stop "$container" 2>/dev/null || true
    docker rm "$container" 2>/dev/null || true

    # Build
    if [ -f "${path}/Dockerfile" ]; then
        docker build -t "airzy/${service}" "$path" &>/dev/null || {
            print_error "Build failed: $service"
            return 1
        }
    fi

    # Run
    if [ -f "${path}/Dockerfile" ]; then
        docker run -d \
            --name "$container" \
            --restart unless-stopped \
            -p "${port}:${port}" \
            --network rtnm-network \
            -e PORT="$port" \
            -e SERVICE="$service" \
            "airzy/${service}" &>/dev/null
    else
        # Use node directly
        (cd "$path" && PORT="$port" npm start &>/dev/null &)
        print_status "Started $service via npm"
    fi

    sleep 1
    print_success "Deployed: $service"
}

health_check() {
    local service=$1
    local port=$2

    if curl -sf "http://localhost:${port}/health" &>/dev/null; then
        print_success "$service is healthy"
        return 0
    else
        print_error "$service is not responding"
        return 1
    fi
}

show_status() {
    echo -e "\n${BLUE}═══ Airzy Services Status ═══${NC}\n"
    printf "%-25s %6s  %s\n" "Service" "Port" "Status"
    echo "─────────────────────────────────────────"

    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        local status="❌"

        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            status="${GREEN}✓ Healthy${NC}"
        else
            status="${RED}✗ Down${NC}"
        fi

        printf "%-25s %6s  %b\n" "$service" "$port" "$status"
    done
}

case "$1" in
    deploy|all)
        echo -e "\n${YELLOW}Deploying Airzy Travel Ecosystem...${NC}\n"

        for service in "${!SERVICES[@]}"; do
            if check_service "$service"; then
                deploy_service "$service" "${SERVICES[$service]}"
            fi
        done

        echo -e "\n${YELLOW}Running health checks...${NC}"
        for service in "${!SERVICES[@]}"; do
            health_check "$service" "${SERVICES[$service]}"
        done

        show_status
        ;;
    status)
        show_status
        ;;
    stop)
        echo -e "\n${YELLOW}Stopping Airzy services...${NC}"
        for service in "${!SERVICES[@]}"; do
            docker stop "airzy-${service}" 2>/dev/null || true
            docker rm "airzy-${service}" 2>/dev/null || true
        done
        print_success "All services stopped"
        ;;
    restart)
        service=$2
        port=${SERVICES[$service]}
        if [ -n "$port" ]; then
            docker restart "airzy-${service}"
            sleep 2
            health_check "$service" "$port"
        else
            print_error "Unknown service: $service"
        fi
        ;;
    logs)
        service=${2:-airzy-api}
        docker logs --tail 50 "airzy-${service}" 2>&1
        ;;
    *)
        echo -e "\n${BLUE}Airzy Deployment Commands:${NC}"
        echo "  ./deploy-airzy.sh deploy     - Deploy all Airzy services"
        echo "  ./deploy-airzy.sh status    - Show service status"
        echo "  ./deploy-airzy.sh stop      - Stop all services"
        echo "  ./deploy-airzy.sh restart   - Restart a service"
        echo "  ./deploy-airzy.sh logs      - Show logs"
        ;;
esac