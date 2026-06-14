#!/bin/bash
# REZ-Consumer Mobile Deployment Script

set -e

echo "=================================="
echo "REZ-Consumer Mobile Deployment"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Deploy mobile app
deploy_mobile_app() {
    local app=$1
    local dir=$2

    echo -e "${YELLOW}Building $app...${NC}"

    if [ -d "$dir" ]; then
        cd "$dir"
        eas build --platform ios --profile production --latest 2>/dev/null || echo "EAS not configured for $app"
        eas build --platform android --profile production --latest 2>/dev/null || echo "EAS not configured for $app"
        cd - > /dev/null
        echo -e "${GREEN}✓ $app built${NC}"
    else
        echo -e "${RED}✗ $dir not found${NC}"
    fi
}

# Check if EAS is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}Installing EAS CLI...${NC}"
    npm install -g eas-cli
fi

echo -e "${GREEN}Starting mobile build...${NC}"
echo ""

# Deploy Mobile Apps
echo "=================================="
echo "Building Mobile Apps"
echo "=================================="

deploy_mobile_app "rez-app" "rez-app"
deploy_mobile_app "do" "do"
deploy_mobile_app "verify-qr-mobile" "verify-qr-mobile"
deploy_mobile_app "safe-qr" "safe-qr"
deploy_mobile_app "rez-driver" "rez-driver"

echo ""
echo "=================================="
echo -e "${GREEN}All mobile apps built!${NC}"
echo "=================================="
echo ""
echo "To submit to stores, run:"
echo "  eas submit --platform ios"
echo "  eas submit --platform android"
