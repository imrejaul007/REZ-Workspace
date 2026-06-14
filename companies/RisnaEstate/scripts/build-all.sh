#!/bin/bash
# ============================================================
# RisnaEstate - Production Build Script
# ============================================================

set -e

echo "============================================================"
echo "RisnaEstate Production Build"
echo "============================================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

SERVICES=(
  "risna-gateway"
  "risna-property-service"
  "risna-lead-service"
  "risna-visa-service"
  "risna-referral-service"
  "risna-broker-service"
  "risna-crm-service"
  "risna-media-service"
  "risna-intelligence-service"
  "risna-whatsapp-service"
  "risna-investment-service"
  "risna-distribution-service"
  "risna-notification-service"
  "risna-payment-service"
  "risna-builder-service"
  "risna-deal-service"
  "risna-agreement-service"
  "risna-handover-service"
  "risna-booking-service"
  "risna-corpperks-bridge"
  "risna-ads-integration"
  "risna-property-intelligence"
  "risna-distribution-router"
  "risna-influencer-tracker"
  "risna-realtime-service"
  "risna-email-service"
  "risna-chatbot-service"
  "risna-document-service"
  "risna-virtual-tour-service"
  "risna-push-service"
)

TOTAL=${#SERVICES[@]}
SUCCESS=0
FAILED=0

echo ""
echo -e "${YELLOW}Building $TOTAL services...${NC}"
echo ""

for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="$BASE_DIR/services/$SERVICE"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}✗ $SERVICE: Directory not found${NC}"
    ((FAILED++))
    continue
  fi

  echo -n "Building $SERVICE... "
  cd "$SERVICE_DIR"

  if npm run build 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}✗ Build failed${NC}"
    ((FAILED++))
  fi

  cd "$BASE_DIR"
done

echo ""
echo -n "Building frontend... "
cd "$BASE_DIR/frontend"
if npm run build 2>/dev/null; then
  echo -e "${GREEN}✓${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}✗ Build failed${NC}"
  ((FAILED++))
fi

cd "$BASE_DIR"

echo ""
echo "============================================================"
echo -e "Build Complete: ${GREEN}$SUCCESS succeeded${NC}, ${RED}$FAILED failed${NC}"
echo "============================================================"

[ $FAILED -gt 0 ] && exit 1 || exit 0
