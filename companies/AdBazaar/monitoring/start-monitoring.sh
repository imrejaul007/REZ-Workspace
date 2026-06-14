#!/bin/bash
# REZ AdBazaar - Monitoring Stack Startup

set -e

echo "🚀 Starting REZ AdBazaar Monitoring Stack..."
echo "============================================"

cd "$(dirname "$0")"

# Docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Start monitoring stack
$DOCKER_COMPOSE -f docker-compose.monitoring.yml up -d

echo ""
echo "✅ Monitoring services started!"
echo ""
echo "📊 Access Points:"
echo "================="
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3000"
echo "               (admin/admin)"
echo "  Alertmanager: http://localhost:9093"
echo ""
echo "📈 To import dashboard:"
echo "  1. Go to Grafana → Dashboards → Import"
echo "  2. Upload grafana-dashboard.json"
echo ""
echo "🛑 To stop: docker compose -f docker-compose.monitoring.yml down"
