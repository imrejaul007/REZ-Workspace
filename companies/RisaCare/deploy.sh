#!/bin/bash
set -e

echo "=========================================="
echo "RisaCare Deployment Script"
echo "=========================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Services to deploy
SERVICES=(
  "risa-care-api-gateway:4700"
  "risa-care-records-service:4702"
  "risa-care-ai-service:4703"
  "risa-care-profile-service:4704"
  "risa-care-booking-service:4705"
  "risa-care-marketplace-service:4706"
  "risa-care-wellness-service:4707"
  "risa-care-corporate-service:4708"
)

# Parse arguments
ENV=${1:-development}
ACTION=${2:-start}

usage() {
  echo "Usage: ./deploy.sh <environment> <action>"
  echo "  environment: development | staging | production"
  echo "  action: start | stop | restart | logs"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh development start"
  echo "  ./deploy.sh production restart"
  exit 1
}

# Check environment
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
  usage
fi

# Check action
if [[ ! "$ACTION" =~ ^(start|stop|restart|logs)$ ]]; then
  echo -e "${RED}Error: Invalid action '$ACTION'${NC}"
  usage
fi

echo -e "${GREEN}Environment: $ENV${NC}"
echo -e "${GREEN}Action: $ACTION${NC}"
echo ""

# Load environment variables
if [ -f ".env.$ENV" ]; then
  echo "Loading environment from .env.$ENV"
  export $(cat .env.$ENV | grep -v '^#' | xargs)
else
  echo -e "${YELLOW}Warning: .env.$ENV not found, using .env if available${NC}"
  if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
  fi
fi

case $ACTION in
  start)
    echo -e "${GREEN}Starting all services...${NC}"
    for service_info in "${SERVICES[@]}"; do
      IFS=':' read -r service port <<< "$service_info"
      echo "Starting $service on port $port..."
      cd "$service"
      npm run dev &
      cd ..
    done
    echo ""
    echo -e "${GREEN}All services started!${NC}"
    echo "API Gateway: http://localhost:4700/health/v1"
    ;;

  stop)
    echo -e "${YELLOW}Stopping all services...${NC}"
    pkill -f "tsx watch" || true
    pkill -f "node.*risa-care" || true
    echo -e "${GREEN}All services stopped.${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting all services...${NC}"
    $0 $ENV stop
    sleep 2
    $0 $ENV start
    ;;

  logs)
    echo -e "${GREEN}Following logs...${NC}"
    tail -f */logs/*.log 2>/dev/null || echo "No log files found"
    ;;
esac

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
