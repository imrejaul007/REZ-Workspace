#!/bin/bash
# Update Hotel OS Service Ports (macOS compatible)
set -e

HOTEL_OS="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant/industry-os/hotel-os"

echo "=== Updating Hotel OS Ports ==="

# Core services
update_port() {
    local service="$1"
    local new_port="$2"

    # Find the service
    for category in "$HOTEL_OS"/*/; do
        svc_path="$category/$service/src/index.ts"
        if [ -f "$svc_path" ]; then
            sed -i '' "s/|| '[0-9]*'/'|| '$new_port'/g" "$svc_path" 2>/dev/null
            sed -i '' "s/|| [0-9]*/|| $new_port/g" "$svc_path" 2>/dev/null
            echo "✓ $service → $new_port"
            return 0
        fi
    done
    echo "⚠ $service (not found)"
}

# Core
update_port "rez-booking" "4801"
update_port "rez-pms-deprecated" "4802"
update_port "rez-hotel-service" "4803"
update_port "rez-analytics" "4804"

# Guest Experience
update_port "rez-digital-key" "4810"
update_port "rez-restaurant-hotel" "4811"
update_port "rez-spa" "4812"
update_port "rez-concierge" "4813"
update_port "rez-room-controls" "4814"
update_port "rez-parking" "4815"
update_port "rez-lost-found" "4816"
update_port "rez-upsell" "4817"
update_port "rez-minibar" "4818"
update_port "rez-pre-arrival" "4819"

# Feedback
update_port "rez-reviews" "4820"
update_port "rez-surveys" "4821"
update_port "rez-hotel-reviews" "4822"
update_port "rez-self-checkout" "4823"

# Operations
update_port "rez-housekeeping" "4830"
update_port "rez-maintenance" "4831"
update_port "rez-hotel-housekeeping" "4832"
update_port "rez-hotel-messaging" "4833"

# AI
update_port "rez-staybot" "4840"
update_port "rez-staybot-router" "4841"
update_port "rez-voice-agent" "4842"
update_port "rez-hotel-genie" "4843"
update_port "rez-ai-frontdesk" "4844"

# Intelligence
update_port "rez-guest-memory" "4850"
update_port "rez-guest-memory-hotel" "4851"
update_port "rez-guest-twin" "4852"
update_port "rez-business-twin" "4853"

# Integrations
update_port "rez-channel-manager" "4860"
update_port "rez-google-ads" "4861"
update_port "rez-corp-integration" "4862"
update_port "rez-airzy-bridge" "4863"
update_port "rez-hotel-gateway" "4864"
update_port "rez-stayown-bridge" "4865"

# Payments
update_port "rez-hotel-payment" "4870"

echo ""
echo "=== Verification ==="
grep -r "PORT.*=.*48" "$HOTEL_OS"/*/*/src/index.ts 2>/dev/null | grep -v "4805\|4806\|4807\|4808\|4809\|4825\|4826\|4827\|4828\|4829\|4834\|4835\|4836\|4837\|4838\|4839\|4845\|4846\|4847\|4848\|4849\|4854\|4855\|4856\|4857\|4858\|4859\|4866\|4867\|4868\|4869\|4871\|4872\|4873\|4874\|4875\|4876\|4877\|4878\|4879" | head -20

echo ""
echo "Done!"
