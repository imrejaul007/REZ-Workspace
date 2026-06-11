#!/bin/bash
# =============================================================================
# RTNM Ecosystem - Master Deployment Script
# Version: 6.0 | Date: June 11, 2026
# Deploys the entire RTNM Digital ecosystem using docker-compose
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
DEPLOY_MODE="${1:-menu}"
SKIP_BUILD="${SKIP_BUILD:-false}"
PARALLEL="${PARALLEL:-true}"
VERBOSE="${VERBOSE:-false}"
NETWORK="rtnm-network"

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Docker Compose Files
COMPOSE_MAIN="docker-compose.yml"
COMPOSE_HOJAI="docker-compose.hojai.yml"
COMPOSE_REZ="docker-compose.rez.yml"
COMPOSE_SUTAR="docker-compose.sutar-integration.yml"
COMPOSE_PRODUCTS="docker-compose.products.yml"
COMPOSE_CORPPERKS="docker-compose.corpperks.yml"
COMPOSE_AIRZY="docker-compose.airzy.yml"
COMPOSE_GENIE="docker-compose.genie.yml"
COMPOSE_COMPLIANCE="docker-compose.compliance.yml"
COMPOSE_STAGING="docker-compose.staging.yml"
COMPOSE_PROD="docker-compose.prod.yml"
COMPOSE_NEW_SERVICES="docker-compose-new-services.yml"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║          RTNM Digital - Ecosystem Deployment System              ║"
    echo "║                      Version 6.0                                  ║"
    echo "║                      June 11, 2026                               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BOLD}${PURPLE}═══ $1 ═══${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${CYAN}--- $1 ---${NC}\n"
}

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing=()
    local versions=""

    # Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker: $docker_version"
    else
        missing+=("docker")
    fi

    # Docker Compose
    if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
        local compose_version=$(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker Compose: $compose_version"
    else
        missing+=("docker-compose")
    fi

    # Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js: $(node --version)"
    else
        missing+=("node")
    fi

    # NPM
    if command -v npm &> /dev/null; then
        print_success "NPM: $(npm --version)"
    else
        missing+=("npm")
    fi

    # Git
    if command -v git &> /dev/null; then
        print_success "Git: $(git --version | grep -oP '\d+\.\d+\.\d+')"
    else
        missing+=("git")
    fi

    # Curl
    if command -v curl &> /dev/null; then
        print_success "curl: available"
    else
        missing+=("curl")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing prerequisites: ${missing[*]}"
        echo ""
        echo "Please install missing tools:"
        for tool in "${missing[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "Installation hints:"
        echo "  macOS: brew install ${missing[*]}"
        echo "  Linux: sudo apt-get install ${missing[*]}"
        exit 1
    fi

    print_success "All prerequisites satisfied!"
}

# =============================================================================
# NETWORK MANAGEMENT
# =============================================================================

setup_network() {
    print_header "Setting Up Docker Network"

    if docker network inspect "$NETWORK" &> /dev/null; then
        print_warning "Network '$NETWORK' already exists - using existing network"
    else
        print_status "Creating network: $NETWORK"
        docker network create --driver bridge "$NETWORK"
        print_success "Network created successfully"
    fi

    echo ""
    docker network inspect "$NETWORK" --format '{{range .IPAM.Config}}Subnet: {{.Subnet}}{{end}}' 2>/dev/null || true
}

cleanup_network() {
    print_status "Cleaning up network: $NETWORK"
    docker network rm "$NETWORK" 2>/dev/null || print_warning "Network not found or still in use"
}

# =============================================================================
# DOCKER COMPOSE HELPERS
# =============================================================================

get_compose_command() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

compose_up() {
    local compose_file=$1
    local services=$2
    local timeout="${3:-300}"

    if [ ! -f "$compose_file" ]; then
        print_warning "Compose file not found: $compose_file"
        return 1
    fi

    local compose_cmd=$(get_compose_command)

    print_status "Deploying from: $compose_file"
    if [ -n "$services" ]; then
        $compose_cmd -f "$compose_file" up -d --timeout "$timeout" "$services" 2>&1
    else
        $compose_cmd -f "$compose_file" up -d --timeout "$timeout" 2>&1
    fi

    return $?
}

compose_down() {
    local compose_file=$1
    local timeout="${2:-300}"

    if [ ! -f "$compose_file" ]; then
        return 1
    fi

    local compose_cmd=$(get_compose_command)
    print_status "Stopping services from: $compose_file"
    $compose_cmd -f "$compose_file" down --timeout "$timeout" 2>&1 || true
}

compose_logs() {
    local compose_file=$1
    local service=$2
    local lines="${3:-100}"

    local compose_cmd=$(get_compose_command)
    if [ -n "$service" ]; then
        $compose_cmd -f "$compose_file" logs --tail="$lines" "$service" 2>&1
    else
        $compose_cmd -f "$compose_file" logs --tail="$lines" 2>&1
    fi
}

# =============================================================================
# DEPLOYMENT PHASES
# =============================================================================

deploy_infrastructure() {
    print_header "Phase 1: Deploying Infrastructure"

    print_section "Starting MongoDB, Redis, and RabbitMQ"

    # Create infrastructure compose file if needed
    local infra_file="$BASE_DIR/docker-compose.infra.yml"

    cat > "$infra_file" << 'EOF'
version: '3.8'
services:
  # MongoDB
  mongodb:
    image: mongo:7.0
    container_name: rtnm-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - rtnm-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: rtnm-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass password
    networks:
      - rtnm-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "password", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: rtnm-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - rtnm-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  rtnm-network:
    external: true

volumes:
  mongodb_data:
  redis_data:
  rabbitmq_data:
EOF

    compose_up "$infra_file" ""
    print_success "Infrastructure deployed"
}

deploy_hojai_core() {
    print_header "Phase 2: Deploying HOJAI Core"

    if [ ! -f "$BASE_DIR/$COMPOSE_HOJAI" ]; then
        print_error "HOJAI Core compose file not found: $COMPOSE_HOJAI"
        return 1
    fi

    print_section "Deploying 10 HOJAI Core services"
    print_status "Services: api-gateway, governance, event-bus, memory, intelligence,"
    print_status "         agents, workflows, communications, hyperlocal, data"

    compose_up "$BASE_DIR/$COMPOSE_HOJAI" ""
    print_success "HOJAI Core deployed"
}

deploy_rez_intelligence() {
    print_header "Phase 3: Deploying REZ Intelligence"

    if [ ! -f "$BASE_DIR/$COMPOSE_REZ" ]; then
        print_error "REZ Intelligence compose file not found: $COMPOSE_REZ"
        return 1
    fi

    print_section "Deploying REZ Intelligence services"
    print_status "Services: intent-predictor, predictive-engine, memory-layer,"
    print_status "         signal-aggregator, voiceos-unified, rez-ai-voice"

    compose_up "$BASE_DIR/$COMPOSE_REZ" ""
    print_success "REZ Intelligence deployed"
}

deploy_sutar_integration() {
    print_header "Phase 4: Deploying SUTAR Integration"

    if [ ! -f "$BASE_DIR/$COMPOSE_SUTAR" ]; then
        print_error "SUTAR Integration compose file not found: $COMPOSE_SUTAR"
        return 1
    fi

    print_section "Deploying SUTAR Integration services"
    print_status "Services: sutar-intent-bus, sutar-rez-bridge, rez-event-bus,"
    print_status "         order-flow-orchestrator"

    compose_up "$BASE_DIR/$COMPOSE_SUTAR" ""
    print_success "SUTAR Integration deployed"
}

deploy_new_services() {
    print_header "Phase 5: Deploying New Services"

    if [ ! -f "$BASE_DIR/$COMPOSE_NEW_SERVICES" ]; then
        print_error "New Services compose file not found: $COMPOSE_NEW_SERVICES"
        return 1
    fi

    print_section "Deploying 8 new microservices"
    print_status "Services: trust-network-gateway, agent-wallet, agent-identity,"
    print_status "         agent-marketplace, developer-platform, arabic-ai,"
    print_status "         islamic-finance, remittance"

    compose_up "$BASE_DIR/$COMPOSE_NEW_SERVICES" ""
    print_success "New Services deployed"
}

deploy_products() {
    print_header "Phase 6: Deploying RTNM Products"

    if [ ! -f "$BASE_DIR/$COMPOSE_PRODUCTS" ]; then
        print_error "Products compose file not found: $COMPOSE_PRODUCTS"
        return 1
    fi

    print_section "Deploying Product platforms"
    print_status "Services: ridza, risacare, nexha, adbazaar, stayown, risnaestate"

    compose_up "$BASE_DIR/$COMPOSE_PRODUCTS" ""
    print_success "Products deployed"
}

deploy_corpperks() {
    print_header "Phase 7: Deploying CorpPerks"

    if [ ! -f "$BASE_DIR/$COMPOSE_CORPPERKS" ]; then
        print_error "CorpPerks compose file not found: $COMPOSE_CORPPERKS"
        return 1
    fi

    print_section "Deploying CorpPerks services"
    print_status "Services: sutar-os, salar-os, people-os, talent-ai, corp-id"

    compose_up "$BASE_DIR/$COMPOSE_CORPPERKS" ""
    print_success "CorpPerks deployed"
}

deploy_airzy() {
    print_header "Phase 8: Deploying Airzy"

    if [ ! -f "$BASE_DIR/$COMPOSE_AIRZY" ]; then
        print_error "Airzy compose file not found: $COMPOSE_AIRZY"
        return 1
    fi

    print_section "Deploying Airzy Travel Ecosystem"
    print_status "Services: airzy-api, airzy-booking, airzy-inventory, airzy-payment,"
    print_status "         airzy-navigation, airzy-dining, airzy-visa, airzy-document,"
    print_status "         airzy-social, airzy-finance"

    compose_up "$BASE_DIR/$COMPOSE_AIRZY" ""
    print_success "Airzy deployed"
}

deploy_genie() {
    print_header "Phase 9: Deploying GENIE"

    if [ ! -f "$BASE_DIR/$COMPOSE_GENIE" ]; then
        print_error "GENIE compose file not found: $COMPOSE_GENIE"
        return 1
    fi

    print_section "Deploying GENIE Personal AI"
    print_status "Services: genie-memory, genie-relationship, genie-briefing,"
    print_status "         genie-sync-service, obsidian-service, notion-service,"
    print_status "         slack-service, telegram-service"

    compose_up "$BASE_DIR/$COMPOSE_GENIE" ""
    print_success "GENIE deployed"
}

deploy_compliance() {
    print_header "Phase 10: Deploying Compliance Services"

    if [ ! -f "$BASE_DIR/$COMPOSE_COMPLIANCE" ]; then
        print_error "Compliance compose file not found: $COMPOSE_COMPLIANCE"
        return 1
    fi

    print_section "Deploying Compliance & Governance"
    print_status "Services: communication-compliance, policy-engine, enforcement-gateway,"
    print_status "         llm-compliance, agent-governance, audit-trail"

    compose_up "$BASE_DIR/$COMPOSE_COMPLIANCE" ""
    print_success "Compliance Services deployed"
}

# =============================================================================
# HEALTH CHECKS
# =============================================================================

health_check_all() {
    print_header "Running Health Checks"

    local services=(
        "4500:api-gateway:HOJAI Core"
        "4501:governance:HOJAI Core"
        "4510:event-bus:HOJAI Core"
        "4520:memory:HOJAI Core"
        "4530:intelligence:HOJAI Core"
        "4550:agents:HOJAI Core"
        "4560:workflows:HOJAI Core"
        "4570:communications:HOJAI Core"
        "4580:hyperlocal:HOJAI Core"
        "4590:data:HOJAI Core"
        "4018:intent-predictor:REZ Intelligence"
        "4123:predictive-engine:REZ Intelligence"
        "4201:memory-layer:REZ Intelligence"
        "4142:signal-aggregator:REZ Intelligence"
        "4850:voiceos-unified:REZ Intelligence"
        "4112:rez-ai-voice:REZ Intelligence"
        "4154:sutar-intent-bus:SUTAR Integration"
        "4155:sutar-rez-bridge:SUTAR Integration"
        "4075:rez-event-bus:SUTAR Integration"
        "4260:order-flow-orchestrator:SUTAR Integration"
        "4190:trust-network-gateway:New Services"
        "4150:agent-wallet:New Services"
        "4160:agent-identity:New Services"
        "5000:ridza:Products"
        "4800:risacare:Products"
        "5300:nexha:Products"
        "5400:adbazaar:Products"
        "5100:stayown:Products"
        "4900:risnaestate:Products"
        "4240:sutar-os:CorpPerks"
        "4710:salar-os:CorpPerks"
        "4711:people-os:CorpPerks"
        "4712:talent-ai:CorpPerks"
        "4500:airzy-api:Airzy"
        "4510:airzy-navigation:Airzy"
        "4703:genie-memory:GENIE"
        "4704:genie-relationship:GENIE"
        "4706:genie-briefing:GENIE"
        "4180:communication-compliance:Compliance"
    )

    local total=0
    local healthy=0
    local unhealthy=0
    local failed_services=()

    echo -e "${BOLD}Port${NC}   ${BOLD}Service${NC}                  ${BOLD}Category${NC}         ${BOLD}Status${NC}"
    echo "──────────────────────────────────────────────────────────────────"

    for entry in "${services[@]}"; do
        IFS=':' read -r port service category <<< "$entry"
        total=$((total + 1))

        if curl -sf "http://localhost:$port/health" &> /dev/null; then
            echo -e "${GREEN}$port${NC}   $service$(printf '%*s' $((25-${#service})) '') $category$(printf '%*s' $((15-${#category})) '') ${GREEN}HEALTHY${NC}"
            healthy=$((healthy + 1))
        elif curl -sf "http://localhost:$port/" &> /dev/null; then
            echo -e "${YELLOW}$port${NC}   $service$(printf '%*s' $((25-${#service})) '') $category$(printf '%*s' $((15-${#category})) '') ${YELLOW}RESPONDING${NC}"
            healthy=$((healthy + 1))
        else
            echo -e "${RED}$port${NC}   $service$(printf '%*s' $((25-${#service})) '') $category$(printf '%*s' $((15-${#category})) '') ${RED}DOWN${NC}"
            unhealthy=$((unhealthy + 1))
            failed_services+=("$service:$port")
        fi
    done

    echo ""
    print_header "Health Summary"
    echo -e "  Total services checked: ${BOLD}$total${NC}"
    echo -e "  Healthy:               ${GREEN}$healthy${NC}"
    echo -e "  Unhealthy:             ${RED}$unhealthy${NC}"

    if [ $unhealthy -gt 0 ]; then
        echo ""
        print_warning "Some services are not responding:"
        for svc in "${failed_services[@]}"; do
            IFS=':' read -r name prt <<< "$svc"
            echo "  - $name (port $prt)"
        done
    fi

    return 0
}

# =============================================================================
# STATUS COMMANDS
# =============================================================================

show_status() {
    print_header "RTNM Ecosystem - Deployment Status"

    echo -e "${BOLD}Docker Containers:${NC}"
    local containers=$(docker ps --filter "network=$NETWORK" --format "{{.Names}}\t{{.Status}}" 2>/dev/null | sort)

    if [ -z "$containers" ]; then
        print_warning "No containers running on $NETWORK"
    else
        echo "$containers" | while read name status; do
            if [[ "$status" == *"Up"* ]]; then
                echo -e "  ${GREEN}●${NC} $name"
            else
                echo -e "  ${RED}●${NC} $name ($status)"
            fi
        done
    fi

    echo ""
    echo -e "${BOLD}Network Info:${NC}"
    docker network inspect "$NETWORK" --format '{{range .Containers}}  {{.Name}}: {{.IPv4Address}}{{end}}' 2>/dev/null || print_warning "Network not found"
}

show_logs() {
    local service=$1
    local lines="${2:-100}"

    print_header "Logs for: $service"

    local container_id=$(docker ps -aq --filter "name=$service" 2>/dev/null | head -1)

    if [ -n "$container_id" ]; then
        docker logs --tail="$lines" "$container_id" 2>&1
    else
        print_error "Container not found: $service"
        echo ""
        echo "Available containers:"
        docker ps --filter "network=$NETWORK" --format "{{.Names}}" 2>/dev/null
    fi
}

# =============================================================================
# STOP/START COMMANDS
# =============================================================================

stop_all() {
    print_header "Stopping All Services"

    local compose_files=(
        "$COMPOSE_HOJAI"
        "$COMPOSE_REZ"
        "$COMPOSE_SUTAR"
        "$COMPOSE_NEW_SERVICES"
        "$COMPOSE_PRODUCTS"
        "$COMPOSE_CORPPERKS"
        "$COMPOSE_AIRZY"
        "$COMPOSE_GENIE"
        "$COMPOSE_COMPLIANCE"
    )

    for compose_file in "${compose_files[@]}"; do
        if [ -f "$BASE_DIR/$compose_file" ]; then
            compose_down "$BASE_DIR/$compose_file" 60
        fi
    done

    print_success "All services stopped"
}

restart_service() {
    local service=$1

    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        return 1
    fi

    print_status "Restarting: $service"
    docker restart "$service" 2>/dev/null || print_error "Container not found: $service"
}

# =============================================================================
# INTERACTIVE MENU
# =============================================================================

show_menu() {
    print_banner

    echo -e "${BOLD}Available Deployment Options:${NC}"
    echo ""
    echo -e "${CYAN}FULL DEPLOYMENT:${NC}"
    echo -e "  ${GREEN}all${NC}           - Deploy entire ecosystem (all phases)"
    echo ""
    echo -e "${CYAN}PHASE-BASED DEPLOYMENT:${NC}"
    echo -e "  ${GREEN}infra${NC}         - Phase 1: Infrastructure (MongoDB, Redis, RabbitMQ)"
    echo -e "  ${GREEN}core${NC}          - Phase 2: HOJAI Core (10 services)"
    echo -e "  ${GREEN}rez${NC}           - Phase 3: REZ Intelligence"
    echo -e "  ${GREEN}sutar${NC}         - Phase 4: SUTAR Integration"
    echo -e "  ${GREEN}new${NC}           - Phase 5: New Services (8 microservices)"
    echo -e "  ${GREEN}products${NC}      - Phase 6: RTNM Products"
    echo -e "  ${GREEN}corpperks${NC}     - Phase 7: CorpPerks"
    echo -e "  ${GREEN}airzy${NC}         - Phase 8: Airzy"
    echo -e "  ${GREEN}genie${NC}         - Phase 9: GENIE"
    echo -e "  ${GREEN}compliance${NC}    - Phase 10: Compliance Services"
    echo ""
    echo -e "${CYAN}COMMANDS:${NC}"
    echo -e "  ${GREEN}status${NC}        - Show deployment status"
    echo -e "  ${GREEN}health${NC}         - Run health checks"
    echo -e "  ${GREEN}logs <svc>${NC}    - Show logs for a service"
    echo -e "  ${GREEN}stop${NC}           - Stop all services"
    echo -e "  ${GREEN}restart <svc>${NC}  - Restart a service"
    echo -e "  ${GREEN}network${NC}        - Setup Docker network"
    echo -e "  ${GREEN}menu${NC}           - Show this menu"
    echo -e "  ${GREEN}help${NC}           - Show help"
    echo ""
    echo -e "${CYAN}EXAMPLES:${NC}"
    echo "  ./deploy-all.sh all                    # Deploy everything"
    echo "  ./deploy-all.sh core                   # Deploy HOJAI Core only"
    echo "  ./deploy-all.sh infra core rez         # Deploy infra + core + rez"
    echo "  ./deploy-all.sh health                 # Run health checks"
    echo "  ./deploy-all.sh logs api-gateway       # View logs"
    echo ""
    echo -e "${CYAN}ENVIRONMENT VARIABLES:${NC}"
    echo "  SKIP_BUILD=true   - Skip Docker image builds"
    echo "  PARALLEL=false    - Deploy sequentially"
}

show_help() {
    echo -e "${BOLD}RTNM Ecosystem Deployment Script${NC}"
    echo ""
    echo "This script deploys the entire RTNM Digital ecosystem using docker-compose."
    echo ""
    echo -e "${BOLD}Prerequisites:${NC}"
    echo "  - Docker and Docker Compose"
    echo "  - Node.js and NPM"
    echo "  - Git"
    echo ""
    echo -e "${BOLD}Network:${NC}"
    echo "  All services are deployed on the 'rtnm-network' Docker network."
    echo ""
    echo -e "${BOLD}Compose Files:${NC}"
    echo "  - docker-compose.yml (main)"
    echo "  - docker-compose.hojai.yml"
    echo "  - docker-compose.rez.yml"
    echo "  - docker-compose.sutar-integration.yml"
    echo "  - docker-compose.new-services.yml"
    echo "  - docker-compose.products.yml"
    echo "  - docker-compose.corpperks.yml"
    echo "  - docker-compose.airzy.yml"
    echo "  - docker-compose.genie.yml"
    echo "  - docker-compose.compliance.yml"
    echo ""
    echo -e "${BOLD}Troubleshooting:${NC}"
    echo "  1. Check Docker is running: docker ps"
    echo "  2. View logs: ./deploy-all.sh logs <service>"
    echo "  3. Check health: ./deploy-all.sh health"
    echo "  4. Restart service: ./deploy-all.sh restart <service>"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    # Change to script directory
    cd "$BASE_DIR" || exit 1

    case "$1" in
        all)
            print_banner
            check_prerequisites
            setup_network
            deploy_infrastructure
            deploy_hojai_core
            deploy_rez_intelligence
            deploy_sutar_integration
            deploy_new_services
            deploy_products
            deploy_corpperks
            deploy_airzy
            deploy_genie
            deploy_compliance
            health_check_all
            print_header "Deployment Complete!"
            echo -e "${GREEN}✓${NC} RTNM Ecosystem fully deployed!"
            echo ""
            echo "Next steps:"
            echo "  - Check status: ./deploy-all.sh status"
            echo "  - Run health: ./deploy-all.sh health"
            echo "  - View logs: ./deploy-all.sh logs <service>"
            ;;

        infra)
            check_prerequisites
            setup_network
            deploy_infrastructure
            print_success "Infrastructure deployed"
            ;;

        core)
            check_prerequisites
            setup_network
            deploy_hojai_core
            health_check_all
            ;;

        rez)
            check_prerequisites
            setup_network
            deploy_rez_intelligence
            health_check_all
            ;;

        sutar)
            check_prerequisites
            setup_network
            deploy_sutar_integration
            health_check_all
            ;;

        new)
            check_prerequisites
            setup_network
            deploy_new_services
            health_check_all
            ;;

        products)
            check_prerequisites
            setup_network
            deploy_products
            health_check_all
            ;;

        corpperks)
            check_prerequisites
            setup_network
            deploy_corpperks
            health_check_all
            ;;

        airzy)
            check_prerequisites
            setup_network
            deploy_airzy
            health_check_all
            ;;

        genie)
            check_prerequisites
            setup_network
            deploy_genie
            health_check_all
            ;;

        compliance)
            check_prerequisites
            setup_network
            deploy_compliance
            health_check_all
            ;;

        status)
            show_status
            ;;

        health)
            health_check_all
            ;;

        logs)
            show_logs "$2" "$3"
            ;;

        stop)
            stop_all
            ;;

        restart)
            restart_service "$2"
            ;;

        network)
            setup_network
            ;;

        menu|help|--help|-h)
            show_menu
            ;;

        *)
            show_menu
            ;;
    esac
}

main "$@"