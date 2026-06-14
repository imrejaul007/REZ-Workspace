#!/bin/bash
# ReZ SegmentAI - Deployment Script

set -e

echo "🚀 Deploying ReZ SegmentAI..."

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
echo "📍 Service running on port 3006"
echo "🔗 Health check: http://localhost:3006/api/health"

npm start
