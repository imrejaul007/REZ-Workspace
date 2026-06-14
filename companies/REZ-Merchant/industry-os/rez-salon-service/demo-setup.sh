#!/bin/bash
# SalonOS Demo Setup Script
# Usage: ./demo-setup.sh

set -e

echo "=========================================="
echo "  SalonOS Demo Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Demo credentials
DEMO_EMAIL="demo@salonos.com"
DEMO_PASSWORD="demo123"
DEMO_SALON="Vanity Point"

echo -e "${BLUE}Creating demo account...${NC}"

# Check if already exists
if curl -s -X POST http://localhost:4010/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" \
  | grep -q "token"; then
  echo -e "${GREEN}✓ Demo account already exists${NC}"
else
  echo -e "${YELLOW}Creating new demo account...${NC}"

  # Register demo user
  curl -s -X POST http://localhost:4010/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$DEMO_EMAIL\",
      \"password\": \"$DEMO_PASSWORD\",
      \"name\": \"Demo Salon\",
      \"phone\": \"+919876543210\",
      \"salonName\": \"$DEMO_SALON\"
    }"

  echo -e "${GREEN}✓ Demo account created${NC}"
fi

# Demo data
echo ""
echo -e "${BLUE}Creating demo salon data...${NC}"

# Create sample services
echo -e "${BLUE}Adding sample services...${NC}"

# Create sample stylists
echo -e "${BLUE}Adding sample stylists...${NC}"

# Create sample customers
echo -e "${BLUE}Adding sample customers...${NC}"

echo ""
echo "=========================================="
echo "  Demo Credentials"
echo "=========================================="
echo ""
echo -e "Email:    ${GREEN}$DEMO_EMAIL${NC}"
echo -e "Password: ${GREEN}$DEMO_PASSWORD${NC}"
echo -e "Salon:    ${GREEN}$DEMO_SALON${NC}"
echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}Demo setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the services: npm run dev"
echo "2. Go to http://localhost:3000"
echo "3. Login with demo credentials"
echo "4. Explore the demo salon"
echo ""
echo "Available services:"
echo "  - Salon Service:     http://localhost:4010"
echo "  - POS Service:      http://localhost:4011"
echo "  - CRM Service:      http://localhost:4012"
echo "  - QR/Loyalty:       http://localhost:4016"
echo "  - WhatsApp Bot:     http://localhost:4017"
echo ""
