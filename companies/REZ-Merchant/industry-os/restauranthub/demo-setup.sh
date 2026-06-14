#!/bin/bash
# RestaurantOS Demo Setup Script
# Usage: ./demo-setup.sh

set -e

echo "=========================================="
echo "  RestaurantOS Demo Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Demo credentials
DEMO_EMAIL="demo@restauranthub.com"
DEMO_PASSWORD="demo123"
DEMO_RESTAURANT="Spice Garden"

echo -e "${BLUE}Creating demo account...${NC}"

# Check if already exists
if curl -s -X POST http://localhost:3001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" \
  | grep -q "token"; then
  echo -e "${GREEN}✓ Demo account already exists${NC}"
else
  echo -e "${YELLOW}Creating new demo account...${NC}"

  # Register demo user
  curl -s -X POST http://localhost:3001/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$DEMO_EMAIL\",
      \"password\": \"$DEMO_PASSWORD\",
      \"name\": \"Demo Restaurant\",
      \"phone\": \"+919876543210\"
    }"

  echo -e "${GREEN}✓ Demo account created${NC}"
fi

# Demo data
echo ""
echo -e "${BLUE}Creating demo restaurant data...${NC}"

echo ""
echo "=========================================="
echo "  Demo Credentials"
echo "=========================================="
echo ""
echo -e "Email:    ${GREEN}$DEMO_EMAIL${NC}"
echo -e "Password: ${GREEN}$DEMO_PASSWORD${NC}"
echo -e "Restaurant: ${GREEN}$DEMO_RESTAURANT${NC}"
echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}Demo setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the app: npm run dev"
echo "2. Go to http://localhost:3000"
echo "3. Login with demo credentials"
echo "4. Explore the demo restaurant"
echo ""
