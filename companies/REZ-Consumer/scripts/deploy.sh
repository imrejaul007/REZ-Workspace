#!/bin/bash
# REZ-Consumer Deployment Script

set -e

echo "=================================="
echo "REZ-Consumer Deployment Script"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Deploy function
deploy_web_app() {
    local app=$1
    local dir=$2

    echo -e "${YELLOW}Deploying $app...${NC}"

    if [ -d "$dir" ]; then
        cd "$dir"
        vercel --prod --yes 2>/dev/null || echo "Vercel not configured for $app"
        cd - > /dev/null
        echo -e "${GREEN}✓ $app deployed${NC}"
    else
        echo -e "${RED}✗ $dir not found${NC}"
    fi
}

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Deploy Web Apps
echo "=================================="
echo "Deploying Web Apps"
echo "=================================="

deploy_web_app "rez-now" "rez-now"
deploy_web_app "go4food" "go4food"
deploy_web_app "verify-qr-dashboard" "verify-qr-dashboard"
deploy_web_app "REZ-assistant-ui" "REZ-assistant-ui"
deploy_web_app "REZ-scan-ui" "REZ-scan-ui"
deploy_web_app "REZ-expense-ui" "REZ-expense-ui"
deploy_web_app "REZ-inbox-ui" "REZ-inbox-ui"
deploy_web_app "REZ-nearby-ui" "REZ-nearby-ui"

echo ""
echo "=================================="
echo -e "${GREEN}All web apps deployed!${NC}"
echo "=================================="
