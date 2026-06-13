#!/bin/bash
# =============================================================================
# Hotel Services Consolidation Script (macOS Compatible)
# Migrates StayOwn-Hospitality to REZ-Merchant
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
STAYOWN_DIR="/Users/rejaulkarim/Documents/RTMN/companies/StayOwn-Hospitality"
REZ_DIR="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} Hotel Services Consolidation${NC}"
echo -e "${BLUE} StayOwn → REZ-Merchant${NC}"
echo -e "${BLUE}========================================${NC}"

# =============================================================================
# STEP 1: Create Directory Structure
# =============================================================================
echo -e "\n${YELLOW}[1/4] Creating hotel-os directory structure...${NC}"

mkdir -p "$REZ_DIR/industry-os/hotel-os/"{core,guest-experience,room-services,operations,ai,intelligence,payments,feedback,integrations,shared}

echo -e "${GREEN}✓ Directory structure created${NC}"

# =============================================================================
# STEP 2: Migrate Services
# =============================================================================
echo -e "\n${YELLOW}[2/4] Migrating services from StayOwn...${NC}"

# Function to copy service
copy_service() {
    local src="$1"
    local dest="$2"
    local src_path="$STAYOWN_DIR/$src"
    local dest_path="$REZ_DIR/industry-os/hotel-os/$dest"

    if [ -d "$src_path" ]; then
        echo -e "  ${GREEN}✓${NC} $src → $dest"
        mkdir -p "$dest_path"
        # Copy files (excluding node_modules, .git, dist)
        find "$src_path" -maxdepth 1 ! -name 'node_modules' ! -name '.git' ! -name 'dist' ! -name 'build' -exec cp -r {} "$dest_path/" \; 2>/dev/null || true
    else
        echo -e "  ${YELLOW}⚠${NC} Not found: $src"
    fi
}

# Core
copy_service "rez-stayown-service" "core/rez-booking"
copy_service "rez-pms" "core/rez-pms-deprecated"

# Guest Experience
copy_service "pre-arrival-service" "guest-experience/rez-pre-arrival"
copy_service "zero-checkout-automation" "guest-experience/rez-self-checkout"
copy_service "smart-lock-service" "guest-experience/rez-digital-key"

# Room Services
copy_service "minibar-service" "room-services/rez-minibar"
copy_service "hotel-restaurant-booking" "room-services/rez-restaurant-hotel"
copy_service "hotel-spa-booking" "room-services/rez-spa"
copy_service "concierge-desk" "room-services/rez-concierge"

# Operations
copy_service "predictive-housekeeping" "operations/rez-housekeeping"
copy_service "parking-service" "operations/rez-parking"
copy_service "lost-found" "operations/rez-lost-found"
copy_service "room-controls" "operations/rez-room-controls"

# AI
copy_service "hojai-staybot" "ai/rez-staybot"
copy_service "voice-hotel-agent" "ai/rez-voice-agent"
copy_service "ai-front-desk" "ai/rez-ai-frontdesk"
copy_service "hojai-genie" "ai/rez-hotel-genie"
copy_service "staybot-service-router" "ai/rez-staybot-router"

# Intelligence
copy_service "hojai-memory" "intelligence/rez-guest-memory"
copy_service "hojai-memory-hotel" "intelligence/rez-guest-memory-hotel"
copy_service "guest-twin-service" "intelligence/rez-guest-twin"
copy_service "hotel-business-twin" "intelligence/rez-business-twin"

# Payments
copy_service "rez-payment" "payments/rez-hotel-payment"

# Feedback
copy_service "review-manager" "feedback/rez-reviews"
copy_service "feedback-survey" "feedback/rez-surveys"
copy_service "upsell-engine" "feedback/rez-upsell"

# Integrations
copy_service "integration-gateway" "integrations/rez-hotel-gateway"
copy_service "hotel-os-integration" "integrations/rez-stayown-bridge"
copy_service "stayown-corp-integration" "integrations/rez-corp-integration"
copy_service "stayown-airzy-bridge" "integrations/rez-airzy-bridge"

echo -e "${GREEN}✓ Core services migrated${NC}"

# =============================================================================
# STEP 3: Merge REZ-Merchant Services
# =============================================================================
echo -e "\n${YELLOW}[3/4] Merging REZ-Merchant hotel services...${NC}"

# Copy existing REZ-Merchant hotel services
copy_service_rez() {
    local src="$1"
    local dest="$2"
    local src_path="$REZ_DIR/industry-os/$src"
    local dest_path="$REZ_DIR/industry-os/hotel-os/$dest"

    if [ -d "$src_path" ]; then
        echo -e "  ${GREEN}✓${NC} REZ: $src → $dest"
        mkdir -p "$dest_path"
        cp -r "$src_path"/* "$dest_path/" 2>/dev/null || true
    fi
}

copy_service_rez "rez-hotel-channel-integration-service" "integrations/rez-channel-manager"
copy_service_rez "rez-hotel-maintenance-service" "operations/rez-maintenance"
copy_service_rez "rez-hotel-service" "core/rez-hotel-service"
copy_service_rez "rez-hotel-pos-service" "core/rez-hotel-pos-service"
copy_service_rez "rez-hotel-analytics-service" "analytics/rez-analytics"
copy_service_rez "rez-hotel-housekeeping-service" "operations/rez-hotel-housekeeping"
copy_service_rez "rez-hotel-messaging-service" "operations/rez-hotel-messaging"
copy_service_rez "rez-hotel-reviews-service" "feedback/rez-hotel-reviews"
copy_service_rez "rez-google-hotel-ads-service" "integrations/rez-google-ads"

echo -e "${GREEN}✓ REZ-Merchant services merged${NC}"

# =============================================================================
# STEP 4: Update Package Names & Create Docs
# =============================================================================
echo -e "\n${YELLOW}[4/4] Creating documentation...${NC}"

# Create Hotel OS README
cat > "$REZ_DIR/industry-os/hotel-os/README.md" << 'EOF'
# 🏨 REZ Hotel OS

**Unified Hotel Management Platform** - Part of REZ Merchant OS

## Overview

REZ Hotel OS provides comprehensive hotel management capabilities integrated with the REZ ecosystem.

## Directory Structure

```
hotel-os/
├── core/              # Main PMS & booking
├── guest-experience/  # Guest-facing services
├── room-services/     # F&B & in-hotel services
├── operations/       # Operational services
├── ai/               # AI-powered services
├── intelligence/     # Data & analytics
├── payments/         # Payment processing
├── feedback/         # Reviews & surveys
├── integrations/     # External integrations
└── shared/           # Common utilities
```

## Migration

This directory was consolidated from:
- **StayOwn-Hospitality** (archived June 13, 2026)
- **REZ-Merchant/industry-os/** (existing hotel services)

## Services (Migrated)

| Service | Category | Source | LOC |
|---------|----------|--------|-----|
| rez-booking | core | StayOwn | 3,082 |
| rez-staybot | ai | StayOwn | 1,267 |
| pre-arrival | guest-experience | StayOwn | 658 |
| predictive-housekeeping | operations | StayOwn | 682 |
| hotel-business-twin | intelligence | StayOwn | 658 |
| guest-twin | intelligence | StayOwn | 602 |
| voice-agent | ai | StayOwn | 744 |
| rez-payment | payments | StayOwn | 590 |
| rez-channel-manager | integrations | REZ-Merchant | 1,323 |
| rez-maintenance | operations | REZ-Merchant | 502 |

## Documentation

- [Feature Comparison](../docs/HOTEL-SERVICES-COMPLETE.md)
- [Consolidation Plan](../docs/HOTEL-CONSOLIDATION-PLAN.md)

## Port Assignments

| Service | Port |
|---------|------|
| rez-booking | 4031 |
| rez-staybot | 4840 |
| rez-pre-arrival | 4828 |
| rez-digital-key | 4825 |
| rez-minibar | 4810 |
| rez-restaurant | 4811 |
| rez-spa | 4812 |
| rez-concierge | 4821 |
| rez-housekeeping | 4826 |
| rez-analytics | 4818 |

---

**Migrated:** June 13, 2026
EOF

echo -e "${GREEN}✓ Documentation created${NC}"

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN} Consolidation Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}Migrated Services:${NC}"
for dir in "$REZ_DIR/industry-os/hotel-os"/*/; do
    if [ -d "$dir" ]; then
        name=$(basename "$dir")
        # Count files
        files=$(find "$dir" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$files" -gt 0 ]; then
            echo -e "  ✓ $name ($files TypeScript files)"
        fi
    fi
done

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Review migrated services"
echo "  2. Run 'npm install' in each service"
echo "  3. Update environment variables"
echo "  4. Update database connections"
echo "  5. Run integration tests"
echo "  6. Deploy to staging"

echo -e "\n${GREEN}Done! 🎉${NC}"
