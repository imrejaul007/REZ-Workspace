#!/bin/bash
# ReZ Ride - Launch Script
# Deploys to production

set -e

echo "========================================"
echo "ReZ Ride Production Launch"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your API keys."
    exit 1
fi

# Check for required keys
echo "Checking API keys..."

REQUIRED_KEYS=(
    "MONGODB_URI"
    "JWT_SECRET"
    "INTERNAL_SERVICE_TOKEN"
)

for key in "${REQUIRED_KEYS[@]}"; do
    if grep -q "^${key}=" .env && grep "^${key}=.*[^/]$" .env > /dev/null; then
        echo "✓ $key"
    else
        echo "✗ $key (missing or placeholder)"
    fi
done

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Build Docker image
echo ""
echo "Building Docker image..."
docker build -t rezride/api:latest .

# Push to registry (if configured)
# docker push registry.example.com/rezride/api:latest

# Deploy using docker-compose
echo ""
echo "Deploying with Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "========================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "API running at: http://localhost:4000"
echo "Health check: http://localhost:4000/health"
echo ""
