#!/bin/bash
# Update Ports for All Industry Services
# Port ranges:
#   Restaurant: 4101-4111
#   Hotel: 4801-4870
#   Salon: 4901-4906
#   Healthcare: 4501-4504
#   Fitness: 4551-4553
#   Retail: 4601-4604
#   Events: 4751-4752

set -e
GREEN='\033[0;32m'
NC='\033[0m'

INDUSTRY_OS="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant/industry-os"

echo "=== Updating Industry Service Ports ==="

# Restaurant OS (4101-4111)
echo -e "\n${GREEN}Restaurant OS${NC}"
update_port() {
    local file="$1"
    local new_port="$2"
    if [ -f "$file" ]; then
        sed -i '' "s/|| '[0-9]*'/'|| '$new_port'/g" "$file"
        sed -i '' "s/|| [0-9]*,/|| $new_port,/g" "$file"
        echo "  ✓ $(basename $(dirname $file)) → $new_port"
    fi
}

# Update Restaurant services
update_port "$INDUSTRY_OS/restaurant-os/core/rez-restaurant/src/index.ts" "4101"
update_port "$INDUSTRY_OS/restaurant-os/pos/rez-restaurant-pos/src/index.ts" "4102"
update_port "$INDUSTRY_OS/restaurant-os/kitchen/rez-kds/src/index.ts" "4103"
update_port "$INDUSTRY_OS/restaurant-os/orders/rez-reservations/src/index.ts" "4104"
update_port "$INDUSTRY_OS/restaurant-os/core/rez-ai-restaurant/src/index.ts" "4105"
update_port "$INDUSTRY_OS/restaurant-os/analytics/rez-analytics/src/index.ts" "4106"
update_port "$INDUSTRY_OS/restaurant-os/integrations/rez-loyalty/src/index.ts" "4108"
update_port "$INDUSTRY_OS/restaurant-os/integrations/rez-scheduling/src/index.ts" "4109"
update_port "$INDUSTRY_OS/restaurant-os/integrations/rez-inventory/src/index.ts" "4110"

# Update Salon services
echo -e "\n${GREEN}Salon OS${NC}"
update_port "$INDUSTRY_OS/salon-os/core/rez-salon/src/index.ts" "4901"
update_port "$INDUSTRY_OS/salon-os/pos/rez-salon-pos/src/index.ts" "4902"
update_port "$INDUSTRY_OS/salon-os/crm/rez-salon-crm/src/index.ts" "4903"
update_port "$INDUSTRY_OS/salon-os/membership/rez-salon-membership/src/index.ts" "4904"
update_port "$INDUSTRY_OS/salon-os/appointments/rez-salon-booking/src/index.ts" "4905"

# Update Healthcare services
echo -e "\n${GREEN}Healthcare OS${NC}"
update_port "$INDUSTRY_OS/healthcare-os/core/rez-healthcare/src/index.ts" "4501"
update_port "$INDUSTRY_OS/healthcare-os/pharmacy/rez-pharmacy/src/index.ts" "4502"
update_port "$INDUSTRY_OS/healthcare-os/pharmacy/rez-pharmacy-prescription/src/index.ts" "4503"
update_port "$INDUSTRY_OS/healthcare-os/core/rez-mind-healthcare/src/index.ts" "4504"

# Update Fitness services
echo -e "\n${GREEN}Fitness OS${NC}"
update_port "$INDUSTRY_OS/fitness-os/core/rez-fitness/src/index.ts" "4551"
update_port "$INDUSTRY_OS/fitness-os/gym/rez-gym-access/src/index.ts" "4552"
update_port "$INDUSTRY_OS/fitness-os/core/rez-mind-fitness/src/index.ts" "4553"

# Update Retail services
echo -e "\n${GREEN}Retail OS${NC}"
update_port "$INDUSTRY_OS/retail-os/core/rez-retail/src/index.ts" "4601"
update_port "$INDUSTRY_OS/retail-os/pos/rez-retail-pos/src/index.ts" "4602"
update_port "$INDUSTRY_OS/retail-os/inventory/rez-retail-inventory/src/index.ts" "4603"
update_port "$INDUSTRY_OS/retail-os/analytics/rez-retail-analytics/src/index.ts" "4604"

# Update Events services
echo -e "\n${GREEN}Events OS${NC}"
update_port "$INDUSTRY_OS/events-os/core/rez-events/src/index.ts" "4751"
update_port "$INDUSTRY_OS/events-os/analytics/REZ-events-analytics/src/index.ts" "4752"

echo -e "\n${GREEN}Done!${NC}"
