#!/bin/bash
# StayOwn Hospitality - Service Health Monitor

set -e

SERVICES=(
  "Guest Twin:3810"
  "Hotel Business Twin:3811"
  "Event Bus:3812"
  "Maintenance AI:3815"
  "Zero Checkout:3817"
)

echo "🏨 StayOwn Hospitality - Service Health Monitor"
echo "================================================"
echo ""

check_service() {
  local name=$1
  local port=$2

  if curl -s -f http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ $name (Port $port) - HEALTHY"
    return 0
  else
    echo "❌ $name (Port $port) - DOWN"
    return 1
  fi
}

# Check each service
healthy=0
unhealthy=0

for service in "${SERVICES[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"

  if check_service "$name" "$port"; then
    ((healthy++))
  else
    ((unhealthy++))
  fi
done

echo ""
echo "================================================"
echo "Summary: $healthy healthy, $unhealthy unhealthy"
echo ""

# Return exit code based on health
if [ $unhealthy -gt 0 ]; then
  exit 1
else
  exit 0
fi
