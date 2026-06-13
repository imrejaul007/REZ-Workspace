#!/bin/bash
# =============================================================================
# CorpPerks - Deploy Workforce Intelligence
# SUTAR OS + SALAR OS
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks"

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           CorpPerks - Workforce Intelligence Platform            ║"
echo "║ SUTAR OS + SALAR OS Deployment v3.0                      ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status() { echo -e "${CYAN}[CorpPerks]${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_header() { echo -e "\n${PURPLE}═══ $1 ═══${NC}\n"; }

# SUTAR OS Services (4240-4254)
declare -A SUTAR_SERVICES=(
    ["sutar-os"]="4240"
    ["sutar-workflow-engine"]="4241"
    ["sutar-task-orchestrator"]="4242"
    ["sutar-resource-allocator"]="4243"
    ["sutar-compliance-monitor"]="4244"
    ["sutar-performance-tracker"]="4245"
    ["sutar-integration-hub"]="4246"
    ["sutar-analytics-engine"]="4247"
    ["sutar-notification-center"]="4248"
    ["sutar-document-manager"]="4249"
    ["sutar-audit-logger"]="4250"
    ["sutar-security-layer"]="4251"
    ["sutar-api-gateway"]="4252"
    ["sutar-data-connector"]="4253"
    ["sutar-event-processor"]="4254"
)

# SALAR OS Services (4710-4720)
declare -A SALAR_SERVICES=(
    ["salar-os"]="4710"
    ["salar-human-twin"]="4711"
    ["salar-agent-twin"]="4712"
    ["salar-hybrid-team"]="4713"
    ["salar-org-twin"]="4714"
    ["salar-capability-registry"]="4715"
    ["salar-llm-connector"]="4716"
    ["salar-vector-store"]="4717"
    ["salar-ml-pipeline"]="4718"
    ["salar-payment-service"]="4719"
    ["salar-data-connectors"]="4720"
)

deploy_sutar_os() {
    print_header "Deploying SUTAR OS"

    local sutar_path="${BASE_DIR}/sutar-os"

    if [ ! -d "$sutar_path" ]; then
        print_error "SUTAR OS not found at $sutar_path"
        return 1
    fi

    # Deploy main SUTAR OS
    print_status "Deploying SUTAR OS main service..."
    local container="corpperks-sutar-os"

    docker stop "$container" 2>/dev/null || true
    docker rm "$container" 2>/dev/null || true

    if [ -f "${sutar_path}/Dockerfile" ]; then
        docker build -t "corpperks/sutar-os" "$sutar_path" &>/dev/null || {
            print_error "SUTAR OS build failed"
            return 1
        }

        docker run -d \
            --name "$container" \
            --restart unless-stopped \
            -p "4240:4240" \
            --network rtnm-network \
            -e PORT="4240" \
            -e SERVICE_NAME="sutar-os" \
            "corpperks/sutar-os" &>/dev/null
    else
        (cd "$sutar_path" && PORT=4240 npm start &>/dev/null &)
    fi

    print_success "SUTAR OS deployed"
}

deploy_salar_os() {
    print_header "Deploying SALAR OS"

    local salar_path="${BASE_DIR}/salar-os"

    if [ ! -d "$salar_path" ]; then
        print_error "SALAR OS not found at $salar_path"
        return 1
    fi

    # Deploy main SALAR OS
    print_status "Deploying SALAR OS main service..."
    local container="corpperks-salar-os"

    docker stop "$container" 2>/dev/null || true
    docker rm "$container" 2>/dev/null || true

    if [ -f "${salar_path}/Dockerfile" ]; then
        docker build -t "corpperks/salar-os" "$salar_path"&>/dev/null || {
            print_error "SALAR OS build failed"
            return 1
        }

        docker run -d \
            --name "$container" \
            --restart unless-stopped \
            -p "4710:4710" \
            --network rtnm-network \
            -e PORT="4710" \
            -e SERVICE_NAME="salar-os" \
            "corpperks/salar-os" &>/dev/null
    else
        (cd "$salar_path" && PORT=4710 npm start &>/dev/null &)
    fi

    print_success "SALAR OS deployed"

    # Initialize capabilities
    print_status "Initializing capabilities..."
    sleep 2
    curl -sf -X POST "http://localhost:4710/capabilities/init" &>/dev/null && \
        print_success "Capabilities initialized" || \
        print_status "Capabilities init skipped (may already be initialized)"

    # Seed agents
    print_status "Seeding agent twins..."
    curl -sf -X POST "http://localhost:4710/seed/agents" &>/dev/null && \
        print_success "Agent twins seeded" || \
        print_status "Agent seeding skipped"
}

health_check() {
    print_header "Health Checks"

    echo -e "${BLUE}SUTAR OS Services:${NC}"
    for service in "${!SUTAR_SERVICES[@]}"; do
        local port="${SUTAR_SERVICES[$service]}"
        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            print_success "$service (port $port)"
        else
            print_error "$service (port $port)"
        fi
    done

    echo -e "\n${BLUE}SALAR OS Services:${NC}"
    for service in "${!SALAR_SERVICES[@]}"; do
        local port="${SALAR_SERVICES[$service]}"
        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            print_success "$service (port $port)"
        else
            print_error "$service (port $port)"
        fi
    done
}

show_status() {
    print_header "CorpPerks Status"

    printf "%-25s %6s  %s\n" "Service" "Port" "Status"
    echo "─────────────────────────────────────────"

    for service in "${!SUTAR_SERVICES[@]}"; do
        local port="${SUTAR_SERVICES[$service]}"
        local status="❌"
        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            status="${GREEN}✓${NC}"
        else
            status="${RED}✗${NC}"
        fi
        printf "%-25s %6s   %b\n" "$service" "$port" "$status"
    done

    for service in "${!SALAR_SERVICES[@]}"; do
        local port="${SALAR_SERVICES[$service]}"
        local status="❌"
        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            status="${GREEN}✓${NC}"
        else
            status="${RED}✗${NC}"
        fi
        printf "%-25s %6s   %b\n" "$service" "$port" "$status"
    done
}

stop_all() {
    print_header "Stopping All Services"

    for service in "${!SUTAR_SERVICES[@]}" "${!SALAR_SERVICES[@]}"; do
        local container="corpperks-${service}"
        docker stop "$container" 2>/dev/null || true
        docker rm "$container" 2>/dev/null || true
    done

    print_success "All services stopped"
}

case "$1" in
    deploy|all)
        deploy_sutar_os
        deploy_salar_os
        health_check
        show_status
        ;;
    sutar)
        deploy_sutar_os
        health_check
        ;;
    salar)
        deploy_salar_os
        health_check
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    stop)
        stop_all
        ;;
    *)
        echo -e "\n${PURPLE}CorpPerks Deployment Commands:${NC}"
        echo "  ./deploy-corpperks.sh deploy   - Deploy all CorpPerks services"
        echo "  ./deploy-corpperks.sh sutar    - Deploy SUTAR OS only"
        echo "  ./deploy-corpperks.sh salar - Deploy SALAR OS only"
        echo "  ./deploy-corpperks.sh status - Show service status"
        echo "  ./deploy-corpperks.sh health - Run health checks"
        echo "  ./deploy-corpperks.sh stop     - Stop all services"
        ;;
esac