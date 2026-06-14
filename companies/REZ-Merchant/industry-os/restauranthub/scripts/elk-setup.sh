#!/bin/bash

# RestaurantHub ELK Stack Setup and Management Script

set -e

# Configuration
ELK_DIR="/Users/rejaulkarim/Documents/Resturistan App/restauranthub/docker/logging"
LOG_FILE="./logs/elk-setup.log"
KIBANA_URL="http://localhost:5601"
ELASTICSEARCH_URL="http://localhost:9200"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create log directory
mkdir -p "./logs"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✓ $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} ✗ $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠ $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if Docker is running
check_docker() {
    step "Checking Docker availability..."

    if ! docker --version > /dev/null 2>&1; then
        error "Docker is not installed or not running"
        return 1
    fi

    if ! docker info > /dev/null 2>&1; then
        error "Docker daemon is not running"
        return 1
    fi

    success "Docker is available and running"
    return 0
}

# Function to check system resources
check_system_resources() {
    step "Checking system resources..."

    # Check available memory (ELK stack needs at least 4GB)
    local available_memory=$(free -m 2>/dev/null | awk 'NR==2{printf "%.0f", $7}' || echo "4000")

    if [ "$available_memory" -lt 3000 ]; then
        warning "Available memory is low: ${available_memory}MB. ELK stack may run slowly."
    else
        success "Available memory: ${available_memory}MB"
    fi

    # Check disk space
    local available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')

    if [ "$available_space" -lt 10 ]; then
        warning "Available disk space is low: ${available_space}GB"
    else
        success "Available disk space: ${available_space}GB"
    fi

    return 0
}

# Function to setup vm.max_map_count for Elasticsearch
setup_elasticsearch_config() {
    step "Setting up Elasticsearch system configuration..."

    # Check current vm.max_map_count
    local current_max_map_count=$(sysctl vm.max_map_count 2>/dev/null | awk '{print $3}' || echo "0")

    if [ "$current_max_map_count" -lt 262144 ]; then
        log "Current vm.max_map_count: $current_max_map_count"
        log "Elasticsearch requires vm.max_map_count to be at least 262144"

        # For macOS/Docker Desktop
        if [[ "$OSTYPE" == "darwin"* ]]; then
            warning "On macOS, you may need to configure Docker Desktop resources"
            log "Go to Docker Desktop → Settings → Resources → Advanced"
            log "Increase memory to at least 4GB and swap to 1GB"
        else
            # For Linux systems
            log "Attempting to set vm.max_map_count=262144"
            if sudo sysctl -w vm.max_map_count=262144; then
                success "vm.max_map_count updated"
            else
                warning "Could not update vm.max_map_count. Run: sudo sysctl -w vm.max_map_count=262144"
            fi
        fi
    else
        success "vm.max_map_count is properly configured: $current_max_map_count"
    fi
}

# Function to start ELK stack
start_elk_stack() {
    step "Starting ELK stack..."

    cd "$ELK_DIR"

    # Pull latest images
    log "Pulling latest ELK images..."
    docker-compose pull

    # Start the stack
    log "Starting ELK services..."
    docker-compose up -d

    # Wait for services to be ready
    wait_for_services

    success "ELK stack started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    step "Waiting for services to be ready..."

    # Wait for Elasticsearch
    log "Waiting for Elasticsearch..."
    local elasticsearch_ready=false
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1; then
            elasticsearch_ready=true
            break
        fi
        log "Elasticsearch not ready, attempt $attempt/$max_attempts"
        sleep 10
        attempt=$((attempt + 1))
    done

    if [ "$elasticsearch_ready" = true ]; then
        success "Elasticsearch is ready"
    else
        error "Elasticsearch failed to start within timeout"
        return 1
    fi

    # Wait for Kibana
    log "Waiting for Kibana..."
    local kibana_ready=false
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f "$KIBANA_URL/api/status" > /dev/null 2>&1; then
            kibana_ready=true
            break
        fi
        log "Kibana not ready, attempt $attempt/$max_attempts"
        sleep 10
        attempt=$((attempt + 1))
    done

    if [ "$kibana_ready" = true ]; then
        success "Kibana is ready"
    else
        error "Kibana failed to start within timeout"
        return 1
    fi

    return 0
}

# Function to setup index templates
setup_index_templates() {
    step "Setting up Elasticsearch index templates..."

    # RestaurantHub application logs template
    curl -X PUT "$ELASTICSEARCH_URL/_index_template/restauranthub-logs" \
         -H "Content-Type: application/json" \
         -d '{
           "index_patterns": ["restauranthub-*"],
           "priority": 100,
           "template": {
             "settings": {
               "number_of_shards": 1,
               "number_of_replicas": 0,
               "index.refresh_interval": "5s"
             },
             "mappings": {
               "properties": {
                 "@timestamp": { "type": "date" },
                 "level": { "type": "keyword" },
                 "message": { "type": "text" },
                 "service": { "type": "keyword" },
                 "environment": { "type": "keyword" },
                 "logtype": { "type": "keyword" },
                 "user_id": { "type": "keyword" },
                 "request_id": { "type": "keyword" },
                 "response_time": { "type": "long" },
                 "status_code": { "type": "integer" },
                 "method": { "type": "keyword" },
                 "url": { "type": "keyword" },
                 "ip": { "type": "ip" }
               }
             }
           }
         }' > /dev/null 2>&1

    success "Index templates created"
}

# Function to create Kibana dashboards
setup_kibana_dashboards() {
    step "Setting up Kibana dashboards and visualizations..."

    # Wait a bit more for Kibana to be fully ready
    sleep 30

    # Create data views (index patterns)
    curl -X POST "$KIBANA_URL/api/data_views/data_view" \
         -H "Content-Type: application/json" \
         -H "kbn-xsrf: true" \
         -d '{
           "data_view": {
             "title": "restauranthub-*",
             "name": "RestaurantHub Logs",
             "timeFieldName": "@timestamp"
           }
         }' > /dev/null 2>&1

    # Create saved searches
    curl -X POST "$KIBANA_URL/api/saved_objects/search" \
         -H "Content-Type: application/json" \
         -H "kbn-xsrf: true" \
         -d '{
           "attributes": {
             "title": "RestaurantHub Error Logs",
             "description": "All error level logs from RestaurantHub",
             "columns": ["@timestamp", "level", "service", "message"],
             "sort": [["@timestamp", "desc"]],
             "kibanaSavedObjectMeta": {
               "searchSourceJSON": "{\"query\":{\"match\":{\"level\":\"ERROR\"}},\"filter\":[]}"
             }
           }
         }' > /dev/null 2>&1

    success "Kibana dashboards and visualizations created"
}

# Function to test log ingestion
test_log_ingestion() {
    step "Testing log ingestion..."

    # Send test log entries
    curl -X POST "$ELASTICSEARCH_URL/restauranthub-test-$(date +%Y.%m.%d)/_doc" \
         -H "Content-Type: application/json" \
         -d '{
           "@timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
           "level": "INFO",
           "service": "restauranthub-api",
           "environment": "development",
           "logtype": "application",
           "message": "ELK stack test log entry",
           "request_id": "test-123",
           "user_id": "test-user"
         }' > /dev/null 2>&1

    curl -X POST "$ELASTICSEARCH_URL/restauranthub-test-$(date +%Y.%m.%d)/_doc" \
         -H "Content-Type: application/json" \
         -d '{
           "@timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
           "level": "ERROR",
           "service": "restauranthub-api",
           "environment": "development",
           "logtype": "error",
           "message": "Test error log entry for ELK validation",
           "error_type": "TestError",
           "stack_trace": "TestError: This is a test\n    at test (/app/test.js:1:1)"
         }' > /dev/null 2>&1

    # Refresh index
    curl -X POST "$ELASTICSEARCH_URL/restauranthub-test-$(date +%Y.%m.%d)/_refresh" > /dev/null 2>&1

    # Check if logs are indexed
    sleep 5
    local log_count=$(curl -s "$ELASTICSEARCH_URL/restauranthub-test-$(date +%Y.%m.%d)/_count" | jq -r '.count' 2>/dev/null || echo "0")

    if [ "$log_count" -gt 0 ]; then
        success "Log ingestion test successful ($log_count documents indexed)"
    else
        error "Log ingestion test failed"
        return 1
    fi

    return 0
}

# Function to display service URLs
display_service_info() {
    step "ELK Stack Service Information"

    echo ""
    echo "=================================================="
    echo "🚀 RestaurantHub ELK Stack Ready!"
    echo "=================================================="
    echo ""
    echo "📊 Kibana Dashboard:     $KIBANA_URL"
    echo "🔍 Elasticsearch:        $ELASTICSEARCH_URL"
    echo "📝 Logstash:            http://localhost:5044"
    echo "📈 APM Server:          http://localhost:8200"
    echo ""
    echo "=================================================="
    echo "📋 Quick Start Guide"
    echo "=================================================="
    echo ""
    echo "1. Open Kibana: $KIBANA_URL"
    echo "2. Go to 'Discover' to view logs"
    echo "3. Use index pattern: restauranthub-*"
    echo "4. Create visualizations in 'Visualize'"
    echo "5. Build dashboards in 'Dashboard'"
    echo ""
    echo "📁 Log Directories:"
    echo "   - Application logs: ./logs/"
    echo "   - ELK service logs: Docker container logs"
    echo ""
    echo "🔧 Management:"
    echo "   - Start: $0 start"
    echo "   - Stop: $0 stop"
    echo "   - Status: $0 status"
    echo "   - Restart: $0 restart"
    echo ""
    echo "=================================================="
}

# Function to check service status
check_service_status() {
    step "Checking ELK stack status..."

    cd "$ELK_DIR"

    # Check Docker services
    local services_status=$(docker-compose ps --format json 2>/dev/null | jq -r '.Name + ": " + .State' 2>/dev/null || echo "Services not found")

    echo ""
    echo "Docker Services Status:"
    echo "$services_status"
    echo ""

    # Check service health
    echo "Service Health Checks:"

    # Elasticsearch
    if curl -f "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1; then
        echo "✓ Elasticsearch: Healthy"
    else
        echo "✗ Elasticsearch: Unhealthy"
    fi

    # Kibana
    if curl -f "$KIBANA_URL/api/status" > /dev/null 2>&1; then
        echo "✓ Kibana: Healthy"
    else
        echo "✗ Kibana: Unhealthy"
    fi

    # APM Server
    if curl -f "http://localhost:8200/" > /dev/null 2>&1; then
        echo "✓ APM Server: Healthy"
    else
        echo "✗ APM Server: Unhealthy"
    fi

    echo ""
}

# Function to stop ELK stack
stop_elk_stack() {
    step "Stopping ELK stack..."

    cd "$ELK_DIR"
    docker-compose down

    success "ELK stack stopped"
}

# Function to restart ELK stack
restart_elk_stack() {
    step "Restarting ELK stack..."

    stop_elk_stack
    sleep 5
    start_elk_stack

    success "ELK stack restarted"
}

# Main function
main() {
    local command="${1:-setup}"

    log "=== RestaurantHub ELK Stack Management ==="

    case "$command" in
        "setup")
            check_docker || exit 1
            check_system_resources
            setup_elasticsearch_config
            start_elk_stack
            setup_index_templates
            setup_kibana_dashboards
            test_log_ingestion
            display_service_info
            ;;

        "start")
            check_docker || exit 1
            start_elk_stack
            display_service_info
            ;;

        "stop")
            stop_elk_stack
            ;;

        "restart")
            check_docker || exit 1
            restart_elk_stack
            display_service_info
            ;;

        "status")
            check_service_status
            ;;

        "test")
            test_log_ingestion
            ;;

        *)
            echo "Usage: $0 {setup|start|stop|restart|status|test}"
            echo ""
            echo "Commands:"
            echo "  setup   - Full ELK stack setup and configuration"
            echo "  start   - Start ELK stack services"
            echo "  stop    - Stop ELK stack services"
            echo "  restart - Restart ELK stack services"
            echo "  status  - Check service status"
            echo "  test    - Test log ingestion"
            exit 1
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi