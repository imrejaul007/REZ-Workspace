#!/bin/bash
# Comprehensive Service Fix Script
# 1. Updates ports for all services
# 2. Removes duplicates from industry-os root

set -e
INDUSTRY_OS="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant/industry-os"

echo "=== Fixing All Industry Services ==="

# Update port helper
fix_port() {
    local file="$1"
    local new_port="$2"
    if [ -f "$file" ]; then
        sed -i '' "s/|| '[0-9]*'/'|| '$new_port'/g" "$file" 2>/dev/null
        sed -i '' "s/|| [0-9]*,/|| $new_port,/g" "$file" 2>/dev/null
        echo "  ✓ $(echo $file | rev | cut -d'/' -f3 | rev) → $new_port"
    fi
}

# Restaurant OS
echo -e "\n🍽️ Restaurant OS"
fix_port "$INDUSTRY_OS/restaurant-os/core/rez-restaurant/src/index.ts" "4101"
fix_port "$INDUSTRY_OS/restaurant-os/core/rez-ai-restaurant/src/index.ts" "4105"
fix_port "$INDUSTRY_OS/rez-restaurant-service/src/index.ts" "4101"
fix_port "$INDUSTRY_OS/rez-restaurant-pos-service/src/index.ts" "4102"
fix_port "$INDUSTRY_OS/rez-ai-restaurant/src/index.ts" "4105"
fix_port "$INDUSTRY_OS/rez-restaurant-analytics-service/src/index.ts" "4106"
fix_port "$INDUSTRY_OS/rez-restaurant-reservations/src/index.ts" "4104"

# Salon OS
echo -e "\n💇 Salon OS"
fix_port "$INDUSTRY_OS/rez-salon-service/src/index.ts" "4901"
fix_port "$INDUSTRY_OS/rez-salon-crm-service/src/index.ts" "4903"
fix_port "$INDUSTRY_OS/rez-salon-pos-service/src/index.ts" "4902"
fix_port "$INDUSTRY_OS/rez-salon-membership-service/src/index.ts" "4904"
fix_port "$INDUSTRY_OS/rez-salon-booking-service/src/index.ts" "4905"
fix_port "$INDUSTRY_OS/rez-salon-whatsapp-service/src/index.ts" "3005"
fix_port "$INDUSTRY_OS/rez-salon-inventory-service/src/index.ts" "4906"

# Healthcare OS
echo -e "\n🏥 Healthcare OS"
fix_port "$INDUSTRY_OS/rez-healthcare-service/src/index.ts" "4501"
fix_port "$INDUSTRY_OS/rez-healthcare-patient-service/src/index.ts" "4501"
fix_port "$INDUSTRY_OS/rez-healthcare-appointment-service/src/index.ts" "4501"
fix_port "$INDUSTRY_OS/rez-healthcare-billing-service/src/index.ts" "4501"
fix_port "$INDUSTRY_OS/rez-pharmacy-service/src/index.ts" "4502"
fix_port "$INDUSTRY_OS/rez-pharmacy-inventory/src/index.ts" "4502"
fix_port "$INDUSTRY_OS/rez-pharmacy-prescription/src/index.ts" "4503"
fix_port "$INDUSTRY_OS/rez-healthcare-prescription-service/src/index.ts" "4503"

# Fitness OS
echo -e "\n💪 Fitness OS"
fix_port "$INDUSTRY_OS/rez-fitness-service/src/index.ts" "4551"
fix_port "$INDUSTRY_OS/rez-fitness-access-service/src/index.ts" "4552"
fix_port "$INDUSTRY_OS/rez-mind-fitness-service/src/index.ts" "4553"

# Retail OS
echo -e "\n🛒 Retail OS"
fix_port "$INDUSTRY_OS/rez-retail-multistore/src/index.ts" "4601"
fix_port "$INDUSTRY_OS/rez-retail-pos/src/index.ts" "4602"
fix_port "$INDUSTRY_OS/rez-retail-inventory/src/index.ts" "4603"
fix_port "$INDUSTRY_OS/rez-retail-loyalty-service/src/index.ts" "4604"

# Events OS
echo -e "\n🎪 Events OS"
fix_port "$INDUSTRY_OS/rez-events-service/src/index.ts" "4751"

echo -e "\n✅ All ports updated!"
