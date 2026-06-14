#!/bin/bash
# =============================================================================
# REZ Media Intelligence - Stop All Services
# ==============================================================================

echo "Stopping REZ Media Intelligence services..."

# Kill processes on ports 5000, 5001, 5002
for port in 5000 5001 5002; do
    lsof -ti :$port | xargs kill 2>/dev/null || true
done

# Kill any node processes for this service
pkill -f "REZ-media-intelligence" 2>/dev/null || true

echo "✅ All services stopped"