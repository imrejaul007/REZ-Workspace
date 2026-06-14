#!/bin/bash
# Update all services to use correct ports
# Run from REZ-Merchant directory
# Version: 2.0.0 - June 4, 2026

set -e

echo "=== REZ-Merchant Port Update ==="
echo "This script updates PORT in .env files"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to update port in .env file
update_env_port() {
    local dir="$1"
    local port="$2"
    if [[ -f "$dir/.env" ]]; then
        if grep -q "^PORT=" "$dir/.env" 2>/dev/null; then
            sed -i '' "s/^PORT=.*/PORT=$port/" "$dir/.env"
        else
            echo "PORT=$port" >> "$dir/.env"
        fi
        echo -e "${GREEN}Updated${NC}: $dir/.env -> PORT=$port"
    fi
}

# Function to update port in index.ts
update_ts_port() {
    local file="$1"
    local port="$2"
    if [[ -f "$file" ]]; then
        sed -i '' -E "s/const PORT = process\.env\.PORT \|\| [0-9]+/const PORT = process.env.PORT || $port/" "$file"
        sed -i '' -E "s/const PORT = [0-9]+/const PORT = $port/" "$file"
        sed -i '' -E "s/port:[0-9]+/port:$port/" "$file"
        echo -e "${GREEN}Updated${NC}: $file -> port=$port"
    fi
}

# NexTaBizz family (4200-4212)
echo "Updating NexTaBizz family ports..."
update_env_port "nexTabizz-service" 4200
update_ts_port "nexTabizz-service/src/index.ts" 4200
update_env_port "REZ-b2b-integration" 4201
update_env_port "REZ-dashboard" 4202
update_env_port "REZ-multi-warehouse" 4203
update_env_port "merchant-referral-portal" 4204
update_env_port "rez-business-copilot" 4205
update_env_port "rez-inventory-v2-ui" 4206
update_env_port "rez-merchant-app" 4207
update_env_port "rez-staff-ui" 4208
update_env_port "rez-staff-web" 4209
update_env_port "verify-qr-admin" 4210
update_env_port "rez-table-booking-service" 4211
update_env_port "rez-unified-dashboard" 4212

# Core Merchant Services (4000-4099)
echo ""
echo "Updating Core Merchant ports..."
update_env_port "rez-merchant-service" 4005
update_env_port "safe-qr-service" 4001
update_env_port "verify-qr-service" 4003
update_env_port "rez-merchant-intelligence-service" 4011
update_env_port "rez-kitchen-display" 4014
update_env_port "rez-pos-service" 4013
update_env_port "rez-kitchen-ai" 4015
update_env_port "rez-menu-service" 4030
update_env_port "rez-pos-inventory-sync" 4031
update_env_port "REZ-franchise-management" 4025
update_env_port "rez-cross-merchant-service" 4027
update_env_port "rez-store-onboarding" 4032
update_env_port "rez-merchant-integrations" 4040
update_env_port "REZ-merchant-trust-bridge" 4041

# Consumer Services (3000-3099)
echo ""
echo "Updating Consumer Services ports..."
update_env_port "REZ-inbox" 3010
update_env_port "REZ-assistant" 3011
update_env_port "REZ-bills" 3012
update_env_port "REZ-expense" 3013
update_env_port "REZ-menu-qr" 3014
update_env_port "REZ-nearby" 3015
update_env_port "REZ-save" 3016
update_env_port "REZ-scan" 3017
update_env_port "rez-merchant-loans-service" 3081
update_env_port "rez-white-label-service" 3083
update_env_port "REZ-merchant-corpperks-bridge" 3005

# Hotel OS (4020-4029)
echo ""
echo "Updating Hotel OS ports..."
update_env_port "industry-os/rez-hotel-service" 4020
update_env_port "industry-os/rez-hotel-housekeeping-service" 4021
update_env_port "industry-os/rez-hotel-maintenance-service" 4022
update_env_port "industry-os/rez-hotel-reviews-service" 4023
update_env_port "industry-os/rez-hotel-messaging-service" 4024
update_env_port "industry-os/rez-hotel-analytics-service" 4025
update_env_port "industry-os/rez-virtual-concierge-service" 4026
update_env_port "industry-os/rez-room-service" 4027
update_env_port "industry-os/rez-guest-mobile-app" 4028
update_env_port "industry-os/rez-multi-property-dashboard" 4029

# Retail OS (4100-4109)
echo ""
echo "Updating Retail OS ports..."
update_env_port "industry-os/rez-retail-service" 4100
update_env_port "industry-os/rez-retail-crm-service" 4101
update_env_port "industry-os/rez-retail-loyalty-service" 4102
update_env_port "industry-os/rez-retail-inventory-service" 4103
update_env_port "industry-os/rez-retail-pos-service" 4104
update_env_port "industry-os/rez-retail-analytics-service" 4105

# Salon OS (4110-4119)
echo ""
echo "Updating Salon OS ports..."
update_env_port "industry-os/rez-salon-service" 4110
update_env_port "industry-os/rez-salon-booking-service" 4111
update_env_port "industry-os/rez-salon-inventory-service" 4112
update_env_port "industry-os/rez-salon-membership-service" 4113
update_env_port "industry-os/rez-salon-crm-service" 4114
update_env_port "industry-os/rez-salon-whatsapp-service" 4115

# Gym OS (4120-4129)
echo ""
echo "Updating Gym OS ports..."
update_env_port "industry-os/rez-gym-service" 4120
update_env_port "industry-os/rez-gym-attendance-service" 4121
update_env_port "industry-os/rez-gym-class-service" 4122
update_env_port "industry-os/rez-gym-scheduler-service" 4123
update_env_port "industry-os/rez-gym-analytics-service" 4124

# HOJAI Integration (4600-4699)
echo ""
echo "Updating HOJAI Integration ports..."
update_env_port "REZ-competitive-intelligence" 4600
update_env_port "rez-multi-location" 4601
update_env_port "rez-payroll" 4610
update_env_port "rez-warranty" 4620
update_env_port "rez-inventory-alerts" 4625
update_env_port "rez-supplier-marketplace" 4630

echo ""
echo -e "${GREEN}=== Port update complete! ===${NC}"
echo "Check port-assignments.json for full registry"
echo ""
echo "Next steps:"
echo "1. Review changes in .env files"
echo "2. Restart affected services"
echo "3. Update service-to-service URLs if needed"
echo "4. Verify health checks pass"
