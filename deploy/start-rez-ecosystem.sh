#!/bin/bash
# REZ Ecosystem - Startup Script
# RTNM Digital - Complete Stack Launcher
#
# Usage:
#   ./start-rez-ecosystem.sh all         # Start everything
#   ./start-rez-ecosystem.sh infrastructure # Start MongoDB, Redis only
#   ./start-rez-ecosystem.sh hojai        # Start HOJAI AI
#   ./start-rez-ecosystem.sh rabtul       # Start RABTUL services
#   ./start-rez-ecosystem.sh companies     # Start company services
#   ./start-rez-ecosystem.sh status       # Check service health
#   ./start-rez-ecosystem.sh stop          # Stop all services
#   ./start-rez-ecosystem.sh logs [service] # View logs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="REZ-Ecosystem-docker-compose.yml"
ENV_FILE=".env"

# ============================================
# HELPER FUNCTIONS
# ============================================

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
}

create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Creating .env file with default values..."
        cat > "$ENV_FILE" << 'EOF'
# REZ Ecosystem Environment Variables

# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=rez_secure_password_2026

# Redis
REDIS_PASSWORD=rez_secure_password_2026

# Security
JWT_SECRET=rez_jwt_secret_key_change_in_production
INTERNAL_SERVICE_TOKEN=rez_internal_token_change_in_production
CORS_ORIGINS=*

# Payment (Razorpay)
RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# LiveKit
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret

# Exotel
EXOTEL_API_KEY=your_exotel_key
EXOTEL_API_TOKEN=your_exotel_token
EOF
        log_success ".env file created. Please update with your credentials."
    fi
}

# ============================================
# START COMMANDS
# ============================================

start_all() {
    log_info "Starting complete REZ Ecosystem..."
    create_env_file

    docker compose -f "$COMPOSE_FILE" up -d

    log_success "REZ Ecosystem started!"
    show_status
}

start_infrastructure() {
    log_info "Starting infrastructure (MongoDB, Redis)..."
    docker compose -f "$COMPOSE_FILE" up -d mongodb redis

    log_success "Infrastructure services started."
}

start_hojai() {
    log_info "Starting HOJAI AI services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        mongodb redis \
        hojai-gateway hojai-governance hojai-event-bus hojai-memory \
        hojai-intelligence hojai-agents hojai-workflows hojai-comms \
        hojai-hyperlocal hojai-data \
        genie-memory genie-relation genie-briefing \
        commerce-ai merchant-ai customer-ai marketing-ai financial-ai \
        sutar-gateway sutar-twin-os sutar-memory sutar-agent-id \
        sutar-supplier sutar-trust sutar-discovery sutar-intent \
        sutar-decision sutar-simulation sutar-goal sutar-network \
        sutar-marketplace sutar-economy sutar-contract sutar-negotiation \
        voice-os voice-agents cosmic-twin

    log_success "HOJAI AI services started!"
}

start_rabtul() {
    log_info "Starting RABTUL services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        mongodb redis \
        rez-auth-service rez-payment-service rez-wallet-service \
        rez-order-service rez-catalog-service rez-booking-service \
        rez-notifications-service rez-event-bus \
        rez-intent-predictor rez-predictive-engine rez-memory-layer \
        rez-signal-aggregator rez-fraud-agent rez-recommendation-engine \
        rez-unified-hub rez-event-bus-bridge

    log_success "RABTUL services started!"
}

start_companies() {
    log_info "Starting company services..."
    docker compose -f "$COMPOSE_FILE" up -d \
        stayown-api risnaestate-api nexha-api \
        rez-consumer-api corpperks-api risacare-api khaimove-api \
        rez-merchant-api adbazaar-api lawgens-api ridza-api

    log_success "Company services started!"
}

# ============================================
# STATUS & HEALTH CHECKS
# ============================================

show_status() {
    echo ""
    echo "========================================"
    echo "         REZ ECOSYSTEM STATUS"
    echo "========================================"
    echo ""

    echo "📊 Infrastructure:"
    check_service "rez-mongodb" "MongoDB" || true
    check_service "rez-redis" "Redis" || true

    echo ""
    echo "🔐 RABTUL Services:"
    check_service "rez-auth-service" "Auth Service" || true
    check_service "rez-payment-service" "Payment Service" || true
    check_service "rez-wallet-service" "Wallet Service" || true
    check_service "rez-event-bus" "Event Bus" || true
    check_service "rez-unified-hub" "Unified Hub" || true

    echo ""
    echo "🤖 HOJAI AI:"
    check_service "hojai-gateway" "Gateway (4500)" || true
    check_service "hojai-memory" "Memory (4520)" || true
    check_service "hojai-intelligence" "Intelligence (4530)" || true
    check_service "hojai-agents" "Agents (4550)" || true
    check_service "genie-memory" "Genie Memory (4703)" || true
    check_service "genie-briefing" "Genie Briefing (4706)" || true

    echo ""
    echo "🧠 SUTAR OS:"
    check_service "sutar-gateway" "Gateway (4140)" || true
    check_service "sutar-twin-os" "TwinOS (4142)" || true
    check_service "sutar-intent" "Intent Bus (4154)" || true
    check_service "sutar-decision" "Decision Engine (4240)" || true

    echo ""
    echo "🏢 Companies:"
    check_service "stayown-api" "StayOwn (4801)" || true
    check_service "risnaestate-api" "RisnaEstate (4901)" || true
    check_service "nexha-api" "Nexha (5001)" || true
    check_service "rez-consumer-api" "REZ Consumer (4200)" || true
    check_service "corpperks-api" "CorpPerks (4720)" || true
    check_service "risacare-api" "RisaCare (4800)" || true
    check_service "khaimove-api" "KHAIRMOVE (4600)" || true
    check_service "rez-merchant-api" "REZ Merchant (4100)" || true
    check_service "adbazaar-api" "AdBazaar (4300)" || true
    check_service "lawgens-api" "LawGens (5100)" || true
    check_service "ridza-api" "RIDZA (5200)" || true

    echo ""
    echo "========================================"
}

check_service() {
    local container=$1
    local name=$2

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "  ✅ ${GREEN}${name}${NC}"
        return 0
    else
        echo -e "  ❌ ${RED}${name}${NC}"
        return 1
    fi
}

show_ports() {
    echo ""
    echo "========================================"
    echo "         SERVICE PORTS"
    echo "========================================"
    echo ""

    echo "🏛️  HOJAI AI Core (4500-4590):"
    echo "    4500 - Gateway"
    echo "    4501 - Governance"
    echo "    4510 - Event Bus"
    echo "    4520 - Memory"
    echo "    4530 - Intelligence"
    echo "    4550 - Agents"
    echo "    4560 - Workflows"
    echo "    4570 - Communications"
    echo "    4580 - Hyperlocal"
    echo "    4590 - Data"

    echo ""
    echo "🧬  HOJAI Genie (4703-4707):"
    echo "    4703 - Memory"
    echo "    4704 - Relationship"
    echo "    4706 - Briefing"

    echo ""
    echo "💼  HOJAI Intelligence (4750-4754):"
    echo "    4750 - Commerce AI"
    echo "    4751 - Merchant AI"
    echo "    4752 - Customer AI"
    echo "    4753 - Marketing AI"
    echo "    4754 - Financial AI"

    echo ""
    echo "🚀  SUTAR OS (4140-4254):"
    echo "    4140 - Gateway"
    echo "    4142 - TwinOS"
    echo "    4143 - Memory Bridge"
    echo "    4154 - Intent Bus"
    echo "    4240 - Decision Engine"
    echo "    4241 - Simulation"
    echo "    4242 - Goal OS"
    echo "    4250 - Marketplace"

    echo ""
    echo "💰  RABTUL Services (4001-4025):"
    echo "    4001 - Payment"
    echo "    4002 - Auth"
    echo "    4004 - Wallet"
    echo "    4025 - Event Bus"

    echo ""
    echo "🏢  Company Services:"
    echo "    4090 - Event Bus Bridge"
    echo "    4100 - REZ Merchant"
    echo "    4200 - REZ Consumer"
    echo "    4300 - AdBazaar"
    echo "    4600 - Unified Hub / KHAIRMOVE"
    echo "    4720 - CorpPerks"
    echo "    4800 - RisaCare"
    echo "    4801 - StayOwn"
    echo "    4901 - RisnaEstate"
    echo "    5001 - Nexha"
    echo "    5100 - LawGens"
    echo "    5200 - RIDZA"

    echo ""
    echo "========================================"
}

# ============================================
# STOP & CLEANUP
# ============================================

stop_all() {
    log_info "Stopping REZ Ecosystem..."
    docker compose -f "$COMPOSE_FILE" down
    log_success "All services stopped."
}

clean_all() {
    log_warning "This will remove all containers, networks, and volumes."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker compose -f "$COMPOSE_FILE" down -v
        log_success "All cleanup complete."
    else
        log_info "Cleanup cancelled."
    fi
}

# ============================================
# LOGS
# ============================================

show_logs() {
    local service=${1:-""}

    if [ -z "$service" ]; then
        log_info "Showing logs for all services (Ctrl+C to exit)..."
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        log_info "Showing logs for ${service}..."
        docker compose -f "$COMPOSE_FILE" logs -f "$service"
    fi
}

# ============================================
# MAIN
# ============================================

main() {
    check_docker

    case "${1:-}" in
        all)
            start_all
            ;;
        infrastructure)
            start_infrastructure
            ;;
        hojai)
            start_hojai
            ;;
        rabtul)
            start_rabtul
            ;;
        companies)
            start_companies
            ;;
        status)
            show_status
            ;;
        ports)
            show_ports
            ;;
        stop)
            stop_all
            ;;
        clean)
            clean_all
            ;;
        logs)
            show_logs "$2"
            ;;
        help|--help|-h)
            echo ""
            echo "REZ Ecosystem Startup Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all           - Start complete ecosystem"
            echo "  infrastructure - Start MongoDB, Redis only"
            echo "  hojai         - Start HOJAI AI services"
            echo "  rabtul        - Start RABTUL services"
            echo "  companies     - Start company services"
            echo "  status        - Show service status"
            echo "  ports         - Show all service ports"
            echo "  stop          - Stop all services"
            echo "  clean         - Stop and remove volumes"
            echo "  logs [service] - View logs"
            echo ""
            ;;
        *)
            log_error "Unknown command: ${1:-}"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

main "$@"