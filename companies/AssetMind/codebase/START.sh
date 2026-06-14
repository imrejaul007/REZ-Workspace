#!/bin/bash
# AssetMind - Start All Services
# Enhanced version with Docker Compose support

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AssetMind Platform Starter          ║${NC}"
echo -e "${BLUE}║     Financial Intelligence Platform     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Options
MODE=${1:-docker}  # docker, local, or python

show_help() {
    echo "Usage: ./START.sh [MODE]"
    echo ""
    echo "Modes:"
    echo "  docker  - Start with Docker Compose (default)"
    echo "  local  - Start services locally without Docker"
    echo "  python - Start Python services only"
    echo ""
    echo "Examples:"
    echo "  ./START.sh docker  # Start with Docker"
    echo "  ./START.sh local  # Start locally"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if command -v docker >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Docker"
    else
        echo -e "  ${RED}✗${NC} Docker (not found)"
    fi

    if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Docker Compose"
    else
        echo -e "  ${RED}✗${NC} Docker Compose (not found)"
    fi

    if command -v python3 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Python 3"
    else
        echo -e "  ${RED}✗${NC} Python 3 (not found)"
    fi

    if command -v node >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Node.js"
    else
        echo -e "  ${YELLOW}○${NC} Node.js (optional, for API Gateway)"
    fi

    echo ""
}

# Create .env from example
setup_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env from template...${NC}"
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${YELLOW}Please review and edit .env file with your settings${NC}"
        fi
    fi
}

# Start with Docker Compose
start_docker() {
    echo -e "${YELLOW}Starting with Docker Compose...${NC}"
    echo ""

    # Build and start
    docker-compose build --parallel
    docker-compose up -d

    echo ""
    echo -e "${GREEN}Waiting for services to be ready...${NC}"
    sleep 15

    # Show status
    echo ""
    docker-compose ps
}

# Start locally
start_local() {
    echo -e "${YELLOW}Starting services locally...${NC}"
    echo ""

    # Core Python services
    local services=(
        "assetmind-twin-engine:5002:Twin Engine"
        "assetmind-market-twin:5003:Market Twin"
        "assetmind-portfolio-twin:5004:Portfolio Twin"
        "assetmind-investor-twin:5005:Investor Twin"
        "assetmind-data:5010:Market Data"
        "assetmind-news:5012:News Service"
        "assetmind-intelligence:5050:Intelligence"
        "assetmind-agents:5090:Agents"
    )

    for svc in "${services[@]}"; do
        IFS=':' read -r name port desc <<< "$svc"
        if [ -d "$name" ]; then
            echo -e "  ${GREEN}→${NC} Starting $desc ($port)"
            cd "$name"
            nohup python main.py > /dev/null 2>&1 &
            cd ..
        fi
    done

    # API Gateway
    if [ -d "assetmind-api-gateway" ]; then
        echo -e "  ${GREEN}→${NC} Starting API Gateway (5260)"
        cd assetmind-api-gateway
        npm install --silent 2>/dev/null
        nohup npm start > /dev/null 2>&1 &
        cd ..
    fi

    echo ""
}

# Health check
health_check() {
    echo ""
    echo -e "${YELLOW}Running health checks...${NC}"
    echo ""

    local services=(
        "http://localhost:5260/health:API Gateway"
        "http://localhost:5002/health:Twin Engine"
        "http://localhost:5010/health:Market Data"
    )

    for svc in "${services[@]}"; do
        IFS=':' read -r url name <<< "$svc"
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name"
        else
            echo -e "  ${RED}✗${NC} $name (not responding)"
        fi
    done
}

# Main
case "$MODE" in
    -h|--help)
        show_help
        exit 0
        ;;
    docker)
        check_prerequisites
        setup_env
        start_docker
        health_check
        ;;
    local)
        check_prerequisites
        setup_env
        start_local
        sleep 5
        health_check
        ;;
    python)
        start_local
        ;;
    *)
        echo -e "${RED}Unknown mode: $MODE${NC}"
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}AssetMind is ready!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  - API Gateway:    http://localhost:5260"
echo "  - Swagger Docs:   http://localhost:5260/docs"
echo "  - Frontend:      http://localhost:3000"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  - PostgreSQL:    localhost:5432"
echo "  - Redis:        localhost:6379"
echo "  - Neo4j:       localhost:7474"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  docker-compose logs -f     # View logs"
echo "  docker-compose ps          # Check status"
echo "  docker-compose down        # Stop services"
echo ""
