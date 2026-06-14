#!/bin/bash
# Hotel Ecosystem - Start All Services
# Usage: ./start-hotel-services.sh [port]

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$BASE_DIR/../"

# Service registry: port, name, working_dir
SERVICES=(
  "4005:rez-hotel-pos-service:rez-hotel-pos-service"
  "4015:rez-hotel-service:rez-hotel-service"
  "4016:rez-stayown-service:../StayOwn-Hospitality/rez-stayown-service"
  "4017:rez-mind-hotel-service:rez-mind-hotel-service"
  "4018:rez-hotel-messaging-service:rez-hotel-messaging-service"
  "4019:rez-hotel-maintenance-service:rez-hotel-maintenance-service"
  "4020:rez-hotel-reviews-service:rez-hotel-reviews-service"
  "4021:rez-channel-integration-service:rez-channel-integration-service"
  "4022:rez-pricing-service:rez-pricing-service"
  "4023:rez-hotel-analytics-service:rez-hotel-analytics-service"
  "4024:rez-google-hotel-ads-service:rez-google-hotel-ads-service"
  "4025:rez-smart-lock-service:rez-smart-lock-service"
  "4026:rez-booking-modification-service:rez-booking-modification-service"
  "4027:rez-inventory-sync-service:rez-inventory-sync-service"
  "4028:rez-language-service:rez-language-service"
  "4029:rez-developer-portal:rez-developer-portal"
  "4030:rez-survey-service:rez-survey-service"
  "4031:rez-pms-service:rez-pms-service"
  "4032:rez-payment-gateway-service:rez-payment-gateway-service"
  "4033:rez-rate-shopping-service:rez-rate-shopping-service"
  "4034:rez-virtual-concierge-service:rez-virtual-concierge-service"
  "4035:rez-currency-service:rez-currency-service"
  "4036:rez-staff-scheduling-service:rez-staff-scheduling-service"
  "4037:rez-loyalty-service:rez-loyalty-service"
  "4038:rez-staff-app-offline-service:rez-staff-app-offline-service"
)

start_service() {
  local port=$1
  local name=$2
  local dir=$3
  local full_path="$SERVICE_DIR/$dir"

  if [ ! -d "$full_path" ]; then
    echo "⚠️  Port $port | $name | NOT FOUND"
    return 1
  fi

  # Check if already running
  if lsof -i ":$port" > /dev/null 2>&1; then
    echo "⏳ Port $port | $name | ALREADY RUNNING"
    return 0
  fi

  # Start service
  cd "$full_path"

  # Check for package.json
  if [ ! -f "package.json" ]; then
    echo "⚠️  Port $port | $name | NO package.json"
    return 1
  fi

  # Start in background
  nohup npm start > /tmp/hotel-$port.log 2>&1 &
  echo "🚀 Port $port | $name | STARTING..."

  return 0
}

check_health() {
  local port=$1
  local retries=10
  local count=0

  while [ $count -lt $retries ]; do
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
    count=$((count + 1))
  done
  return 1
}

# Main
ACTION=${1:-start}

case $ACTION in
  start)
    echo "🚀 Starting Hotel Ecosystem Services..."
    echo "======================================"
    for entry in "${SERVICES[@]}"; do
      IFS=':' read -r port name dir <<< "$entry"
      start_service "$port" "$name" "$dir"
    done
    echo ""
    echo "⏳ Waiting for services to initialize (15s)..."
    sleep 15
    ;;
  health)
    echo "🏥 Checking Service Health..."
    echo "============================="
    for entry in "${SERVICES[@]}"; do
      IFS=':' read -r port name dir <<< "$entry"
      if check_health "$port"; then
        echo "✅ Port $port | $name | HEALTHY"
      else
        echo "❌ Port $port | $name | UNHEALTHY"
      fi
    done
    ;;
  stop)
    echo "🛑 Stopping Hotel Ecosystem Services..."
    for entry in "${SERVICES[@]}"; do
      IFS=':' read -r port name dir <<< "$entry"
      if lsof -i ":$port" > /dev/null 2>&1; then
        pid=$(lsof -ti ":$port")
        kill $pid 2>/dev/null || true
        echo "🛑 Port $port | $name | STOPPED"
      fi
    done
    ;;
  status)
    echo "📊 Hotel Services Status"
    echo "======================="
    for entry in "${SERVICES[@]}"; do
      IFS=':' read -r port name dir <<< "$entry"
      if lsof -i ":$port" > /dev/null 2>&1; then
        echo "🟢 Port $port | $name | RUNNING"
      else
        echo "🔴 Port $port | $name | STOPPED"
      fi
    done
    ;;
  *)
    echo "Usage: $0 {start|health|stop|status}"
    exit 1
    ;;
esac
