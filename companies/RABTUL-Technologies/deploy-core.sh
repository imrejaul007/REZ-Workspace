#!/bin/bash

# =============================================================================
# RABTUL Core Services Deployment Script
# =============================================================================
# Deploys all RABTUL core services with health checks and error reporting
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# =============================================================================
# Configuration - Core Services
# =============================================================================

# Array of services (name:port:description)
SERVICES=(
    "rez-auth-service:4002:Authentication, JWT, OTP, OAuth"
    "rez-payment-service:4001:Payments, Razorpay, Webhooks"
    "rez-wallet-service:4004:Wallet, Coins, Balance"
    "rez-notifications-service:4011:Push, SMS, Email, WhatsApp"
    "rez-order-service:4006:Order lifecycle, FSM"
    "rez-catalog-service:4007:Products, Inventory, Search"
)

# Statistics
TOTAL_SERVICES=0
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${CYAN}${BOLD}============================================================${NC}"
    echo -e "${CYAN}${BOLD}  RABTUL Core Services Deployment${NC}"
    echo -e "${CYAN}${BOLD}============================================================${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}------------------------------------------------------------${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}------------------------------------------------------------${NC}"
}

print_service_header() {
    local name="$1"
    local port="$2"
    local desc="$3"
    echo -e "\n${BOLD}[$name]${NC}"
    echo -e "  Port: ${YELLOW}$port${NC}"
    echo -e "  Desc: $desc"
    echo -e "  Path: ${CYAN}$SCRIPT_DIR/$name${NC}"
}

check_directory() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        echo -e "  ${RED}✗ Directory not found: $dir${NC}"
        return 1
    fi
    echo -e "  ${GREEN}✓ Directory exists${NC}"
    return 0
}

check_node_modules() {
    local dir="$1"
    if [[ ! -d "$dir/node_modules" ]]; then
        echo -e "  ${YELLOW}⚠ node_modules missing - will install${NC}"
        return 1
    fi
    echo -e "  ${GREEN}✓ node_modules present${NC}"
    return 0
}

install_dependencies() {
    local dir="$1"
    local name="$2"

    echo -e "  ${YELLOW}→ Running npm install...${NC}"

    if npm install --prefix "$dir" 2>&1; then
        echo -e "  ${GREEN}✓ Dependencies installed${NC}"
        return 0
    else
        echo -e "  ${RED}✗ npm install failed${NC}"
        return 1
    fi
}

build_service() {
    local dir="$1"
    local name="$2"

    echo -e "  ${YELLOW}→ Building with TypeScript...${NC}"

    # Capture both stdout and stderr - must cd to service directory
    local build_output
    local build_status=0

    build_output=$(cd "$dir" && npm run build 2>&1) || build_status=$?

    if [[ $build_status -eq 0 ]]; then
        # Check for TypeScript errors
        if echo "$build_output" | grep -q "error TS"; then
            echo -e "  ${RED}✗ TypeScript compilation errors found:${NC}"
            echo "$build_output" | grep "error TS" | while IFS= read -r line; do
                echo -e "      ${RED}$line${NC}"
            done
            return 1
        fi

        # Check if dist directory was created
        if [[ ! -d "$dir/dist" ]]; then
            echo -e "  ${RED}✗ dist directory not created${NC}"
            return 1
        fi

        echo -e "  ${GREEN}✓ Build successful${NC}"

        # Show build stats if available
        if echo "$build_output" | grep -q "compiled successfully"; then
            local stats
            stats=$(echo "$build_output" | grep "compiled successfully" | head -1)
            echo -e "      $stats"
        fi
        return 0
    else
        echo -e "  ${RED}✗ Build failed${NC}"
        echo "$build_output" | head -20
        return 1
    fi
}

verify_compilation() {
    local dir="$1"
    local name="$2"

    echo -e "  ${YELLOW}→ Verifying compilation...${NC}"

    # Check for dist directory
    if [[ ! -d "$dir/dist" ]]; then
        echo -e "  ${RED}✗ dist directory not found${NC}"
        return 1
    fi

    # Check for index.js (entry point)
    if [[ ! -f "$dir/dist/index.js" ]]; then
        echo -e "  ${RED}✗ dist/index.js not found${NC}"
        return 1
    fi

    # Count compiled files
    local js_files
    local ts_files
    js_files=$(find "$dir/dist" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
    ts_files=$(find "$dir/src" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')

    echo -e "  ${GREEN}✓ Compilation verified${NC}"
    echo -e "      Source files: $ts_files TypeScript"
    echo -e "      Compiled files: $js_files JavaScript"

    return 0
}

# =============================================================================
# Main Deployment Logic
# =============================================================================

deploy_service() {
    local service_entry="$1"
    local service_name="${service_entry%%:*}"
    local remaining="${service_entry#*:}"
    local port="${remaining%%:*}"
    local description="${remaining##*:}"

    TOTAL_SERVICES=$((TOTAL_SERVICES + 1))

    print_service_header "$service_name" "$port" "$description"

    local service_dir="$SCRIPT_DIR/$service_name"

    # Step 1: Check directory exists
    if ! check_directory "$service_dir"; then
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi

    # Step 2: Check node_modules
    if ! check_node_modules "$service_dir"; then
        if ! install_dependencies "$service_dir" "$service_name"; then
            FAIL_COUNT=$((FAIL_COUNT + 1))
            return 1
        fi
    else
        echo -e "  ${CYAN}  Skipping npm install (node_modules present)${NC}"
    fi

    # Step 3: Build service
    if ! build_service "$service_dir" "$service_name"; then
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi

    # Step 4: Verify compilation
    if ! verify_compilation "$service_dir" "$service_name"; then
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi

    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo -e "  ${GREEN}✓ Service ready for deployment${NC}"
    return 0
}

# =============================================================================
# Status Report
# =============================================================================

print_summary() {
    print_section "Deployment Summary"

    echo -e "  Total Services: $TOTAL_SERVICES"
    echo -e "  ${GREEN}Successful: $SUCCESS_COUNT${NC}"

    if [[ $FAIL_COUNT -gt 0 ]]; then
        echo -e "  ${RED}Failed: $FAIL_COUNT${NC}"
    else
        echo -e "  ${GREEN}Failed: $FAIL_COUNT${NC}"
    fi

    if [[ $SKIP_COUNT -gt 0 ]]; then
        echo -e "  ${YELLOW}Skipped: $SKIP_COUNT${NC}"
    fi

    echo ""
}

print_service_table() {
    print_section "Service Status"

    printf "  ${BOLD}%-30s %-10s %-12s %s${NC}\n" "Service" "Port" "Status" "Action"
    echo "  ----------------------------------------------------------------"

    for service_entry in "${SERVICES[@]}"; do
        local service_name="${service_entry%%:*}"
        local remaining="${service_entry#*:}"
        local port="${remaining%%:*}"

        printf "  %-30s %-10s " "$service_name" "$port"

        if [[ -d "$SCRIPT_DIR/$service_name" ]]; then
            if [[ -d "$SCRIPT_DIR/$service_name/dist" ]]; then
                echo -e "${GREEN}✓ Built${NC}"
            else
                echo -e "${YELLOW}○ Pending${NC}"
            fi
        else
            echo -e "${RED}✗ Missing${NC}"
        fi
    done
}

# =============================================================================
# Interactive Mode
# =============================================================================

deploy_interactive() {
    echo -e "\n${BOLD}Deploying all core services...${NC}\n"

    for service_entry in "${SERVICES[@]}"; do
        deploy_service "$service_entry" || true
    done
}

deploy_single() {
    local target="$1"
    local found=0

    for service_entry in "${SERVICES[@]}"; do
        local service_name="${service_entry%%:*}"
        if [[ "$service_name" == "$target" ]]; then
            found=1
            deploy_service "$service_entry"
            return $?
        fi
    done

    if [[ $found -eq 0 ]]; then
        echo -e "${RED}Unknown service: $target${NC}"
        echo -e "\nAvailable services:"
        for service_entry in "${SERVICES[@]}"; do
            local service_name="${service_entry%%:*}"
            local remaining="${service_entry#*:}"
            local port="${remaining%%:*}"
            echo -e "  - $service_name (port: $port)"
        done
        exit 1
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================

main() {
    print_header

    case "${1:-all}" in
        all)
            deploy_interactive
            ;;
        list)
            echo -e "${BOLD}Core Services:${NC}\n"
            for service_entry in "${SERVICES[@]}"; do
                local service_name="${service_entry%%:*}"
                local remaining="${service_entry#*:}"
                local port="${remaining%%:*}"
                local description="${remaining##*:}"
                echo -e "  ${CYAN}$service_name${NC}"
                echo -e "    Port: $port"
                echo -e "    Description: $description"
                echo ""
            done
            exit 0
            ;;
        status)
            print_service_table
            exit 0
            ;;
        install)
            # Just install dependencies for all services
            for service_entry in "${SERVICES[@]}"; do
                local service_name="${service_entry%%:*}"
                local remaining="${service_entry#*:}"
                local port="${remaining%%:*}"
                local description="${remaining##*:}"

                echo -e "\n${BOLD}[$service_name]${NC}"

                if [[ ! -d "$SCRIPT_DIR/$service_name" ]]; then
                    echo -e "  ${RED}✗ Directory not found${NC}"
                    continue
                fi

                install_dependencies "$SCRIPT_DIR/$service_name" "$service_name"
            done
            exit 0
            ;;
        *)
            if [[ -d "$SCRIPT_DIR/$1" ]]; then
                deploy_single "$1"
            else
                echo -e "${RED}Unknown option: $1${NC}"
                echo -e "\nUsage: $0 [all|list|status|install|<service-name>]"
                echo ""
                echo "  all           Deploy all core services (default)"
                echo "  list          List all core services"
                echo "  status        Show build status for all services"
                echo "  install       Install dependencies only"
                echo "  <service>     Deploy a single service (e.g., rez-auth-service)"
                exit 1
            fi
            ;;
    esac

    print_service_table
    print_summary

    if [[ $FAIL_COUNT -gt 0 ]]; then
        echo -e "${RED}Deployment completed with errors. Please review failed services.${NC}"
        exit 1
    else
        echo -e "${GREEN}All services deployed successfully!${NC}"
        exit 0
    fi
}

main "$@"
