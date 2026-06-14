#!/bin/bash
# start-all-services.sh - Start all Invisible Hotel services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            THE INVISIBLE HOTEL - Service Starter                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        exit 1
    fi
}

check_tool node
check_tool npm

# Services to start
INFRASTRUCTURE_SERVICES=(
    "redis:6379"
    "rabbitmq:5672"
)

HOTEL_SERVICES=(
    "ai-front-desk:3800"
    "minibar-service:3810"
    "hotel-restaurant-booking:3811"
    "hotel-spa-booking:3812"
    "room-controls:3814"
    "parking-service:3815"
    "lost-found:3816"
    "upsell-engine:3817"
    "loyalty-system:3818"
    "review-manager:3819"
    "feedback-survey:3820"
    "concierge-desk:3821"
    "smart-lock-service:3825"
    "predictive-housekeeping:3826"
    "zero-checkout-automation:3827"
    "pre-arrival-service:3828"
    "hotel-os-integration:3899"
    "hojai-memory-hotel:4720"
    "voice-hotel-agent:4870"
)

show_help() {
    echo "Usage: ./start-all-services.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -d, --docker            Start using Docker Compose"
    echo "  -i, --infrastructure    Start infrastructure services only"
    echo "  -s, --services          Start hotel services only"
    echo "  -a, --all               Start everything (default)"
    echo "  -c, --check             Check service health"
    echo "  -k, --kill              Stop all services"
    echo "  -l, --logs              Show service logs"
    echo ""
    echo "Examples:"
    echo "  ./start-all-services.sh -d           # Start with Docker"
    echo "  ./start-all-services.sh -i           # Infrastructure only"
    echo "  ./start-all-services.sh -c           # Check health"
}

# Check if service is running
is_running() {
    local service=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Start service in background
start_service() {
    local service=$1
    local port=$2

    if is_running $service $port; then
        echo -e "${YELLOW}⚠ ${service} already running on port ${port}${NC}"
        return 0
    fi

    if [ ! -d "$service" ]; then
        echo -e "${RED}✗ Service directory not found: ${service}${NC}"
        return 1
    fi

    echo -e "${BLUE}→ Starting ${service}...${NC}"

    cd "$service"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}✗ No package.json in ${service}${NC}"
        cd ..
        return 1
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "  ${YELLOW}Installing dependencies...${NC}"
        npm install --silent 2>/dev/null || npm install
    fi

    # Start in background
    npm run dev > /tmp/${service}.log 2>&1 &
    local pid=$!

    cd ..

    # Wait for service to start
    local retries=30
    while [ $retries -gt 0 ]; do
        if is_running $service $port; then
            echo -e "${GREEN}✓ ${service} started (PID: ${pid})${NC}"
            return 0
        fi
        sleep 1
        ((retries--))
    done

    echo -e "${RED}✗ ${service} failed to start - check /tmp/${service}.log${NC}"
    return 1
}

# Check service health
check_health() {
    local service=$1
    local port=$2

    if ! is_running $service $port; then
        echo -e "${RED}✗ ${service} (${port}) - DOWN${NC}"
        return 1
    fi

    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ ${service} (${port}) - HEALTHY${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ ${service} (${port}) - RESPONDING (status: ${response})${NC}"
        return 0
    fi
}

# Start with Docker
start_docker() {
    echo -e "${BLUE}Starting with Docker Compose...${NC}"
    docker-compose -f docker-compose.invisible-hotel.yml up -d
    echo -e "${GREEN}Docker services started!${NC}"
}

# Kill all services
kill_services() {
    echo -e "${BLUE}Stopping all services...${NC}"

    # Kill node processes in hotel directories
    for dir in */; do
        if [ -f "${dir}package.json" ]; then
            pkill -f "node.*${dir}src" 2>/dev/null || true
        fi
    done

    # Docker compose down
    if [ -f "docker-compose.invisible-hotel.yml" ]; then
        docker-compose -f docker-compose.invisible-hotel.yml down 2>/dev/null || true
    fi

    echo -e "${GREEN}All services stopped${NC}"
}

# Show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        tail -f /tmp/*.log 2>/dev/null || echo "No logs found"
    else
        tail -f /tmp/${service}.log 2>/dev/null || echo "Log not found: ${service}"
    fi
}

# Parse arguments
DOCKER_MODE=false
MODE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--docker)
            DOCKER_MODE=true
            shift
            ;;
        -i|--infrastructure)
            MODE="infrastructure"
            shift
            ;;
        -s|--services)
            MODE="services"
            shift
            ;;
        -c|--check)
            MODE="check"
            shift
            ;;
        -k|--kill)
            MODE="kill"
            shift
            ;;
        -l|--logs)
            MODE="logs"
            shift
            ;;
        -a|--all)
            MODE="all"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Execute based on mode
case $MODE in
    kill)
        kill_services
        ;;
    check)
        echo -e "${BLUE}Checking service health...${NC}"
        for entry in "${HOTEL_SERVICES[@]}"; do
            IFS=':' read -r service port <<< "$entry"
            check_health $service $port
        done
        ;;
    logs)
        show_logs $1
        ;;
    infrastructure)
        echo -e "${BLUE}Starting infrastructure services...${NC}"
        # These would typically be started via Docker
        echo -e "${YELLOW}Start infrastructure with: docker-compose up -d redis rabbitmq mosquitto${NC}"
        ;;
    services)
        echo -e "${BLUE}Starting hotel services...${NC}"
        for entry in "${HOTEL_SERVICES[@]}"; do
            IFS=':' read -r service port <<< "$entry"
            start_service $service $port
        done
        ;;
    all)
        if [ "$DOCKER_MODE" = true ]; then
            start_docker
        else
            echo -e "${BLUE}Starting all services in development mode...${NC}"
            for entry in "${HOTEL_SERVICES[@]}"; do
                IFS=':' read -r service port <<< "$entry"
                start_service $service $port
            done
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║              All services started!                              ║${NC}"
            echo -e "${GREEN}║                                                                  ║${NC}"
            echo -e "${GREEN}║  Dashboard: http://localhost:3899                              ║${NC}"
            echo -e "${GREEN}║  AI Concierge: http://localhost:3800                           ║${NC}"
            echo -e "${GREEN}║                                                                  ║${NC}"
            echo -e "${GREEN}║  View logs: ./start-all-services.sh -l                        ║${NC}"
            echo -e "${GREEN}║  Check health: ./start-all-services.sh -c                    ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
        fi
        ;;
esac