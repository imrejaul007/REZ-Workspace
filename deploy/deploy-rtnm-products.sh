#!/bin/bash
# =============================================================================
# RTNM Products - Deploy All Products
# RIDZA, RisaCare, Nexha, AdBazaar, StayOwn, REZ Consumer, REZ Trust
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                 RTNM Products Deployment                         ║"
echo "║  RIDZA | RisaCare | Nexha | AdBazaar | StayOwn | REZ  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status() { echo -e "${CYAN}[Products]${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Product definitions
declare -A PRODUCTS=(
    ["ridza-financeos"]="5000:ridza-islamic-finance"
    ["risacare-platform"]="4800:risacare-platform"
    ["nexha-commerce"]="5300:Nexha"
    ["adbazaar-advertising"]="5400:adbazaar-platform"
    ["stayown-property"]="5100:stayown-platform"
    ["rez-consumer"]="5500:rez-consumer-app"
    ["rez-trust-os"]="5600:rez-trust-os"
    ["risnaestate"]="4900:RisnaEstate"
)

deploy_product() {
    local product=$1
    local port=$2
    local path="${BASE_DIR}/$3"

    print_status "Deploying $product (port $port)..."

    if [ ! -d "$path" ]; then
        print_warning "Not found: $path"
        return 1
    fi

    local container="rtnm-${product}"

    # Stop existing
    docker stop "$container" 2>/dev/null || true
    docker rm "$container" 2>/dev/null || true

    # Build
    if [ -f "${path}/Dockerfile" ]; then
        docker build -t "rtnm/${product}" "$path" &>/dev/null || {
            print_error "Build failed: $product"
            return 1
        }

        # Run
        docker run -d \
            --name "$container" \
            --restart unless-stopped \
            -p "${port}:${port}" \
            --network rtnm-network \
            -e PORT="$port" \
            -e SERVICE_NAME="$product" \
            "rtnm/${product}" &>/dev/null
    else
        # Try npm start
        if [ -f "${path}/package.json" ]; then
            (cd "$path" && PORT="$port" npm start &>/dev/null &)
        else
            print_warning "No deployment config for $product"
            return 1
        fi
    fi

    sleep 1
    print_success "Deployed: $product"
}

health_check() {
    print_status "Running health checks..."

    for product in "${!PRODUCTS[@]}"; do
        IFS=':' read -r port path <<< "${PRODUCTS[$product]}"

        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            print_success "$product (port $port)"
        else
            print_error "$product (port $port) - not responding"
        fi
    done
}

show_status() {
    echo -e "\n${BLUE}═══ RTNM Products Status ═══${NC}\n"
    printf "%-25s %6s  %s\n" "Product" "Port" "Status"
    echo "─────────────────────────────────────────"

    for product in "${!PRODUCTS[@]}"; do
        IFS=':' read -r port path <<< "${PRODUCTS[$product]}"

        local status="❌"
        if curl -sf "http://localhost:${port}/health" &>/dev/null; then
            status="${GREEN}✓ Healthy${NC}"
        else
            status="${RED}✗ Down${NC}"
        fi

        printf "%-25s %6s  %b\n" "$product" "$port" "$status"
    done
}

case "$1" in
    deploy|all)
        print_status "Deploying all products..."
        for product in "${!PRODUCTS[@]}"; do
            IFS=':' read -r port path <<< "${PRODUCTS[$product]}"
            deploy_product "$product" "$port" "$path"
        done
        health_check
        show_status
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    stop)
        print_status "Stopping all products..."
        for product in "${!PRODUCTS[@]}"; do
            docker stop "rtnm-${product}" 2>/dev/null || true
            docker rm "rtnm-${product}" 2>/dev/null || true
        done
        print_success "All products stopped"
        ;;
    *)
        echo -e "\n${BLUE}Product Deployment Commands:${NC}"
        echo "  ./deploy-rtnm-products.sh deploy  - Deploy all products"
        echo "  ./deploy-rtnm-products.sh status  - Show product status"
        echo "  ./deploy-rtnm-products.sh health  - Run health checks"
        echo "  ./deploy-rtnm-products.sh stop    - Stop all products"
        ;;
esac