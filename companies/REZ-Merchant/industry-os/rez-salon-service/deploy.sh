#!/bin/bash
# Deployment script for REZ Merchant Industry Services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services to deploy
SERVICES=(
  "rez-salon-service"
  "rez-pharmacy-service"
  "rez-fitness-service"
  "rez-mind-salon-service"
)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}REZ Merchant Industry Services Deploy${NC}"
echo -e "${GREEN}========================================${NC}"

# Check environment
if [ -z "$JWT_SECRET" ]; then
  echo -e "${RED}ERROR: JWT_SECRET not set${NC}"
  exit 1
fi

if [ -z "$CORS_ORIGIN" ]; then
  echo -e "${RED}ERROR: CORS_ORIGIN not set${NC}"
  exit 1
fi

# Deploy each service
for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="./industry-os/$SERVICE"

  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${YELLOW}Skipping $SERVICE (not found)${NC}"
    continue
  fi

  echo -e "\n${GREEN}Deploying $SERVICE...${NC}"

  cd "$SERVICE_DIR"

  # Install dependencies
  echo "Installing dependencies..."
  npm ci

  # TypeScript check
  echo "Running TypeScript check..."
  npm run build || { echo -e "${RED}Build failed for $SERVICE${NC}"; exit 1; }

  # Run tests
  echo "Running tests..."
  npm test || { echo -e "${RED}Tests failed for $SERVICE${NC}"; exit 1; }

  # Build Docker image
  echo "Building Docker image..."
  docker build -t "rez/$SERVICE:latest" .

  # Deploy (add your deployment command here)
  # docker push "rez/$SERVICE:latest"

  echo -e "${GREEN}$SERVICE deployed successfully!${NC}"

  cd - > /dev/null
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All services deployed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
