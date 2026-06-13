#!/bin/bash
# =============================================================================
# MASTER Consolidation Script - ALL Industries
# Consolidates all industry services into unified structure
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

REZ_DIR="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant"
INDUSTRY_OS="$REZ_DIR/industry-os"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} MASTER INDUSTRY CONSOLIDATION${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to copy service
copy_service() {
    local src="$1"
    local dest="$2"

    if [ -d "$src" ]; then
        mkdir -p "$dest"
        # Copy files excluding node_modules
        find "$src" -maxdepth 1 ! -name 'node_modules' ! -name '.git' ! -name 'dist' ! -name 'build' -exec cp -r {} "$dest/" \; 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} $(basename "$src") → $(basename "$dest")"
    else
        echo -e "  ${YELLOW}⚠${NC} Not found: $(basename "$src")"
    fi
}

# =============================================================================
# RESTAURANT OS (Ports 4100-4149)
# =============================================================================
echo -e "\n${BLUE}[1/6] Restaurant OS${NC}"

mkdir -p "$INDUSTRY_OS/restaurant-os/"{core,pos,kitchen,orders,delivery,analytics,integrations}

# Core
copy_service "$INDUSTRY_OS/rez-restaurant-service" "$INDUSTRY_OS/restaurant-os/core/rez-restaurant"
copy_service "$INDUSTRY_OS/REZ-restaurant-app" "$INDUSTRY_OS/restaurant-os/core/rez-restaurant-app"
copy_service "$INDUSTRY_OS/rez-ai-restaurant" "$INDUSTRY_OS/restaurant-os/core/rez-ai-restaurant"

# POS
copy_service "$INDUSTRY_OS/rez-restaurant-pos-service" "$INDUSTRY_OS/restaurant-os/pos/rez-restaurant-pos"

# Kitchen
mkdir -p "$INDUSTRY_OS/restaurant-os/kitchen/rez-kds"
copy_service "$REZ_DIR/rez-kds-service" "$INDUSTRY_OS/restaurant-os/kitchen/rez-kds"

# Orders & Delivery
copy_service "$INDUSTRY_OS/rez-restaurant-reservations" "$INDUSTRY_OS/restaurant-os/orders/rez-reservations"
mkdir -p "$INDUSTRY_OS/restaurant-os/delivery/rez-delivery"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*delivery*" -exec cp -r {} "$INDUSTRY_OS/restaurant-os/delivery/" \; 2>/dev/null || true

# Analytics
copy_service "$INDUSTRY_OS/rez-restaurant-analytics-service" "$INDUSTRY_OS/restaurant-os/analytics/rez-analytics"

# Integrations
copy_service "$INDUSTRY_OS/REZ-restaurant-os-integration" "$INDUSTRY_OS/restaurant-os/integrations/rez-integration"
copy_service "$INDUSTRY_OS/rez-restaurant-loyalty-service" "$INDUSTRY_OS/restaurant-os/integrations/rez-loyalty"
copy_service "$INDUSTRY_OS/rez-restaurant-scheduling-service" "$INDUSTRY_OS/restaurant-os/integrations/rez-scheduling"
copy_service "$INDUSTRY_OS/rez-restaurant-inventory-service" "$INDUSTRY_OS/restaurant-os/integrations/rez-inventory"

# restauranthub monorepo
if [ -d "$INDUSTRY_OS/restauranthub" ]; then
    mkdir -p "$INDUSTRY_OS/restaurant-os/core/restauranthub"
    cp -r "$INDUSTRY_OS/restauranthub/"* "$INDUSTRY_OS/restaurant-os/core/restauranthub/" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} restauranthub consolidated"
fi

# =============================================================================
# SALON OS (Ports 4150-4199)
# =============================================================================
echo -e "\n${BLUE}[2/6] Salon OS${NC}"

mkdir -p "$INDUSTRY_OS/salon-os/"{core,pos,crm,appointments,membership,analytics}

# Core
mkdir -p "$INDUSTRY_OS/salon-os/core/rez-salon"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*salon*" ! -iname "*mind*" -exec cp -r {} "$INDUSTRY_OS/salon-os/" \; 2>/dev/null || true

# CRM
mkdir -p "$INDUSTRY_OS/salon-os/crm/rez-salon-crm"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*salon*crm*" -exec cp -r {} "$INDUSTRY_OS/salon-os/crm/" \; 2>/dev/null || true

# Mind AI
mkdir -p "$INDUSTRY_OS/salon-os/core/rez-mind-salon"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*mind*salon*" -exec cp -r {} "$INDUSTRY_OS/salon-os/core/" \; 2>/dev/null || true

# Admin web
mkdir -p "$INDUSTRY_OS/salon-os/core/rez-salon-admin"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*salon*admin*" -exec cp -r {} "$INDUSTRY_OS/salon-os/" \; 2>/dev/null || true

# =============================================================================
# HEALTHCARE OS (Ports 4200-4249)
# =============================================================================
echo -e "\n${BLUE}[3/6] Healthcare OS${NC}"

mkdir -p "$INDUSTRY_OS/healthcare-os/"{core,pharmacy,appointments,records,analytics}

# Core services
mkdir -p "$INDUSTRY_OS/healthcare-os/core/rez-healthcare"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*healthcare*" ! -iname "*fitness*" -exec cp -r {} "$INDUSTRY_OS/healthcare-os/" \; 2>/dev/null || true

# Pharmacy
mkdir -p "$INDUSTRY_OS/healthcare-os/pharmacy/rez-pharmacy"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*pharmacy*" -exec cp -r {} "$INDUSTRY_OS/healthcare-os/pharmacy/" \; 2>/dev/null || true

# Admin web
mkdir -p "$INDUSTRY_OS/healthcare-os/core/rez-healthcare-admin"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*healthcare*admin*" -exec cp -r {} "$INDUSTRY_OS/healthcare-os/" \; 2>/dev/null || true

# Mind AI
mkdir -p "$INDUSTRY_OS/healthcare-os/core/rez-mind-healthcare"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*mind*healthcare*" -exec cp -r {} "$INDUSTRY_OS/healthcare-os/core/" \; 2>/dev/null || true

# =============================================================================
# FITNESS OS (Ports 4250-4299)
# =============================================================================
echo -e "\n${BLUE}[4/6] Fitness OS${NC}"

mkdir -p "$INDUSTRY_OS/fitness-os/"{core,gym,classes,analytics}

# Fitness
mkdir -p "$INDUSTRY_OS/fitness-os/core/rez-fitness"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*fitness*" -exec cp -r {} "$INDUSTRY_OS/fitness-os/" \; 2>/dev/null || true

# Gym
mkdir -p "$INDUSTRY_OS/fitness-os/gym/rez-gym"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*gym*" -exec cp -r {} "$INDUSTRY_OS/fitness-os/gym/" \; 2>/dev/null || true

# Mind fitness
mkdir -p "$INDUSTRY_OS/fitness-os/core/rez-mind-fitness"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*mind*fitness*" -exec cp -r {} "$INDUSTRY_OS/fitness-os/core/" \; 2>/dev/null || true

# Admin web
mkdir -p "$INDUSTRY_OS/fitness-os/core/rez-fitness-admin"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*fitness*admin*" -exec cp -r {} "$INDUSTRY_OS/fitness-os/" \; 2>/dev/null || true

# =============================================================================
# RETAIL OS (Ports 4300-4349)
# =============================================================================
echo -e "\n${BLUE}[5/6] Retail OS${NC}"

mkdir -p "$INDUSTRY_OS/retail-os/"{core,pos,inventory,loyalty,analytics}

# Retail
mkdir -p "$INDUSTRY_OS/retail-os/core/rez-retail"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "rez-retail*" -exec cp -r {} "$INDUSTRY_OS/retail-os/" \; 2>/dev/null || true

# Admin web
mkdir -p "$INDUSTRY_OS/retail-os/core/REZ-retail-admin"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*retail*admin*" -exec cp -r {} "$INDUSTRY_OS/retail-os/" \; 2>/dev/null || true

# =============================================================================
# EVENTS OS (Ports 4350-4399) - HIGHEST PRIORITY
# =============================================================================
echo -e "\n${BLUE}[6/6] Events OS${NC}"

mkdir -p "$INDUSTRY_OS/events-os/"{core,catering,logistics,entertainment,venues,analytics}

# Events
mkdir -p "$INDUSTRY_OS/events-os/core/REZ-events"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*events*" -exec cp -r {} "$INDUSTRY_OS/events-os/" \; 2>/dev/null || true

# Analytics
mkdir -p "$INDUSTRY_OS/events-os/analytics/REZ-events-analytics"
find "$INDUSTRY_OS" -maxdepth 1 -type d -iname "*events*analytics*" -exec cp -r {} "$INDUSTRY_OS/events-os/analytics/" \; 2>/dev/null || true

# =============================================================================
# GRAND SUMMARY
# =============================================================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN} CONSOLIDATION COMPLETE!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}Created Industry OS Directories:${NC}"
for os in restaurant salon healthcare fitness retail events hotel; do
    if [ -d "$INDUSTRY_OS/${os}-os" ]; then
        count=$(find "$INDUSTRY_OS/${os}-os" -maxdepth 2 -type d 2>/dev/null | wc -l | tr -d ' ')
        echo -e "  ✅ ${os}-os ($count directories)"
    fi
done

echo -e "\n${GREEN}Hotel OS (already consolidated):${NC}"
ls -1d "$INDUSTRY_OS/hotel-os"/*/ 2>/dev/null | wc -l | xargs -I {} echo "  ✅ hotel-os ({} categories)"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Update ports for each industry"
echo "  2. Create unified SDKs"
echo "  3. Update documentation"

echo -e "\n${GREEN}Done! 🎉${NC}"
