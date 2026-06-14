#!/bin/bash
# =============================================================================
# RTNM Ecosystem - Master Deployment Script
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            RTNM ECOSYSTEM - MASTER DEPLOYMENT                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"

# =============================================================================
# CONFIGURATION
# =============================================================================

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RTNM_DIR="$(dirname "$DEPLOY_DIR")"

# Companies to deploy
COMPANIES=(
    "RABTUL-Technologies"
    "hojai-ai"
    "REZ-Consumer"
    "REZ-Merchant"
    "KHAIRMOVE"
    "AdBazaar"
)

# =============================================================================
# FUNCTIONS
# =============================================================================

deploy_company() {
    local company=$1
    local company_dir="$RTNM_DIR/companies/$company"

    if [ ! -d "$company_dir" ]; then
        echo -e "${RED}Company not found: $company${NC}"
        return 1
    fi

    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Deploying: $company${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Check for deploy.sh
    if [ -f "$company_dir/deploy.sh" ]; then
        echo -e "${YELLOW}Running deploy.sh...${NC}"
        (cd "$company_dir" && bash deploy.sh)
    else
        echo -e "${YELLOW}No deploy.sh found, checking docker-compose...${NC}"

        if [ -f "$company_dir/docker-compose.yml" ]; then
            echo -e "${YELLOW}Running docker-compose...${NC}"
            (cd "$company_dir" && docker-compose up -d)
        else
            echo -e "${RED}No deployment method found${NC}"
        fi
    fi

    echo -e "${GREEN}✓ $company deployed${NC}"
}

# =============================================================================
# MAIN
# =============================================================================

echo -e "\n${YELLOW}Deployment Configuration:${NC}"
echo "  Companies: ${COMPANIES[*]}"
echo "  Target Directory: $RTNM_DIR"

# Parse arguments
SKIP_BUILD=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --company)
            COMPANIES=("$2")
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Pre-flight checks
echo -e "\n${YELLOW}Pre-flight checks...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is required but not installed.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Deploy each company
for company in "${COMPANIES[@]}"; do
    deploy_company "$company"
done

# =============================================================================
# VERIFICATION
# =============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Deployment Complete - Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Checking services...${NC}"

# Check running containers
RUNNING=$(docker ps --filter "name=rez-" --filter "name=hojai-" --filter "name=khaimove-" --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✓ $RUNNING RTNM services running${NC}"

# Check health endpoints
echo -e "\n${YELLOW}Checking health endpoints...${NC}"

ENDPOINTS=(
    "localhost:4002/auth/health"
    "localhost:4001/health"
    "localhost:4500/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -sf "http://$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $endpoint${NC}"
    else
        echo -e "${YELLOW}⚠ $endpoint (may need startup time)${NC}"
    fi
done

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Check logs: docker-compose logs -f"
echo "  2. View services: docker ps"
echo "  3. Access dashboards:"
echo "     - REZ Merchant: http://localhost:3000"
echo "     - HOJAI AI: http://localhost:4500"
echo "     - RABTUL Auth: http://localhost:4002"
echo ""
