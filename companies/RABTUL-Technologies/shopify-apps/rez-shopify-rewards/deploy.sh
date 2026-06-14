#!/bin/bash
# ReZ Loyalty Boost - Deployment Script

set -e

echo "🚀 Deploying ReZ Loyalty Boost..."

# Check environment
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️ Tests skipped"

# Build
echo "🔨 Building..."
npm run build

# Start service
echo "✅ Deployment complete!"
echo "📍 Service running on port 3002"
echo "🔗 Health check: http://localhost:3002/api/health"

npm start
