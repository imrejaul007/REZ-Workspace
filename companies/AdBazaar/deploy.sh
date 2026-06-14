#!/bin/bash
# AdBazaar Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

ENV=${1:-dev}
echo "🚀 Deploying AdBazaar to $ENV..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build all services
echo "🔨 Building services..."
npm run build

# Start services based on environment
if [ "$ENV" = "prod" ]; then
    echo "🏭 Starting production services..."
    pm2 start pm2.config.js --env production
else
    echo "🔧 Starting development services..."
    npm run dev
fi

echo "✅ Deployment complete!"
echo ""
echo "Health checks:"
echo "  curl http://localhost:4007/health  # REZ Ads"
echo "  curl http://localhost:4085/health  # Backend"
echo "  curl http://localhost:4000/health  # Marketing"
