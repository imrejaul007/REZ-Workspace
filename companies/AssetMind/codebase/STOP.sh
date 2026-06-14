#!/bin/bash
# AssetMind - Stop All Services

echo "Stopping all AssetMind services..."

# Kill all Python processes related to AssetMind
pkill -f "assetmind-" || true
pkill -f "uvicorn" || true

# Kill all Node processes related to AssetMind
pkill -f "node.*assetmind" || true

echo "All services stopped."